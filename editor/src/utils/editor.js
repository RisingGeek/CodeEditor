import axios from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';
import ShareDB from 'sharedb/lib/client';
import { notification } from 'antd';
import StringBinding from '../EditorBinding/StringBinding';

const helper = {
    binding: null,
    editor: null,
    monaco: null,
    subscribeDoc: (url, id, editorThis, socketURL) => {
        axios.post(url, {
            id
        }).then(res => {
            //open websocket connection to shareDB server
            const rws = new ReconnectingWebSocket(socketURL + '/bar');
            const connection = new ShareDB.Connection(rws);
            //create local doc instance mapped to 'examples' collection document with id 'textarea'
            const doc = connection.get('examples', id);

            doc.subscribe((err) => {
                if (err) throw err;
                const presence = connection.getPresence('examples');
                presence.subscribe(err => {
                    if (err) throw err;
                });
                let localPresence = presence.create();

                helper.binding = new StringBinding(editorThis, doc, ['content'], localPresence, helper.editor, helper.monaco);
                helper.binding.setup(editorThis);

                presence.on('receive', (id, range) => {
                    console.log('presence', range)
                    if (!range) return;
                    let isPos = range.startLineNumber === range.endLineNumber &&
                        range.startColumn === range.endColumn;
                    helper.binding.decorations = helper.editor.deltaDecorations(helper.binding.decorations, [
                        {
                            range: new helper.monaco.Range(range.startLineNumber, range.startColumn,
                                range.endLineNumber, range.endColumn),
                            options: { className: isPos ? 'cursor-position' : 'cursor-selection' }
                        }
                    ]);
                    helper.binding.range = range;
                });
            });
        }).catch(err => {
            console.log(err)
            notification.error({
                message: err.toString(),
            });
        });
    },
    editorDidMount: (editor, monaco) => {
        helper.editor = editor;
        helper.monaco = monaco;

        helper.editor.focus();
        // Set end of line preference
        helper.editor.getModel().pushEOL(0);

        let setup = true;
        helper.editor.onDidChangeCursorSelection((e) => {
            // Setup initial cursor position
            if (setup) {
                let pos = helper.editor.getPosition();
                helper.editor.setSelection(new helper.monaco.Range(
                    pos.lineNumber, pos.column, pos.lineNumber, pos.column)
                );
                setup = false;
                return;
            }
            // console.log(e);
            if (helper.binding.localPresence) {
                helper.binding.localPresence.submit(e.selection, err => {
                    if (err) throw err;
                });
            }
        });
    },
    runCode: (url, id, input, output) => {
        return new Promise((resolve, reject) => {
            const code = helper.editor.getValue();
            axios.post(url + '/code/run', {
                code,
                input,
                id,
                lang: helper.editor.getModel().getLanguageIdentifier().language
            }).then(response => {
                helper.binding._inoutListener(output, response.data, 'output');
                resolve({ output: response.data });
            }).catch(err => {
                if (!err.response) {
                    notification.error({
                        message: err.toString(),
                    });
                    reject();
                }
                else if (err.response.status === 400) {
                    helper.binding._inoutListener(output, err.response.data, 'output');
                    resolve({ output: err.response.data });
                }
            })
        });
    }
};

export default helper;