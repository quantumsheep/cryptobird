const database = require('../database');
const helpers = require('../helpers');

exports.index = (req, res) => {
    helpers.checkAccount(req.session, valid => {
        if (valid) {
            res.render('messenger', {
                session: req.session,
                csrfToken: req.csrfToken()
            });
        } else {
            res.redirect('/login');
        }
    });
};

exports.error = (req, res) => {
    if (!req.session.errorCode) {
        req.session.errorCode = 404;
    }

    res.status(req.session.errorCode);

    res.render('error', {
        session: req.session,
        isError: true
    });
};

exports.response = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        response: req.params.response
    }));
};