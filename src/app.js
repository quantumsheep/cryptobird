const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {
    res.sendFile(path.resolve('views/messenger.html'));
});

io.on('connection', socket => {
    io.emit('infos connected', Object.keys(io.sockets.clients().connected).length);

    socket.on('disconnect', () => {
        io.emit('infos connected', Object.keys(io.sockets.clients().connected).length);
    });

    socket.on('chat message', (username, msg) => {
        if(username != "" && msg != "") {
            io.emit('chat message', username + ': ' + msg);
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});