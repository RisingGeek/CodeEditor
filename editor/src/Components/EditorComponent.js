import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {Input} from 'antd';
const {TextArea} = Input;

const EditorComponent = props => {
    const {code,input,output,editorDidMount, editorOnChange, handleRun, handleInput} = props;
    const options = {
        selectOnLineNumbers: true, // Select line by clicking on line number
        minimap: {
            enabled: false // Minimap gives an overview of code(present on right side in vscode) 
        }
    }
    return (
        <div>
            <MonacoEditor
                width="600"
                height="400"
                language="cpp"
                theme="vs-dark"
                value={code}
                options={options}
                editorDidMount={editorDidMount}
                onChange={editorOnChange}
            />
            <button onClick={handleRun}>run code</button>
            <div>input:</div>
            <TextArea value={input} onChange={handleInput} />
            <div>output:</div>
            <TextArea value={output} style={{marginBottom: '20px'}} autoSize={{minRows:2, maxRows: 5}} readOnly={true} />
        </div>
    );
}

export default EditorComponent;