import React, { Component } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import VideoChatComponent from '../Components/VideoChat/videoChatComponent';
import VideoHelper from './VideoHelper';

const websocketURL = process.env.REACT_APP_WEB_SOCKET_URL;

class VideoChat extends Component {
    constructor(props) {
        super(props);
        this.remoteRef = React.createRef();
        this.localRef = React.createRef();
        this.draggableRef = React.createRef();

        this.state = {
            videoSocket: null,
            pc: null,
            controls: {
                video: true,
                audio: true
            },
            peerConnected: false,
            gotMediaDevice: false,
            connecting: false,
        }
    }

    componentDidMount() {
        const videoSocket = new ReconnectingWebSocket(websocketURL + '/foo');

        videoSocket.addEventListener('open', event => {
            console.log('connected to video server')
        });

        let pc = VideoHelper.peerConnectionInit(videoSocket);
        pc.ontrack = this.addTrack;

        const mediaStreamConstraints = {
            video: true,
            audio: true
        };

        // Initializes media stream.
        let localMediaStream = null;
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then(mediaStream => {
            // Handles success by adding the MediaStream to the video element.
            this.setState({ videoSocket, pc, gotMediaDevice: true });

            // this.localRef.current.srcObject = mediaStream;
            this.remoteRef.current.srcObject = mediaStream;
            localMediaStream = mediaStream;

            mediaStream.getTracks().forEach(track => {
                this.state.pc.addTrack(track, mediaStream);
            });
            // pc.addStream(mediaStream);
        }).catch(VideoHelper.handleLocalMediaStreamError);

        videoSocket.addEventListener('message', event => {
            const on = JSON.parse(event.data);
            if (on['offerMade']) {
                this.setState({ connecting: true });
                console.log('offer made');
                // other person listens to offerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['offerMade'].offer)).then(() => {
                    console.log('remote description set');
                    this.createAnswer(localMediaStream);
                }).catch(VideoHelper.error);

            }
            else if (on['answerMade']) {
                console.log('answer made');
                // I listen to answerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['answerMade'].answer)).then(() => {
                    console.log('remote description set')
                    this.localRef.current.srcObject = localMediaStream;
                    this.setState({ peerConnected: true });
                }).catch(VideoHelper.error);
            }
            else if (on['candidate']) {
                console.log(`adding ${on['candidate'].length} candidates`);
                on['candidate'].map(candidate => VideoHelper.addIceCandidate(candidate));
                this.setState({ connecting: false });
            }
        });

    }

    componentWillUnmount() {
        if (this.localRef.current.srcObject)
            this.localRef.current.srcObject.getTracks().forEach(track => track.stop());
        if (this.remoteRef.current.srcObject)
            this.remoteRef.current.srcObject.getTracks().forEach(track => track.stop());
        this.state.pc.close();
        this.state.videoSocket.close();
    }

    addTrack = event => {
        console.log('connect to peer');
        this.remoteRef.current.srcObject = event.streams[0];
    }

    createOffer = () => {
        this.setState({ connecting: true });
        VideoHelper.createOffer();
    }

    createAnswer = (localMediaStream) => {
        console.log('answer');
        this.state.pc.createAnswer().then(sdp => {
            this.state.pc.setLocalDescription(new RTCSessionDescription(sdp)).then(() => {
                this.state.videoSocket.send(JSON.stringify({ makeAnswer: { answer: sdp } }));
                this.localRef.current.srcObject = localMediaStream;
                this.setState({ peerConnected: true });
            }).catch(VideoHelper.error)
        }).catch(VideoHelper.error);
    }

    toggleVideo = () => {
        const controls = { ...this.state.controls };
        this.localRef.current.srcObject.getVideoTracks()[0].enabled = !controls.video;
        this.setState({ controls: { video: !controls.video, audio: controls.audio } });
    }

    toggleAudio = () => {
        const controls = { ...this.state.controls };
        this.localRef.current.srcObject.getAudioTracks()[0].enabled = !controls.audio;
        this.setState({ controls: { ...this.state.controls, audio: !controls.audio } });
    }

    render() {
        const { controls, peerConnected, gotMediaDevice, connecting } = this.state;
        return (
            <VideoChatComponent
                draggableRef={this.draggableRef}
                remoteRef={this.remoteRef}
                localRef={this.localRef}
                peerConnected={peerConnected}
                controls={controls}
                gotMediaDevice={gotMediaDevice}
                connecting={connecting}
                toggleVideo={this.toggleVideo}
                toggleAudio={this.toggleAudio}
                createOffer={this.createOffer}
            />
        );
    }
}

export default VideoChat;