const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const postRouter = require('./routes/post');
const commentRouter = require('./routes/comment');
const errorRouter = require('./routes/error');

const app = express();

app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log(err));
async function main() {
    await mongoose.connect(mongoDB);
}

app.use(
    cors({
        origin: [
            'https://theblog-gabyams-projects.vercel.app',
            'https://theblog-git-main-gabyams-projects.vercel.app',
            'https://theblogadmindashboard-gabyams-projects.vercel.app',
            'https://theblogadmindashboard-git-main-gabyams-projects.vercel.app'
        ],
        credentials: true
    })
);
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/comment', commentRouter);
app.use('/error', errorRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    let message = err.message;
    if (err.type === 'entity.parse.failed') {
        message = 'Invalid body format';
    }
    res.status(err.status || 500).send({
        status: err.status || 500,
        message
    });
});

module.exports = app;
