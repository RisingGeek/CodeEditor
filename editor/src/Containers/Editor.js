import React, { Component } from 'react';
import EditorComponent from '../Components/EditorComponent';
import axios from 'axios';
import MonacoEditor from 'react-monaco-editor';

class Editor extends Component {
    state = {
        code: '// type some code here',
        input: '',
        output: '',
    }

    editorDidMount(editor, monaco) {
        console.log('editor mount', {editor});
        editor.focus();
    }

    onChange = (newValue, e) => {
        console.log('onchange',{newValue}, {e});
        this.setState({code: newValue});
    }

    handleRun = () => {
        // Convert array of codes into a single string
        const code = this.state.code;
        console.log(code);
        // Send API call to run code
        axios.post('http://localhost:5000/code/run', {
            code: code,
            input: this.state.input,
            id: 123
        }).then(response => {
            console.log(response.data);
        }).catch(err => {
            console.log(String(err.response.data));
        })
    }

    render() {
        const code = this.state.code;
        console.log(code);
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
            </React.Fragment>
        );
    }
}

export default Editor;