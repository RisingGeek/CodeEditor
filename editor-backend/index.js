const express = require('express');
const bodyParser = require('body-parser');
const codeRunRouter = require('./Routes/codeRun');
const cors = require('cors');
const url = require('url');

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
const share = new shareDB({ presence: true });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/code', codeRunRouter);

const videoSocket = new WebSocket.Server({ noServer: true });

// wss->web socket server
// listen to incoming websocket
const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', ws => {
    const stream = new WebSocketJSONStream(ws);
    stream.on('error', error => {
        console.log(error.message);
    });
    share.listen(stream);
});

videoSocket.on('connection', ws => {
    ws.on('message', data => {
        const on = JSON.parse(data);
        if (on['makeOffer']) {
            videoSocket.clients.forEach(client => {
                if (client != ws)
                    client.send(JSON.stringify({ offerMade: { offer: on['makeOffer'].offer } }));
            })
        }
        else if (on['makeAnswer']) {
            videoSocket.clients.forEach(client => {
                if (client != ws)
                    client.send(JSON.stringify({ answerMade: { answer: on['makeAnswer'].answer } }));
            })
        }
        else if (on['candidate']) {
            videoSocket.clients.forEach(client => {
                if (client != ws)
                    client.send(JSON.stringify({ candidate: on['candidate'] }));
            })
        }
        else if (on['endCall']) {
            videoSocket.clients.forEach(client => {
                if (client != ws)
                    client.send(JSON.stringify({ endCall: on['endCall'] }));
            })
        }
    })
})

const connection = share.connect();

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/foo') {
        videoSocket.handleUpgrade(request, socket, head, (ws) => {
            videoSocket.emit('connection', ws);
        });
    } else if (pathname === '/bar') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws);
        });
    } else {
        socket.destroy();
    }
});

app.post('/', (req, res) => {
    let id = req.body.id;
    // doc->shareDB.Doc instance
    // examples-> connection name, textarea-> document id
    const doc = connection.get('examples', id);
    // Fetch doc
    doc.fetch(err => {
        if (err) throw err;
        // If doc type is null, create a document
        // console.log(doc.type)
        if (doc.type == null) {
            doc.create({ content: '', output: [''], input: [''], lang: [''] });
            return;
        }
        // Start server callback
        // callback();
    });
    res.send('Document created successfully');
});