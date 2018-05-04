const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const ejs = require('ejs');
const ejs_engine = require('ejs-locals');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const JSONStore = require('./JSONStore/JSONStore')(session);

app.use('/assets', express.static('assets'));

app.use(cookieParser());

app.use(session({
    store: new JSONStore(),
    resave: true,
    saveUninitialized: false,
    secret: '1859ac8b09e62ca519d9d56519137b9ba1d4a3694e694f15c864c4c7f1414648'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.engine('ejs', ejs_engine);
app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    req.session.username = "QuantumSheep";
    res.render('login.ejs');
});

app.post('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/signup', (req, res) => {
    new Promise((resolve, reject) => {

    }).then(() => {

    }).catch(err => {

    });
});

io.on('connection', socket => {
    io.emit('infos connected', Object.keys(io.sockets.clients().connected).length);

    socket.on('disconnect', () => {
        io.emit('infos connected', Object.keys(io.sockets.clients().connected).length);
    });

    socket.on('chat message', (username, msg) => {
        if (username != "" && msg != "") {
            io.emit('chat message', username + ': ' + msg);
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});