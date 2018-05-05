const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ios = require('socket.io-express-session');
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

const sess = session({
    store: new JSONStore(),
    resave: true,
    saveUninitialized: false,
    secret: '1859ac8b09e62ca519d9d56519137b9ba1d4a3694e694f15c864c4c7f1414648'
});

app.use(sess);

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.engine('ejs', ejs_engine);
app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    if (!req.session.account) {
        res.redirect('/login');
    } else {
        res.render('messenger', {
            session: req.session
        });
    }
});

app.get('/login', (req, res) => {
    res.render('login', {
        session: req.session
    });
});

app.get('/register', (req, res) => {
    res.render('register', {
        session: req.session
    });
});

app.get('/logout', (req, res) => {
    req.session.account = undefined;

    res.redirect('/login');
});

app.post('/login', (req, res) => {
    function invalidCredentials() {
        req.session.errors = ["Invalid credentials"];
        req.session.data = {
            "account": req.body.account
        }
        res.redirect("/");
    }
    
    if (req.body.account && (validator.isEmail(req.body.account) || req.body.account.match(/^[a-zA-Z0-9_]{3,}$/g)) && req.body.password && req.body.password.length >= 8) {
        database.query("SELECT email, username, password FROM USER WHERE username = ? OR email = ?", [req.body.account, req.body.account], (err, results, fields) => {
            if (err) console.log(err);

            if (results.length === 1) {
                bcrypt.compare(req.body.password, results[0].password.toString(), (err, same) => {
                    if (same) {
                        req.session.account = {
                            "email": results[0].email,
                            "username": results[0].username
                        }
                        res.redirect("/");
                    } else {
                        invalidCredentials();
                    }
                });
            } else {
                invalidCredentials();
            }
        });
    } else {
        invalidCredentials();
    }
});

app.post('/register', (req, res) => {
    function informationError() {
        req.session.data = {
            "username": req.body.username,
            "email": req.body.email
        }

        res.redirect('/register');
    }

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
                if (req.body.username.match(/^[a-zA-Z0-9_]{3,}$/g)) {
                    callback();
                } else {
                    callback(null, "The username must only contains alphadecimal and '_' characters");
                }
            } else {
                callback(null, "The username must be at least 3 characters long");
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
                if (!results || results.length <= 0) {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            database.query("INSERT INTO USER(email, username, password, createddate) VALUES(?, ?, ?, NOW());", [req.body.email, req.body.username, hash], (err, results, fields) => {
                                if (err) console.log(err);

                                res.redirect('/login');
                            });
                        });
                    });
                } else {
                    results.forEach(row => {
                        if (row["username"] == req.body.username) {
                            req.session.errors.push("This username is already taken");
                        }

                        if (row["email"] == req.body.email) {
                            req.session.errors.push("This email is already taken");
                        }
                    });

                    informationError();
                }
            });
        } else {
            informationError();
        }
    });
});

io.use(ios(sess));

io.on('connection', socket => {
    if (socket.handshake.session.account) {
        io.emit('infos connected', Object.keys(io.sockets.clients().connected).length);

        socket.on('disconnect', () => {
            io.emit('infos connected', Object.keys(io.sockets.clients().connected).length);
        });

        socket.on('chat message', msg => {
            if (msg != "") {
                io.emit('chat message', `${socket.handshake.session.account.username}: ${msg}`);
            }
        });
    }
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});