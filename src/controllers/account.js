const database = require('../database');
const helpers = require('../helpers');
const async = require('async');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.login = (req, res) => {
    if (req.session.account) {
        return res.redirect('/');
    }

    res.render('login', {
        session: req.session,
        csrfToken: req.csrfToken()
    });
};

exports.register = (req, res) => {
    if (req.session.account) {
        return res.redirect('/');
    }

    res.render('register', {
        session: req.session,
        csrfToken: req.csrfToken()
    });
};

exports.logout = (req, res) => {
    req.session.account = undefined;

    res.redirect('/login');
};

exports.login_action = (req, res) => {
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
};

exports.register_action = (req, res) => {
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
};

exports.addcontact = (req, res) => {
    if (!req.body.user || Number.isNaN(req.body.user)) {
        return res.redirect('/response/0');
    }

    helpers.checkAccount(req.session, valid => {
        if (valid) {
            database.query("INSERT INTO CONTACT(user, contact, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status=1", [req.session.account.id, req.body.user, 1], (err, results, fields) => {
                res.redirect('/response/1');
            });
        } else {
            res.redirect('/response/0');
        }
    });
};

exports.get_contacts = (req, res) => {
    helpers.checkAccount(req.session, valid => {
        if (valid) {
            res.setHeader('Content-Type', 'application/json');

            database.query("SELECT id, username FROM USER WHERE username LIKE CONCAT('%', '', '%') AND id IN (SELECT contact FROM CONTACT as c1 WHERE status = 1 AND user = ? AND user = (SELECT contact FROM CONTACT as c2 WHERE status = 1 AND user = c1.contact AND contact = c1.user)) OR id = ? LIMIT 40;", [req.session.account.id, req.session.account.id], (err, results, fields) => {
                if (err) console.log(err);

                res.send(JSON.stringify(results));
            });
        } else {
            req.session.errorCode = 404;

            res.redirect('/error');
        }
    });
};