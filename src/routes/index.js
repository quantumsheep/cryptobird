const index_controller = require('../controllers/index');

module.exports = app => {
    app.get('/', index_controller.index);
    app.get('/error', index_controller.error);

    app.get('/response/:response', index_controller.response);
}