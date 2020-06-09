import React, { Component } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

import getEnv from '../environment';

const isDev = getEnv();
const websocketURL = isDev ? process.env.REACT_APP_DEV_WEB_SOCKET_URL : process.env.REACT_APP_PROD_WEB_SOCKET_URL;

class VideoChat extends Component {
    constructor(props) {
        super(props);
        this.remoteRef = React.createRef();
        this.localRef = React.createRef();
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

        let pc = new window.RTCPeerConnection({
            iceServers: [{
                url: "stun:stun.services.mozilla.com",
                username: "somename",
                credential: "somecredentials"
            }]
        });

        const mediaStreamConstraints = {
            video: true,
        };

        // pc.onaddstream = this.addStream;
        pc.ontrack = this.addTrack;

        // Initializes media stream.
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
            .then(
                (mediaStream) => {
                    // Handles success by adding the MediaStream to the video element.
                    this.localRef.current.srcObject = mediaStream;
                    // console.log({mediaStream})
                    mediaStream.getTracks().forEach(track => {
                        pc.addTrack(track, mediaStream);
                    })
                    // pc.addStream(mediaStream);
                }
            ).catch(this.handleLocalMediaStreamError);

        let connectedToPeer = false;
        videoSocket.addEventListener('message', event => {
            const on = JSON.parse(event.data);
            if (on['offerMade']) {
                // other person listens to offer-made
                // offer = data.offer;
                // console.log(offer);
                pc.setRemoteDescription(new RTCSessionDescription(on['offerMade'].offer), () => {
                    pc.createAnswer((answer) => {
                        pc.setLocalDescription(new RTCSessionDescription(answer), () => {
                            videoSocket.send(JSON.stringify({ makeAnswer: { answer: answer } }));
                        }, this.error);
                    }, this.error);
                }, this.error);

            }
            else if (on['answerMade']) {
                // I listen to answer-made
                pc.setRemoteDescription(new RTCSessionDescription(on['answerMade'].answer), () => {
                    // document.getElementById(data.socket).setAttribute('class', 'active');
                    if (!connectedToPeer) {
                        // I make offer
                        this.createOffer();
                        connectedToPeer = true;
                        // answersFrom[data.socket] = true;
                    }
                }, this.error);
            }
        });

        this.setState({ videoSocket, pc })
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
        console.log(this.state.pc)
        this.state.pc.createOffer((offer) => {
            this.state.pc.setLocalDescription(new RTCSessionDescription(offer), () => {
                // I make offer
                this.state.videoSocket.send(JSON.stringify({ makeOffer: { offer: offer } }));
            }, this.error);
        }, this.error);

    }

    render() {
        // console.log(this)
        return (
            <div>
                <video id="local" ref={this.localRef} autoPlay={true}></video>
                <video id="remote" ref={this.remoteRef} autoPlay={true}></video>
                <button onClick={this.createOffer}>click</button>
            </div>
        );
    }
}

export default VideoChat;