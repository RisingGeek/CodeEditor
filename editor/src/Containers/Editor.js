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
        this.localVideo = React.createRef();
        this.remoteVideo = React.createRef();
        this.state = {
            code: '',
            input: '',
            output: '',
            lang: 'cpp',
            editor: null,
            monaco: null,
            binding: null,
            connection: null,
            pc: null,
            isOffer: false
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        axios.post(serverURL, {
            id: id
        }).then(res => {
            //open websocket connection to shareDB server
            const rws = new ReconnectingWebSocket(websocketURL);
            const connection = new shareDB.Connection(rws);

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

            // Local stream that will be reproduced on the video.
            let localStream;
            pc.onaddstream = (obj) => {
                console.log('connect to peer');
                this.remoteVideo.current.srcObject = obj.stream;
            }

            // Handles error by logging a message to the console with the error message.
            function handleLocalMediaStreamError(error) {
                console.log('navigator.getUserMedia error: ', error);
            }

            // Initializes media stream.
            navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
                .then((mediaStream) => {
                    localStream = mediaStream;
                    this.localVideo.current.srcObject = mediaStream;
                    console.log({ mediaStream })
                    pc.addStream(mediaStream);
                }).catch(handleLocalMediaStreamError);

            var offer;
            var connectedToPeer = false;
            connection.on('receive', (request) => {
                let data = request.data;
                if (data.offerMade) {
                    // remote
                    request.data = null;
                    if (this.state.isOffer)
                        return;
                    console.log(data.offerMade.offer)
                    offer = data.offerMade.offer;

                    pc.setRemoteDescription(new RTCSessionDescription(data.offerMade.offer), () => {
                        pc.createAnswer((answer) => {
                            console.log(answer);
                            pc.setLocalDescription(new RTCSessionDescription(answer), () => {
                                connection.send({
                                    makeAnswer: {
                                        answer: answer
                                    }
                                });
                            }, this.error);
                        }, this.error);
                    }, this.error);
                    return;
                }
                if (data.answerMade) {
                    // local
                    console.log(data.answerMade)
                    request.data = null;
                    if (!this.state.isOffer)
                        return;
                    pc.setRemoteDescription(new RTCSessionDescription(data.answerMade.answer), () => {
                        // document.getElementById(data.socket).setAttribute('class', 'active');
                        if (!connectedToPeer) {
                            this.createOffer();
                            connectedToPeer = true;
                            // answersFrom[data.socket] = true;
                        }
                    }, this.error);
                    return;
                }
            });

            //create local doc instance mapped to 'examples' collection document with id 'textarea'
            const doc = connection.get('examples', id);

            doc.subscribe((err) => {
                if (err) throw err;
                var binding = new StringBinding(this.state.editor, this, doc, ['content']);
                binding.setup(this);
                this.setState({ binding, connection, pc });
            });

        }).catch(err => {
            console.log('some error occured');
        });
    }

    createOffer = () => {
        this.state.pc.createOffer((offer) => {
            this.state.pc.setLocalDescription(new RTCSessionDescription(offer), () => {
                this.state.connection.send({
                    makeOffer: {
                        offer: offer
                    }
                });
            }, this.error);
        }, this.error);
        this.setState({ isOffer: true });
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
        // this.state.monaco.editor.setModelLanguage(this.state.editor.getModel(), value);
        // console.log(this.state.editor.getModel().getLanguageIdentifier())
        this.state.binding._inoutListener(this.state.lang, value, 'lang');
        this.setState({ lang: value });
    }

    handleClick = () => {
        console.log('button click')
        // this.state.connection.send({ myApp: 'sample value' });
        this.createOffer();
    }

    render() {
        return (
            <React.Fragment>
                <button onClick={this.handleClick}>send video</button>
                <video ref={this.localVideo} autoPlay={true} playsInline={true}></video>
                <video ref={this.remoteVideo} autoPlay={true} playsInline={true}></video>
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