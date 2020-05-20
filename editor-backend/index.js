const express = require('express');
const bodyParser = require('body-parser');
const codeRunRouter = require('./Routes/codeRun');
const cors = require('cors');

const PORT = process.env.PORT || 5000;

// shareDB is a realtime db backend based on operational transformation(OT).
// Realtime synchronization of JSON document
// Concurrent multi-user collaboration 
const shareDB = require('sharedb');
// WebSocket provides two way communication between client and server
const WebSocket = require('ws');
// Stream wrapper for websocket connections
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');


// shareDB server instance
const share = new shareDB();
createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
    const connection = share.connect();
    // doc->shareDB.Doc instance
    // examples-> connection name, textarea-> document id
    const doc = connection.get('examples', 'textarea');
    // Fetch doc
    doc.fetch(err => {
        if (err) throw err;
        // If doc type is null, create a document
        if (doc.type == null) {
            doc.create({ content: ''}, callback);
            return;
        }
        // Start server callback
        callback();
    });
}

function startServer() {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/code', codeRunRouter);

    const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

    // wss->web socket server
    // listen to incoming websocket
    const wss = new WebSocket.Server({ server: server });
    wss.on('connection', ws => {
        const stream = new WebSocketJSONStream(ws);
        share.listen(stream);
    });
}
