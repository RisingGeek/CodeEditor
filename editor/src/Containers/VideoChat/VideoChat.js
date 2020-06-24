import React, { Component } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import Draggable from 'react-draggable';
import styles from './main.module.css';
import { notification } from 'antd';

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
        }
    }

    componentDidMount() {
        const videoSocket = new ReconnectingWebSocket(websocketURL + '/foo');

        videoSocket.addEventListener('open', event => {
            console.log('connected to video server')
        });

        let pc = new window.RTCPeerConnection();

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
                    this.createAnswer(localMediaStream);
                }).catch(this.error);

            }
            else if (on['answerMade']) {
                console.log('answer made');
                // I listen to answerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['answerMade'].answer)).then(() => {
                    console.log('remote description set')
                    this.localRef.current.srcObject = localMediaStream;
                    this.setState({ peerConnected: true });
                }).catch(this.error);
            }
            else if (on['candidate']) {
                this.addIceCandidate(on['candidate']);
            }
        });

        this.setState({ videoSocket, pc });
    }

    addTrack = event => {
        console.log('connect to peer');
        this.remoteRef.current.srcObject = event.streams[0];
    }

    onIceCandidate = e => {
        if (e.candidate) {
            console.log(e.candidate);
            this.state.videoSocket.send(JSON.stringify({ candidate: e.candidate }));
        }
    }

    onIceConnectionStateChange = e => {
        console.log(e);
    }

    addIceCandidate = candidate => {
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
        this.state.pc.createOffer().then(sdp => {
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
        const { controls, peerConnected } = this.state;
        return (
            <React.Fragment>
                <Draggable nodeRef={this.draggableRef} >
                    <div className={styles.outer} ref={this.draggableRef}>
                        <div className={styles.remote}>
                            <video className={styles.remoteVideo} ref={this.remoteRef} autoPlay={true} muted={!peerConnected}></video>
                            <div className={styles.local}>
                                <video className={styles.localVideo} ref={this.localRef} autoPlay={true} muted={true}></video>
                            </div>
                            {peerConnected &&
                                <div className={styles.controls}>
                                    <button className="btn_primary" onClick={this.toggleVideo}>
                                        {controls.video ? "Video On" : "Video Off"}
                                    </button>
                                    <button className="btn_primary" onClick={this.toggleAudio}>
                                        {controls.audio ? "Audio On" : "Audio Off"}
                                    </button>
                                </div>
                            }
                            {!peerConnected &&
                                <div className={styles.connect}>
                                    <button className="btn_primary" onClick={this.createOffer}>start call</button>
                                </div>
                            }
                        </div>

                    </div>
                </Draggable>
            </React.Fragment>
        );
    }
}

export default VideoChat;
