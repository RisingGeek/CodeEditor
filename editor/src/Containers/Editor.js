import React, { Component } from 'react';
import EditorComponent from '../Components/Editor/EditorComponent';
import axios from 'axios';
// automatically reconnects if the connection is closed
import ReconnectingWebSocket from 'reconnecting-websocket';
import shareDB from 'sharedb/lib/client';
import StringBinding from '../EditorBinding/StringBinding';
import { Row, Col, notification } from 'antd';
import SideDrawer from '../Components/SideDrawer/SideDrawer';
import VideoChat from './VideoChat';

const serverURL = process.env.REACT_APP_SERVER_URL;
const websocketURL = process.env.REACT_APP_WEB_SOCKET_URL;

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            code: '',
            input: '',
            output: '',
            lang: 'cpp',
            editor: null,
            monaco: null,
            binding: null,
            videoChat: false,
            runCodeDisabled: false,
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        axios.post(serverURL, {
            id: id
        }).then(res => {
            //open websocket connection to shareDB server
            const rws = new ReconnectingWebSocket(websocketURL + '/bar');
            const connection = new shareDB.Connection(rws);
            //create local doc instance mapped to 'examples' collection document with id 'textarea'
            const doc = connection.get('examples', id);

            doc.subscribe((err) => {
                if (err) throw err;
                const presence = connection.getPresence('examples');
                presence.subscribe(err => {
                    if (err) throw err;
                });
                let localPresence = presence.create();

                let binding = new StringBinding(this, doc, ['content'], localPresence);
                binding.setup(this);

                presence.on('receive', (id, range) => {
                    if (!range) return;
                    let isPos = range.startLineNumber === range.endLineNumber &&
                        range.startColumn === range.endColumn;
                    binding.decorations = this.state.editor.deltaDecorations(binding.decorations, [
                        {
                            range: new this.state.monaco.Range(range.startLineNumber, range.startColumn,
                                range.endLineNumber, range.endColumn),
                            options: { className: isPos ? 'cursor-position' : 'cursor-selection' }
                        }
                    ]);
                    // console.log(this.state.editor.getModel().getAllDecorations())
                    binding.range = range;
                });



                this.setState({ binding });
            });
        }).catch(err => {
            console.log(err)
            notification.error({
                message: err.toString(),
            });
        });
    }

    editorDidMount = (editor, monaco) => {
        editor.focus();
        // Set end of line preference
        editor.getModel().pushEOL(0);

        let setup = true;
        editor.onDidChangeCursorSelection((e) => {
            // Setup initial cursor position
            if (setup) {
                let pos = editor.getPosition();
                editor.setSelection(new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column));
                setup = false;
                return;
            }
            // console.log(e);
            if (this.state.binding.localPresence) {
                this.state.binding.localPresence.submit(e.selection, err => {
                    if (err) throw err;
                });
            }
        });

        this.setState({ editor, monaco });
    }

    // Monaco editor onChange()
    editorOnChange = (newValue, e) => {
        this.state.binding._inputListener(newValue, e);
        this.setState({ code: newValue });
    }

    // Handler for Run Code button
    handleRun = () => {
        this.setState({ runCodeDisabled: true });
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
            this.setState({ output: response.data, runCodeDisabled: false });

        }).catch(err => {
            if (!err.response) {
                notification.error({
                    message: err.toString(),
                });
                this.setState({ runCodeDisabled: false });
            }
            else if (err.response.status === 400) {
                this.state.binding._inoutListener(this.state.output, err.response.data, 'output');
                this.setState({ output: err.response.data, runCodeDisabled: false });
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

    handleVideoChat = () => {
        this.setState({ videoChat: !this.state.videoChat });
    }

    render() {
        const { videoChat } = this.state;
        return (
            <Row gutter={0}>
                <Col span={20}>
                    {videoChat && <VideoChat
                        videoChat={videoChat}
                        handleVideoChat={this.handleVideoChat}
                    />}
                    <EditorComponent
                        code={this.state.code}
                        lang={this.state.lang}
                        editorDidMount={this.editorDidMount}
                        editorOnChange={this.editorOnChange}
                    />
                </Col>
                <Col span={4}>
                    <SideDrawer
                        input={this.state.input}
                        output={this.state.output}
                        videoChat={videoChat}
                        runCodeDisabled={this.state.runCodeDisabled}
                        lang={this.state.lang}
                        handleLang={this.handleLang}
                        handleRun={this.handleRun}
                        handleInput={this.handleInput}
                        handleVideoChat={this.handleVideoChat}
                    />
                </Col>
            </Row>
        );
    }
}

export default Editor;