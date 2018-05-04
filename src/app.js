const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const ejs = require('ejs');
const ejs_engine = require('ejs-locals');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const async = require('async');
const validator = require('validator');
const bcrypt = require('bcrypt');

const database = require('./database');
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
app.use(express.urlencoded({
    extended: false
}));

app.engine('ejs', ejs_engine);
app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('login.ejs', {
        session: req.session
    });
});

app.post('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/signup', (req, res) => {
    async.parallel([
        (callback) => {
            if (validator.isEmail(req.body.email)) {
                callback();
            } else {
                callback(null, "Invalid email");
            }
        },
        (callback) => {
            if (req.body.username && req.body.username.length >= 3) {
                callback();
            } else {
                callback(null, "Username must be at least 3 characters long");
            }
        },
        (callback) => {
            if (req.body.password && req.body.password.length >= 8) {
                callback();
            } else {
                callback(null, "The password must be at least 8 characters long");
            }
        },
        (callback) => {
            if (req.body.password && req.body.password === req.body.password2) {
                callback();
            } else {
                callback(null, "The confimation's password doesn't match with the password");
            }
        }
    ], (err, results) => {
        req.session.errors = [];

        results.forEach(msg => {
            if (msg) {
                req.session.errors.push(msg);
            }
        });

        if (req.session.errors.length === 0) {
            database.query("SELECT email, username FROM USER WHERE email=? AND username=?;", [req.body.email, req.body.username], (err, results, fields) => {
                if (err) console.log(err);
                console.log(results);

                if (!results) {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            database.query("INSERT INTO USER(email, username, password, createddate) VALUES(?, ?, ?, NOW());", [req.body.email, req.body.username, hash], (err, results, fields) => {
                                if (err) console.log(err);

                                res.redirect('/#signup');
                            });
                        });
                    });
                } else {
                    results.forEach(row => {
                        if(row["username"] == req.body.username) {
                            req.session.errors.push("This username is already taken");
                        }

                        if(row["email"] == req.body.email) {
                            req.session.errors.push("This email is already taken");
                        }
                    });

                    res.redirect('/#signup');
                }
            });
        } else {
            res.redirect('/#signup');
        }
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