import React, { Component } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import Draggable from 'react-draggable';
import styles from './main.module.css';

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
        }
    }

    componentDidMount() {
        const videoSocket = new ReconnectingWebSocket(websocketURL + '/foo');

        videoSocket.addEventListener('open', event => {
            console.log('connected to video server')
        });

        let pc = new window.RTCPeerConnection();

        // pc.onaddstream = this.addStream;
        pc.ontrack = this.addTrack;

        const mediaStreamConstraints = {
            video: true,
        };

        let localMediaStream;
        // Initializes media stream.
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then(mediaStream => {
            // Handles success by adding the MediaStream to the video element.
            // this.localRef.current.srcObject = mediaStream;
            localMediaStream = mediaStream;
            this.remoteRef.current.srcObject = mediaStream;
            mediaStream.getTracks().forEach(track => {
                this.state.pc.addTrack(track, mediaStream);
            })
            // pc.addStream(mediaStream);
        }).catch(this.handleLocalMediaStreamError);

        let connectedToPeer = false;
        videoSocket.addEventListener('message', event => {
            const on = JSON.parse(event.data);
            if (on['offerMade']) {
                console.log('offer made');
                // other person listens to offerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['offerMade'].offer), () => {
                    pc.createAnswer((answer) => {
                        pc.setLocalDescription(new RTCSessionDescription(answer), () => {
                            videoSocket.send(JSON.stringify({ makeAnswer: { answer: answer } }));
                            this.localRef.current.srcObject = localMediaStream
                        }, this.error);
                    }, this.error);
                }, this.error);

            }
            else if (on['answerMade']) {
                console.log('answer made');
                // I listen to answerMade
                pc.setRemoteDescription(new RTCSessionDescription(on['answerMade'].answer), () => {
                    if (!connectedToPeer) {
                        // I make offer
                        this.createOffer();
                        connectedToPeer = true;
                        this.localRef.current.srcObject = localMediaStream;
                    }
                }, this.error);
            }
        });

        this.setState({ videoSocket, pc });
    }

    addTrack = event => {
        console.log('connect to peer');
        this.remoteRef.current.srcObject = event.streams[0];
    }

    // Handles error by logging a message to the console with the error message.
    handleLocalMediaStreamError = (error) => {
        console.log('navigator.getUserMedia error: ', error);
    }

    error = (err) => {
        console.warn('Error', err);
    }

    createOffer = () => {
        console.log('create offer')
        this.state.pc.createOffer((offer) => {
            this.state.pc.setLocalDescription(new RTCSessionDescription(offer), () => {
                // I make offer
                this.state.videoSocket.send(JSON.stringify({ makeOffer: { offer: offer } }));
            }, this.error);
        }, this.error);
    }

    render() {
        return (
            <React.Fragment>
                <Draggable nodeRef={this.draggableRef} defaultPosition={{ x: 900, y: 0 }}>
                    <div className={styles.outer} ref={this.draggableRef}>
                        <div className={styles.remote}>
                            <video className={styles.remoteVideo} ref={this.remoteRef} autoPlay={true}></video>
                            <div className={styles.local}>
                                <video className={styles.localVideo} ref={this.localRef} autoPlay={true}></video>
                            </div>
                        </div>
                    </div>
                </Draggable>
                <button onClick={this.createOffer}>video chat</button>
            </React.Fragment>
        );
    }
}

export default VideoChat;