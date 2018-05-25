const database = require('../database');
const helpers = require('../helpers');

exports.messages = (req, res) => {
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