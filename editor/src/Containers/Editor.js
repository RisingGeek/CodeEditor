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
            editor: null,
            monaco: null,
            binding: null,
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
                this.setState({ binding });
            });
        }).catch(err => {
            console.log('some error occured');
        });
    }

    editorDidMount = (editor, monaco) => {
        editor.focus();
        // editor.setSelection(new monaco.Range(1,1,1,1));
        this.setState({ editor, monaco })
    }

    // Monaco editor onChange()
    editorOnChange = (newValue, e) => {
        this.state.binding._inputListener(this.state.code, newValue, e);
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
            id: this.props.match.params.id
        }).then(response => {
            this.state.binding._outListener(this.state.output, response.data);
            this.setState({ output: response.data });

        }).catch(err => {
            if (err.response.status === 400) {
                this.state.binding._outListener(this.state.output, err.response.data);
                this.setState({ output: err.response.data });
            }
        })
    }

    handleInput = (e) => {
        this.state.binding._inListener(this.state.input, e.target.value);
        this.setState({ input: e.target.value });
    }

    render() {
        return (
            <EditorComponent
                code={this.state.code}
                input={this.state.input}
                output={this.state.output}
                editorDidMount={this.editorDidMount}
                editorOnChange={this.editorOnChange}
                handleRun={this.handleRun}
                handleInput={this.handleInput}
            />
        );
    }
}

export default Editor;