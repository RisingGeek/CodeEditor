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
        this.state = {
            code: '',
            input: '',
            output: '',
            lang: 'cpp',
            editor: null,
            monaco: null,
            binding: null,
            connection: null
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
            //create local doc instance mapped to 'examples' collection document with id 'textarea'
            const doc = connection.get('examples', id);
            
            doc.subscribe((err) => {
                if (err) throw err;
                var binding = new StringBinding(this.state.editor, this, doc, ['content']);
                binding.setup(this);
                this.setState({ binding, connection });
            });
        }).catch(err => {
            console.log('some error occured');
        });
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
        this.setState({code:newValue});
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
        this.setState({lang: value});
    }

    handleClick = () => {
        console.log('button click')
        this.state.connection.send({myApp: 'sample value'});
    }

    render() {
        return (
            <React.Fragment>
                <button onClick={this.handleClick}>click</button>
            <EditorComponent
                code={this.state.code}
                input={this.state.input}
                output={this.state.output}
                lang = {this.state.lang}
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