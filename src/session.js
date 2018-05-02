const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');

module.exports = (req, res, next) => {
    if (!req.cookies.sess) {
        res.cookie('sess', uuidv5(uuidv4(), uuidv1()));
    }

    next();
};