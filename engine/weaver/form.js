"use strict";

const querystring = require("querystring");

const multipart = require("../metadata/multipart");

const decode = function (message) {
    if (message.headers["content-type"] === 
        "application/x-www-form-urlencoded") {
        return querystring.parse(message.body.toString());
    }
    return multipart.decode5(message);
};

exports.encode = multipart.encode5;
exports.decode = decode;
