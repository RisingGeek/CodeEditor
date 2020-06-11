import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { Input, Select, Row, Col } from 'antd';
const { TextArea } = Input;
const { Option } = Select;

const EditorComponent = props => {
    const { code, input, output, editorDidMount, editorOnChange, handleRun, handleInput, handleLang, lang } = props;
    const options = {
        selectOnLineNumbers: true, // Select line by clicking on line number
        minimap: {
            enabled: false // Minimap gives an overview of code(present on right side in vscode) 
        }
    }
    return (
        <Row>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
                <div>input:</div>
                <TextArea value={input} onChange={handleInput} rows={5} />
                <div>output:</div>
                <TextArea value={output} style={{ marginBottom: '20px' }} autoSize={{ minRows: 5, maxRows: 10 }} readOnly={true} />
            </Col>
        </Row>
    );
}

export default EditorComponent;