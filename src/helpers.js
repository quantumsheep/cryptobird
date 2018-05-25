const database = require('./database');

/**
 * 
 * @param {{[key: string]: any}} session 
 * @param {(valid: boolean) => void} callback 
 */
exports.checkAccount = (session, callback = (valid) => {}) => {
    if (!session.account || !session.account.token || !session.account.id) {
        return callback(false);
    } else {
        database.query("SELECT COUNT(*) as valid FROM USER WHERE id = ? AND token = ?", [session.account.id, session.account.token], (err, results, fields) => {
            callback(results[0].valid === 1);
        });
    }
}