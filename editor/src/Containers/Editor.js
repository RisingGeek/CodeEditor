import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'
import EditorComponent from '../Components/Editor/EditorComponent';
import helper from '../utils/editor';

const serverURL = process.env.REACT_APP_SERVER_URL;
const websocketURL = process.env.REACT_APP_WEB_SOCKET_URL;

function Editor() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [lang, setLang] = useState('cpp');
    const [videoChat, setVideoChat] = useState(false);
    const [runCodeDisabled, setRunCodeDisabled] = useState(false);
    const [videoSocket, setVideoSocket] = useState(null);

    const { id } = useParams();
    useEffect(() => {
        // check this
        helper.subscribeDoc(serverURL, id, websocketURL, input, output).then(() => {
            helper.doc.on('op', (op, source) => {
                if (source === helper.binding) return;
                if (op.length === 0) return;
                if (op.length > 1) {
                    throw new Error('Op with multiple components emitted');
                }
                // console.log(op, source);
                let component = op[0];
                if (component.p[0] === 'output' || component.p[0] === 'input' || component.p[0] === 'lang') {
                    updateInputOutput(component.ld, component.li, component.p[0]);
                }
                else
                    helper.binding.onListener(op, source);
            });
        });
    });

    const updateInputOutput = (before, after, key) => {
        if (before === after) return;
        if (key === 'input')
            setInput(after);
        else if (key === 'output')
            setOutput(after);
        else
            setLang(after);
        //check
        // this.compoThis.setState({ [key]: after });
    }

    // Monaco editor onChange()
    const editorOnChange = (newValue, e) => {
        helper.binding._inputListener(newValue, e);
        // helper.editorChange(newValue)
        // setCode(newValue);
    }

    // Handler for Run Code button
    const handleRun = () => {
        setRunCodeDisabled(true);
        helper.runCode(serverURL, id, input, output)
            .then(res => {
                setOutput(res.output)
                setRunCodeDisabled(false);
            }).catch(err => {
                setRunCodeDisabled(false);
            });
    }

    const handleInput = (e) => {
        helper.binding._inoutListener(input, e.target.value, 'input');
        setInput(e.target.value);
    }

    const handleLang = value => {
        helper.binding._inoutListener(lang, value, 'lang');
        setLang(value);
    }

    const handleVideoChat = () => {
        if (videoChat)
            videoSocket.send(JSON.stringify({ endCall: true }));
        setVideoChat(!videoChat);
    }

    const handleVideoSocket = socket => {
        setVideoSocket(socket);
    }

    return (
        <EditorComponent
            videoChat={videoChat}
            lang={lang}
            input={input}
            output={output}
            runCodeDisabled={runCodeDisabled}
            videoSocket={videoSocket}
            handleVideoChat={handleVideoChat}
            editorDidMount={helper.editorDidMount}
            editorOnChange={editorOnChange}
            handleLang={handleLang}
            handleRun={handleRun}
            handleInput={handleInput}
            handleVideoSocket={handleVideoSocket}
        />
    );
}

export default Editor;
