const messenger_controller = require('../controllers/messenger');

module.exports = app => {
    app.get('/messenger/:id', messenger_controller.messages);
};