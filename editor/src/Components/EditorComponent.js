import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {Input, Select, Button} from 'antd';
const {TextArea} = Input;
const {Option} = Select;

const EditorComponent = props => {
    const {code,input,output,editorDidMount, editorOnChange, handleRun, handleInput, handleLang, lang} = props;
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
                language={lang}
                theme="vs-dark"
                value={code}
                options={options}
                editorDidMount={editorDidMount}
                onChange={editorOnChange}
            />
            <Select defaultValue='cpp' onChange={handleLang} value={lang}>
                <Option value='cpp'>CPP</Option>
                <Option value='java'>Java</Option>
            </Select>
            <button onClick={handleRun}>run code</button>
            <div>input:</div>
            <TextArea value={input} onChange={handleInput} />
            <div>output:</div>
            <TextArea value={output} style={{marginBottom: '20px'}} autoSize={{minRows:2, maxRows: 5}} readOnly={true} />
        </div>
    );
}

export default EditorComponent;