const database = require('./database');

/**
 * Receive sockets connections
 * 
 * @param {SocketIO.Socket} socket 
 */
module.exports = io => socket => {
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

        socket.on('get talks', () => {

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
};