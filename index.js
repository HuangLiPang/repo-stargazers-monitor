const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const createError = require("http-errors");
const HTTPStatuses = require("statuses");
const { initializer } = require("./db/initializer");
require("dotenv").config();

require("dotenv").config();
initializer();
const app = express();

// log the query
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
const router = require("./router");
router(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port`, PORT);
});

// error handler
app.use(function (err, req, res, next) {
    let messageToSend = null;

    if (err instanceof createError.HttpError) {
        // handle http err
        messageToSend = { message: err.message };

        if (process.env.NODE_ENV === "development") {
            messageToSend.stack = err.stack;
        }

        messageToSend.status = err.statusCode;
    } else {
        // log other than HTTP errors (these are created by me manually,
        // so I can log them when thrown)
        console.error(err.stack);
    }

    if (process.env.NODE_ENV === "production" && !messageToSend) {
        messageToSend = { message: "Something broke", status: 500 };
    }

    if (messageToSend) {
        let statusCode = parseInt(messageToSend.status, 10);
        let statusName = HTTPStatuses(statusCode);

        res.status(statusCode);
        let responseObject = {
            error: statusName,
            code: statusCode,
            message: messageToSend.message,
        };

        if (messageToSend.stack) {
            responseObject.stack = messageToSend.stack;
        }

        res.json(responseObject);
        return;
    }

    // if this is not HTTP error and we are not in production,
    // let express handle it the default way
    next(err);
});
