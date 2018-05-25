const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ios = require('socket.io-express-session');
const path = require('path');
const ejs_engine = require('ejs-locals');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const helmet = require('helmet');

const JSONStore = require('./JSONStore/JSONStore')(session);
const routes = require('./routes/route');
const socketreq = require('./socketreq')(io);

const sess = session({
    name: 'cryptosess',
    store: new JSONStore(),
    resave: false,
    saveUninitialized: true,
    secret: '1859ac8b09e62ca519d9d56519137b9ba1d4a3694e694f15c864c4c7f1414648',
    cookie: {
        maxAge: 3154e+7 // 365 days
    },
});

app.use(sess);

app.use(helmet());

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(csrf({
    cookie: true
}));

app.use('/assets', express.static('assets'));

app.engine('ejs', ejs_engine);
app.set('views', __dirname + '/../views');
app.set('view engine', 'ejs');

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        req.session.errorCode = 403;
    } else {
        req.session.errorCode = 500;
    }

    res.redirect('/error');
});

routes(app);

app.use('*', (req, res) => {
    req.session.errorCode = 404;

    if (req.method !== 'GET' && req.method !== 'get') {
        res.redirect('/error');
    } else {
        res.status(404);

        res.render('error', {
            session: req.session,
            isError: true
        });
    }
});

io.use(ios(sess));

io.on('connection', socketreq);

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});