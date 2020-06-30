import React, { Component } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { notification } from 'antd';
import VideoChatComponent from '../Components/VideoChat/videoChatComponent';

const websocketURL = process.env.REACT_APP_WEB_SOCKET_URL;

var candidates = [];

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
        }
    }

    componentDidMount() {
        const videoSocket = new ReconnectingWebSocket(websocketURL + '/foo');

        videoSocket.addEventListener('open', event => {
            console.log('connected to video server')
        });

        let pc = new window.RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302'
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    username: 'webrtc@live.com',
                    credential: 'muazkh'
                },
            ]
        });

        pc.ontrack = this.addTrack;
        pc.onicecandidate = this.onIceCandidate;
        pc.oniceconnectionstatechange = this.onIceConnectionStateChange;

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
        }).catch(this.handleLocalMediaStreamError);

        videoSocket.addEventListener('message', event => {
            const on = JSON.parse(event.data);
            if (on['offerMade']) {
                console.log('offer made');
                // other person listens to offerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['offerMade'].offer)).then(() => {
                    console.log('remote description set');
                    this.createAnswer(localMediaStream);
                }).catch(this.error);

            }
            else if (on['answerMade']) {
                console.log('answer made');
                // I listen to answerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['answerMade'].answer)).then(() => {
                    console.log('remote description set')
                    this.localRef.current.srcObject = localMediaStream;
                    // console.log(candidates)
                    // this.state.videoSocket.send(JSON.stringify({ candidate: candidates }));
                    this.setState({ peerConnected: true });
                }).catch(this.error);
            }
            else if (on['candidate']) {
                console.log(`adding ${on['candidate'].length} candidates`);
                on['candidate'].map(candidate => this.addIceCandidate(candidate));
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

    onIceCandidate = e => {
        console.log('gathering state: ' + e.target.iceGatheringState);
        if (e.candidate) {
            candidates.push(e.candidate);
        }
        else {
            console.log(candidates)
            this.state.videoSocket.send(JSON.stringify({ candidate: candidates }));
        }
    }

    onIceConnectionStateChange = e => {
        console.log('connection state: ' + e.target.iceConnectionState);
        // if (this.state.pc.iceConnectionState === 'disconnected') {
        //     this.props.handleVideoChat();
        // }
    }

    addIceCandidate = candidate => {
        // console.log('adding candidate', candidate)
        this.state.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    // Handles error by logging a message to the console with the error message.
    handleLocalMediaStreamError = (error) => {
        console.log('navigator.getUserMedia error: ', error);
        notification.error({
            message: error.toString(),
            description: 'Please allow access to camera and microphone',
        })
    }

    error = (err) => {
        console.log('Error', err);
    }

    createOffer = () => {
        console.log('offer')
        this.state.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then(sdp => {
            this.state.pc.setLocalDescription(new RTCSessionDescription(sdp)).then(() => {
                this.state.videoSocket.send(JSON.stringify({ makeOffer: { offer: sdp } }));
            }).catch(this.error);
        }).catch(this.error);
    }

    createAnswer = (localMediaStream) => {
        console.log('answer');
        this.state.pc.createAnswer().then(sdp => {
            this.state.pc.setLocalDescription(new RTCSessionDescription(sdp)).then(() => {
                this.state.videoSocket.send(JSON.stringify({ makeAnswer: { answer: sdp } }));
                this.localRef.current.srcObject = localMediaStream;
                this.setState({ peerConnected: true });
            }).catch(this.error)
        }).catch(this.error);
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
        const { controls, peerConnected, gotMediaDevice } = this.state;
        return (
            <VideoChatComponent
                draggableRef={this.draggableRef}
                remoteRef={this.remoteRef}
                localRef={this.localRef}
                peerConnected={peerConnected}
                controls={controls}
                gotMediaDevice={gotMediaDevice}
                toggleVideo={this.toggleVideo}
                toggleAudio={this.toggleAudio}
                createOffer={this.createOffer}
            />
        );
    }
}

export default VideoChat;
