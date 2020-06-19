import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import styles from './main.module.css';

const EditorComponent = props => {
    const { code, input, output, editorDidMount, editorOnChange, lang } = props;
    const options = {
        selectOnLineNumbers: true, // Select line by clicking on line number
        minimap: {
            enabled: false // Minimap gives an overview of code(present on right side in vscode) 
        }
    }
    return (
        <React.Fragment>
            <div className={styles.editor}>
            <MonacoEditor
                // width="600"
                // height="400"
                automaticLayout={true}
                language={lang}
                theme="vs-dark"
                value={code}
                options={options}
                editorDidMount={editorDidMount}
                onChange={editorOnChange}
            />
            </div>    
        </React.Fragment>
    );
}

export default EditorComponent;