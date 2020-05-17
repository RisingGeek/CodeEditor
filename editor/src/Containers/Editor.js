import React, { Component } from 'react';
import EditorComponent from '../Components/EditorComponent';
import axios from 'axios';
import MonacoEditor from 'react-monaco-editor';

// automatically reconnects if the connection is closed
import ReconnectingWebSocket from 'reconnecting-websocket';
import shareDB from 'sharedb/lib/client';
import getEnv from '../environment';

const isDev = getEnv();
const serverURL = isDev ? process.env.REACT_APP_DEV_SERVER_URL : process.env.REACT_APP_PROD_SERVER_URL;
const websocketURL = isDev ? process.env.REACT_APP_DEV_WEB_SOCKET_URL : process.env.REACT_APP_PROD_WEB_SOCKET_URL;


console.log(process.env)
//open websocket connection to shareDB server
const rws = new ReconnectingWebSocket(websocketURL);
const connection = new shareDB.Connection(rws);
//create local doc instance mapped to 'examples' collection document with id 'textarea'
const doc = connection.get('examples', 'textarea');

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            code: '// type some code here',
            input: '',
            output: '',
        }
    }

    componentDidMount() {
        // subscribe to changes
        doc.subscribe(this.showNumbers);
        //when document changes by this client or other or server, update the number on page
        doc.on('op', this.showNumbers);
    }

    //populate fields on doc
    showNumbers = () => {
        this.setState({ code: doc.data.content[0] });
    }

    editorDidMount = (editor, monaco) => {
        editor.focus();
    }

    onChange = (newValue, e) => {
        // console.log(e);
        // console.log('onchange',{newValue}, {e});
        doc.submitOp([{ p: ['content',0], ld: this.state.code[0], li: newValue }]); //p: PATH
    }

    handleRun = () => {
        // Convert array of codes into a single string
        const code = this.state.code;
        console.log(code);
        // Send API call to run code
        axios.post(serverURL+'/code/run', {
            code: code,
            input: this.state.input,
            id: 123
        }).then(response => {
            console.log(response.data);
            this.setState({output: response.data});
        }).catch(err => {
            console.log(String(err.response.data));
        })
    }

    handleInputChange = (e) => {
        this.setState({input: e.target.value});
    }

    render() {
        const code = this.state.code;
        const input = this.state.input;
        const output = this.state.output;
        const options = {
            selectOnLineNumbers: true, // Select line by clicking on line number
            minimap: {
                enabled: false
            }
        }
        return (
            <React.Fragment>
            <MonacoEditor
            width="600"
            height="400"
            language="cpp"
            theme="vs-dark"
            value={code}
            options={options}
            onChange={this.onChange}
            editorDidMount={this.editorDidMount}
            />
            <button onClick={this.handleRun}>run code</button>
            <div>input:</div>
            <textarea value={input} onChange={this.handleInputChange}></textarea>
            <div>output:</div>
            <textarea value={output} readOnly={true}></textarea>
            </React.Fragment>
        );
    }
}

export default Editor;