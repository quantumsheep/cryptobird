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
const crypto = require('crypto');
const csrf = require('csurf');
const helmet = require('helmet');

const database = require('./database');
const JSONStore = require('./JSONStore/JSONStore')(session);

const sess = session({
    name: 'cryptosess',
    store: new JSONStore(),
    resave: false,
    saveUninitialized: true,
    secret: '1859ac8b09e62ca519d9d56519137b9ba1d4a3694e694f15c864c4c7f1414648',
    cookie: {
        maxAge: 3154e+7 // 365 days
    },
});

app.use(sess);

app.use(helmet());

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(csrf({
    cookie: true
}));

app.use('/assets', express.static('assets'));

app.engine('ejs', ejs_engine);
app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        req.session.errorCode = 403;
    } else {
        req.session.errorCode = 500;
    }

    res.redirect('/error');
});

/**
 * 
 * @param {{[key: string]: any}} session 
 * @param {(valid: boolean) => void} callback 
 */
function checkAccount(session, callback = (valid) => {}) {
    if (!session.account || !session.account.token || !session.account.id) {
        return callback(false);
    } else {
        database.query("SELECT COUNT(*) as valid FROM USER WHERE id = ? AND token = ?", [session.account.id, session.account.token], (err, results, fields) => {
            callback(results[0].valid === 1);
        });
    }
}

app.get('/get/contacts', (req, res) => {
    checkAccount(req.session, valid => {
        if(valid) {
            res.setHeader('Content-Type', 'application/json');

            database.query("SELECT id, username FROM USER WHERE username LIKE CONCAT('%', '', '%') AND id IN (SELECT contact FROM CONTACT as c1 WHERE status = 1 AND user = ? AND user = (SELECT contact FROM CONTACT as c2 WHERE status = 1 AND user = c1.contact AND contact = c1.user)) OR id = ? LIMIT 40;", [req.session.account.id, req.session.account.id], (err, results, fields) => {
                if(err) console.log(err);
                
                res.send(JSON.stringify(results));
            });
        } else {
            req.session.errorCode = 404;

            res.redirect('/error');
        }
    });
})

app.get('/error', (req, res) => {
    if (!req.session.errorCode) {
        req.session.errorCode = 404;
    }

    res.status(req.session.errorCode);

    res.render('error', {
        session: req.session,
        isError: true
    });
});

app.get('/', (req, res) => {
    checkAccount(req.session, valid => {
        if (valid) {
            res.render('messenger', {
                session: req.session,
                csrfToken: req.csrfToken()
            });
        } else {
            res.redirect('/login');
        }
    });
});

app.get('/messenger/:id', (req, res) => {
    checkAccount(req.session, valid => {
        if (valid) {
            res.render('messenger', {
                session: req.session,
                csrfToken: req.csrfToken()
            });
        } else {
            res.redirect('/login');
        }
    });
});

app.post('/addcontact', (req, res) => {
    if (!req.body.user || Number.isNaN(req.body.user)) {
        return res.redirect('/response/0');
    }

    checkAccount(req.session, valid => {
        if (valid) {
            database.query("INSERT INTO CONTACT(user, contact, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status=1", [req.session.account.id, req.body.user, 1], (err, results, fields) => {
                res.redirect('/response/1');
            });
        } else {
            res.redirect('/response/0');
        }
    });
});

app.get('/response/:response', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        response: req.params.response
    }));
});

app.get('/login', (req, res) => {
    if (req.session.account) {
        return res.redirect('/');
    }

    res.render('login', {
        session: req.session,
        csrfToken: req.csrfToken()
    });
});

app.get('/register', (req, res) => {
    if (req.session.account) {
        return res.redirect('/');
    }

    res.render('register', {
        session: req.session,
        csrfToken: req.csrfToken()
    });
});

app.get('/logout', (req, res) => {
    req.session.account = undefined;

    res.redirect('/login');
});

