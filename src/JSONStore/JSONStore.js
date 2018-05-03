const path = require('path');
const fs = require('fs');

let Store;

class JSONStore {
    /**
     * Initialize FileStore with the given `options`
     *
     * @param {object} options (optional)
     *
     * @api public
     */
    constructor(options) {
        options = options || {};
        Store.call(this, options);

        this.path = options.path ? options.path : path.resolve('sessions');

        fs.exists(this.path, exists => {
            if (!exists) {
                fs.mkdirSync(this.path);
            }
        });
    }

    /**
     * Attempts to fetch session from a session file by the given `sessionId`
     *
     * @param {string} sid
     * @param {(err, data) => void} callback
     *
     * @api public
     */
    get(sid, callback) {
        const filepath = path.resolve(this.path, sid + '.json');

        fs.readFile(filepath, (err, data) => {
            if (err) return callback(err);
            if(!data) return callback();

            callback(null, JSON.parse(data));
        });
    }

    /**
     * Attempts to commit the given session associated with the given `sessionId` to a session file
     *
     * @param {string} sessionId
     * @param {object} session
     * @param {(err, data) => void} callback (optional)
     *
     * @api public
     */
    set(sid, session, callback) {
        console.log(session);
        fs.writeFile(path.resolve(this.path, sid + '.json'), '{}', err => {
            if (err) return callback(err);

            callback(null, {});
        });
    }

    /**
     * Touch the given session object associated with the given `sessionId`
     *
     * @param {string} sessionId
     * @param {object} session
     * @param {function} callback
     *
     * @api public
     */
    touch(sessionId, session, callback) {
        helpers.touch(sessionId, session, this.options, callback);
    }

    /**
     * Attempts to unlink a given session by its id
     *
     * @param  {String}   sessionId   Files are serialized to disk by their
     *                                sessionId
     * @param  {Function} callback
     *
     * @api public
     */
    destroy(sessionId, callback) {
        helpers.destroy(sessionId, this.options, callback);
    }

    /**
     * Attempts to fetch number of the session files
     *
     * @param  {Function} callback
     *
     * @api public
     */
    length(callback) {
        helpers.length(this.options, callback);
    }

    /**
     * Attempts to clear out all of the existing session files
     *
     * @param  {Function} callback
     *
     * @api public
     */
    clear(callback) {
        helpers.clear(this.options, callback);
    }

    /**
     * Attempts to find all of the session files
     *
     * @param  {Function} callback
     *
     * @api public
     */
    list(callback) {
        helpers.list(this.options, callback);
    }

    /**
     * Attempts to detect whether a session file is already expired or not
     *
     * @param  {String}   sessionId
     * @param  {Function} callback
     *
     * @api public
     */
    expired(sessionId, callback) {

    }
}

/**
 * https://github.com/expressjs/session#session-store-implementation
 *
 * @param {Object} session  express session
 * @return {JSONStore} the `FileStore` extending `express`'s session Store
 *
 * @api public
 */
module.exports = session => {
    console.log(session);
    Store = session.Store;

    /**
     * Inherit from Store
     */
    JSONStore.prototype.__proto__ = Store.prototype;

    return JSONStore;
};