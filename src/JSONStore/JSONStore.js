const path = require('path');
const fs = require('fs');

let Store;

class JSONStore {
    /**
     * Initialize JSONStore
     *
     * @param {{[key: string]: any}} options (optional)
     *
     * @api public
     */
    constructor(options) {
        options = options || {};
        Store.call(this, options);

        this.path = options.path ? options.path : path.resolve('sessions');

        this.prefix = options.prefix ? options.prefix : 'sess_';

        fs.exists(this.path, exists => {
            if (!exists) {
                fs.mkdir(this.path, err => {
                    if (err) console.log(err);
                });
            }
        });
    }

    /**
     * Get the session's data
     *
     * @param {string} sid
     * @param {(err, data) => void} callback
     *
     * @api public
     */
    get(sid, callback) {
        if (!callback) callback = () => {};

        const filepath = path.resolve(this.path, this.prefix + sid + '.json');

        fs.readFile(filepath, (err, data) => {
            if (err) return callback(err);
            if (!data) return callback();

            callback(null, JSON.parse(data));
        });
    }

    /**
     * Set the session's data
     *
     * @param {string} sid
     * @param {any} session
     * @param {(err, data) => void} callback (optional)
     *
     * @api public
     */
    set(sid, session, callback) {
        if (!callback) callback = () => {};

        fs.writeFile(path.resolve(this.path, this.prefix + sid + '.json'), JSON.stringify(session), err => {
            if (err) return callback(err);

            callback(null, session);
        });
    }

    /**
     * Refresh the given session's Time To Live 
     *
     * @param {string} sessionId
     * @param {any} session
     * @param {(err?: any) => void} callback
     *
     * @api public
     */
    touch(sid, session, callback) {
        if (!callback) callback = () => {};
        callback();
    }

    /**
     * Attempts to unlink a given session by its id
     *
     * @param {string} sid
     * @param {(err?: any) => void} callback
     * 
     * @api public
     */
    destroy(sid, callback) {
        if (!callback) callback = () => {};

        fs.unlink(path.resolve(this.path, this.prefix + sid + '.json'), err => {
            if (err) callback(err);

            callback();
        });
    }
}

/**
 * 
 * @param {any} session 
 * @returns {JSONStore}
 * 
 * @api public
 */
module.exports = session => {
    Store = session.Store;

    /**
     * Inherit from Store
     */
    JSONStore.prototype.__proto__ = Store.prototype;

    return JSONStore;
};