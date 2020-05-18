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

//open websocket connection to shareDB server
const rws = new ReconnectingWebSocket(websocketURL);
const connection = new shareDB.Connection(rws);
//create local doc instance mapped to 'examples' collection document with id 'textarea'
const doc = connection.get('examples', 'textarea');

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            code: '',
            input: '',
            output: '',
            editor: null,
            monaco: null
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
        if(this.state.output !== doc.data.output[0]) {
            console.log('here');
            this.setState({output: doc.data.output[0]});
        }
        else if(this.state.input !== doc.data.input[0]) {
            this.setState({input: doc.data.input[0]});
        }
        else {
            this.setState({ code: doc.data.content[0] }, () => {
                if(this.state.editor) {
                    // console.log(this.state.editor.getSelection())
                    const editor = this.state.editor;
                    const monaco = this.state.monaco;
                    const selection = editor.getSelection()
                    const eln = selection.endLineNumber;
                    const ec = selection.endColumn;
                    this.state.editor.setSelection(new this.state.monaco.Range(eln,ec,eln,ec))
                    this.state.editor.focus()
                }
            });
        }
    }

    editorDidMount = (editor, monaco) => {
        editor.focus();
        this.setState({editor, monaco})
    }

    onChange = (newValue, e) => {
        doc.submitOp([{ p: ['content',0], ld: this.state.code, li: newValue }]); //p: PATH
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
            doc.submitOp([{ p: ['output',0], ld: this.state.output, li: response.data }]); //p: PATH
            
        }).catch(err => {
            console.log(String(err.response.data));
            doc.submitOp([{ p: ['output',0], ld: this.state.output, li: String(err.response.data) }]); //p: PATH
        })
    }

    handleInputChange = (e) => {
        doc.submitOp([{ p: ['input',0], ld: this.state.input, li: e.target.value }]); //p: PATH
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