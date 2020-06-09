import React, { Component } from 'react';
import EditorComponent from '../Components/EditorComponent';
import axios from 'axios';

// automatically reconnects if the connection is closed
import ReconnectingWebSocket from 'reconnecting-websocket';
import shareDB from 'sharedb/lib/client';
import StringBinding from './stringBinding';
import getEnv from '../environment';

const isDev = getEnv();
const serverURL = isDev ? process.env.REACT_APP_DEV_SERVER_URL : process.env.REACT_APP_PROD_SERVER_URL;
const websocketURL = isDev ? process.env.REACT_APP_DEV_WEB_SOCKET_URL : process.env.REACT_APP_PROD_WEB_SOCKET_URL;

class Editor extends Component {
    constructor(props) {
        super(props);
        this.remoteVideo = React.createRef();
        this.localVideo = React.createRef();
        this.state = {
            code: '',
            input: '',
            output: '',
            lang: 'cpp',
            editor: null,
            monaco: null,
            binding: null,
            videoSocket: null,
            pc: null
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        axios.post(serverURL, {
            id: id
        }).then(res => {
            const videoSocket = new ReconnectingWebSocket(websocketURL + '/foo');
            videoSocket.addEventListener('open', event => {
                console.log('connected to video server')
                // videoSocket.send(JSON.stringify({ offer: 'this is offer text' }))
                // videoSocket.send(JSON.stringify({answer: 'this is answer text'}))
            })

            var pc = new window.RTCPeerConnection({
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
                        this.localVideo.current.srcObject = mediaStream;
                        // console.log({mediaStream})
                        mediaStream.getTracks().forEach(track => {
                            pc.addTrack(track, mediaStream);
                        })
                        // pc.addStream(mediaStream);
                    }
                ).catch(this.handleLocalMediaStreamError);

            var connectedToPeer = false;
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
            })

            //open websocket connection to shareDB server
            const rws = new ReconnectingWebSocket(websocketURL + '/bar');
            const connection = new shareDB.Connection(rws);
            //create local doc instance mapped to 'examples' collection document with id 'textarea'
            const doc = connection.get('examples', id);

            doc.subscribe((err) => {
                if (err) throw err;
                var binding = new StringBinding(this.state.editor, this, doc, ['content']);
                binding.setup(this);
                this.setState({ binding, videoSocket, pc });
            });
        }).catch(err => {
            console.log('some error occured');
        });
    }

    addTrack = event => {
        console.log('connect to peer');
        this.remoteVideo.current.srcObject = event.streams[0];
        console.log(this.remoteVideo.current.srcObject)
    }

    // Handles error by logging a message to the console with the error message.
    handleLocalMediaStreamError = (error) => {
        console.log('navigator.getUserMedia error: ', error);
    }

    error = (err) => {
        console.warn('Error', err);
    }

    editorDidMount = (editor, monaco) => {
        editor.focus();
        // Set end of line preference
        editor.getModel().pushEOL(0);
        this.setState({ editor, monaco })
    }

    // Monaco editor onChange()
    editorOnChange = (newValue, e) => {
        this.state.binding._inputListener(newValue, e);
        this.setState({ code: newValue });
    }

    // Handler for Run Code button
    handleRun = () => {
        // Convert array of codes into a single string
        const code = this.state.editor.getValue();
        // Send API call to run code
        axios.post(serverURL + '/code/run', {
            code: code,
            input: this.state.input,
            id: this.props.match.params.id,
            lang: this.state.editor.getModel().getLanguageIdentifier().language
        }).then(response => {
            this.state.binding._inoutListener(this.state.output, response.data, 'output');
            this.setState({ output: response.data });

        }).catch(err => {
            if (err.response.status === 400) {
                this.state.binding._inoutListener(this.state.output, err.response.data, 'output');
                this.setState({ output: err.response.data });
            }
        })
    }

    handleInput = (e) => {
        this.state.binding._inoutListener(this.state.input, e.target.value, 'input');
        this.setState({ input: e.target.value });
    }

    handleLang = value => {
        this.state.binding._inoutListener(this.state.lang, value, 'lang');
        this.setState({ lang: value });
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
        // if (this.state.editor)
        //     console.log(this.state.editor.getModel().getLanguageIdentifier())
        return (
            <React.Fragment>
                <video id="local" ref={this.localVideo} autoPlay={true} playsInline={true}></video>
                <video id="remote" ref={this.remoteVideo} autoPlay={true} playsInline={true}></video>
                <button onClick={this.createOffer}>click</button>
                <EditorComponent
                    code={this.state.code}
                    input={this.state.input}
                    output={this.state.output}
                    lang={this.state.lang}
                    editorDidMount={this.editorDidMount}
                    editorOnChange={this.editorOnChange}
                    handleRun={this.handleRun}
                    handleInput={this.handleInput}
                    handleLang={this.handleLang}
                />
            </React.Fragment>
        );
    }
}

export default Editor;