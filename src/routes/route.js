const routes = [
    require('./index'),
    require('./account'),
    require('./messenger'),
];

module.exports = app => routes.forEach(route => route(app));