app.post('/login', (req, res) => {
    if (req.session.account) {
        return res.redirect('/');
    }

    function invalidCredentials() {
        req.session.errors = ["Invalid credentials"];
        req.session.data = {
            "account": req.body.account
        }
        res.redirect("/");
    }

    if (req.body.account && (validator.isEmail(req.body.account) || req.body.account.match(/^[a-zA-Z0-9_]{3,}$/g)) && req.body.password && req.body.password.length >= 8) {
        database.query("SELECT id, email, username, password, token FROM USER WHERE username = ? OR email = ?", [req.body.account, req.body.account], (err, results, fields) => {
            if (err) console.log(err);

            if (results && results.length === 1) {
                bcrypt.compare(req.body.password, results[0].password.toString(), (err, same) => {
                    if (same) {
                        req.session.account = {
                            "id": results[0].id,
                            "email": results[0].email,
                            "username": results[0].username,
                            "token": results[0].token
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
    if (req.session.account) {
        return res.redirect('/');
    }

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
                            database.query("INSERT INTO USER(email, username, password, createddate, token) VALUES(?, ?, ?, NOW(), ?);", [req.body.email, req.body.username, hash, crypto.randomBytes(16).toString('hex')], (err, results, fields) => {
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

app.use('*', (req, res) => {
    req.session.errorCode = 404;

    if(req.method !== 'GET' && req.method !== 'get') {
        res.redirect('/error');
    } else {
        res.status(404);

        res.render('error', {
            session: req.session,
            isError: true
        });
    }
});

io.use(ios(sess));

io.on('connection', socket => {
    if (socket.handshake.session.account) {
        socket.on('disconnect', () => {

        });

        socket.on('user connect', data => {
            if (data && data.url && !socket.handshake.data) {
                socket.handshake.data = {
                    url: data.url,
                    inMessenger: true
                };

                socket.handshake.data.contact = socket.handshake.data.url.replace(/(^\/messenger\/)/gi, '');

                if (!Number.isNaN(socket.handshake.data.contact)) {
                    database.query("SELECT username FROM USER WHERE id = ?", socket.handshake.data.contact, (err, results, fields) => {
                        if (results && results[0]) {
                            socket.handshake.data.contactUsername = results[0].username;
                        } else {
                            socket.handshake.data.inMessenger = false;
                        }
                    });
                } else {
                    socket.handshake.data.contact = undefined;

                    socket.handshake.data.group = socket.handshake.data.url.replace(/(^\/messenger\/group\/)/gi, '');

                    if (Number.isNaN(socket.handshake.data.group)) {
                        socket.handshake.data.inMessenger = false;
                    }
                }
            }
        });

        socket.on('get messages', offset => {
            if (socket.handshake.data && socket.handshake.data.contact && socket.handshake.session.account && offset >= 0) {
                database.query("SELECT (SELECT username FROM USER WHERE id=`from`) as username, `from`, `to`, content, datetime FROM USER_MESSAGE WHERE (`from` = ? AND `to` = ?) OR (`from` = ? AND `to` = ?) ORDER BY datetime DESC LIMIT ?, 40;", [socket.handshake.session.account.id, socket.handshake.data.contact, socket.handshake.data.contact, socket.handshake.session.account.id, offset * 40], (err, results, fields) => {
                    socket.emit("list messages", results);
                });
            }
        });

        socket.on('chat message', msg => {
            if (socket.handshake.data.inMessenger && socket.handshake.data && socket.handshake.session.account && msg) {
                if (socket.handshake.data.contact) {
                    database.query("SELECT COUNT(*) as valid FROM CONTACT as c1 WHERE status=1 AND user = ? AND contact = ? AND (SELECT status FROM CONTACT WHERE user=c1.contact AND contact=c1.user)=1;", [socket.handshake.session.account.id, socket.handshake.data.contact], (err, results, fields) => {
                        if (err) console.log(err);

                        if (results) {
                            for (let i in io.sockets.connected) {
                                if (io.sockets.connected[i].handshake.session.account && io.sockets.connected[i].handshake.session.account.id && (io.sockets.connected[i].handshake.session.account.id == socket.handshake.data.contact || io.sockets.connected[i].handshake.session.account.id == socket.handshake.session.account.id)) {
                                    if (io.sockets.connected[i].handshake.data && (io.sockets.connected[i].handshake.data.contact == socket.handshake.session.account.id || socket.handshake.data.contact == socket.handshake.session.account.id || io.sockets.connected[i].handshake.session.account.id == socket.handshake.session.account.id)) {
                                        io.sockets.connected[i].emit('chat message', socket.handshake.session.account.id, `${socket.handshake.session.account.username}: ${msg}`);
                                    } else {
                                        io.sockets.connected[i].emit('chat message update', socket.handshake.session.account.id, msg);
                                    }
                                }
                            }

                            database.query("INSERT INTO USER_MESSAGE(`from`, `to`, content, datetime) VALUES(?, ?, ?, NOW())", [socket.handshake.session.account.id, parseInt(socket.handshake.data.contact), msg], (err, results, fields) => {
                                if (err) console.log(err);
                            });
                        }
                    });
                } else if (socket.handshake.data.group) {

                }
            }
        });

        socket.on('contact search', args => {
            database.query("SELECT id, username FROM USER WHERE username LIKE CONCAT('%', ?, '%') AND id IN (SELECT contact FROM CONTACT as c1 WHERE status = 1 AND user = ? AND user = (SELECT contact FROM CONTACT as c2 WHERE status = 1 AND user = c1.contact AND contact = c1.user)) OR id = ? LIMIT 10;", [args, socket.handshake.session.account.id, socket.handshake.session.account.id], (err, results, fields) => {
                socket.emit("contact search", results, 'contact');
            });

            database.query("SELECT id, username FROM USER WHERE username LIKE CONCAT('%', ?, '%') AND id NOT IN (SELECT contact FROM CONTACT as c1 WHERE status = 1 AND user = ? AND user = (SELECT contact FROM CONTACT as c2 WHERE status = 1 AND user = c1.contact AND contact = c1.user)) AND id <> ? LIMIT 10;", [args, socket.handshake.session.account.id, socket.handshake.session.account.id], (err, results, fields) => {
                socket.emit("contact search", results, 'others');
            });

            database.query("SELECT id, username FROM USER WHERE username LIKE CONCAT('%', ?, '%') AND id IN (SELECT contact FROM CONTACT as c1 WHERE status = 1 AND user = ? AND (SELECT contact FROM CONTACT as c2 WHERE status = 1 AND user = c1.contact AND contact = c1.user) IS NULL) AND id <> ? LIMIT 10;", [args, socket.handshake.session.account.id, socket.handshake.session.account.id], (err, results, fields) => {
                socket.emit("contact search", results, 'asked');
            });
        });
    }
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});