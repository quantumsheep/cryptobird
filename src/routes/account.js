const account_controller = require('../controllers/account');

module.exports = app => {
    app.get('/login', account_controller.login);
    app.post('/login', account_controller.login_action);

    app.get('/register', account_controller.register);
    app.post('/register', account_controller.register_action);

    app.get('/logout', account_controller.logout);

    app.post('/addcontact', account_controller.addcontact);
    app.get('/get/contacts', account_controller.get_contacts);    
}