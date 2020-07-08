import React, { Component } from 'react';
import EditorComponent from '../Components/Editor/EditorComponent';
import helper from '../utils/editor';

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
            videoChat: false,
            runCodeDisabled: false,
            videoSocket: null,
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        helper.subscribeDoc(serverURL, id, this, websocketURL);
    }

    // Monaco editor onChange()
    editorOnChange = (newValue, e) => {
        helper.binding._inputListener(newValue, e);
        this.setState({ code: newValue });
    }

    // Handler for Run Code button
    handleRun = () => {
        this.setState({ runCodeDisabled: true });
        helper.runCode(serverURL, this.props.match.params.id, this.state.input, this.state.output)
            .then(res => {
                this.setState({ output: res.output, runCodeDisabled: false });
            }).catch(err => {
                this.setState({ runCodeDisabled: false });
            });
    }

    handleInput = (e) => {
        helper.binding._inoutListener(this.state.input, e.target.value, 'input');
        this.setState({ input: e.target.value });
    }

    handleLang = value => {
        helper.binding._inoutListener(this.state.lang, value, 'lang');
        this.setState({ lang: value });
    }

    handleVideoChat = () => {
        if (this.state.videoChat)
            this.state.videoSocket.send(JSON.stringify({ endCall: true }));
        this.setState({ videoChat: !this.state.videoChat });
    }

    handleVideoSocket = videoSocket => {
        this.setState({ videoSocket });
    }

    render() {
        const { videoChat, lang, code, input, output, runCodeDisabled, videoSocket } = this.state;
        return (
            <EditorComponent
                videoChat={videoChat}
                lang={lang}
                code={code}
                input={input}
                output={output}
                runCodeDisabled={runCodeDisabled}
                videoSocket={videoSocket}
                handleVideoChat={this.handleVideoChat}
                editorDidMount={helper.editorDidMount}
                editorOnChange={this.editorOnChange}
                handleLang={this.handleLang}
                handleRun={this.handleRun}
                handleInput={this.handleInput}
                handleVideoSocket={this.handleVideoSocket}
            />
        );
    }
}

export default Editor;
