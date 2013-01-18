"use strict";

// mulipart/form-data decoder/encoder
//
// see html4: http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.2
// see html5: note of 4.10.22.6 - 5 at http://www.w3.org/TR/html51/forms.html
// > the "sets of files" feature ("multipart/mixed") of RFC 2388 is not used.

// [html5 style formdata]
// multipart object structure as:
// {
//   stringKey: stringValue, ...,
//   filesKey: [{filename: "...", headers: {...}, body: Buffer(...)}, ...],
//   ...,
// }
//
// [module usage]
//  message = {headers: {"content-type": "multipart/form-data; boundary=..."
//  }, body: Buffer(...)}
//  multipartObject = mod.decode5(message)
//  message = mod.encode5(multipartObject)

// [HTML4 style formdata]
// multipart object structure as:
// {
//   stringKey: stringValue, ...,
//   fileKey: {filename: "...", headers: {...}, body: Buffer(...)}, ...,
//   filesKey: [{filename: "...", headers: {...}, body: Buffer(...)}, ...],
//   ...,
// }
//
// [module usage]
//  message = {headers: {"content-type": "multipart/form-data; boundary=..."
//  }, body: Buffer(...)}
//  multipartObject = mod.decode(message)
//  message = mod.encode(multipartObject)


var crypto = require("crypto");

var normalizeHeaders = function (headers, to) {
    return Object.keys(headers).reduce(function (o, key) {
        o[key.toLowerCase()] = headers[key];
        return o;
    }, to || {});
};
var updateHeaders = function (headers, updates) {
    return normalizeHeaders(updates, normalizeHeaders(headers));
};

// decoder
var decodeMultipart = function (message) {
    var contentType = message.headers["content-type"];
    if (!contentType.match(/^multipart\/form-data/)) return null;
    var boundary = getBoundary(contentType);
    return parseMultipart(message.body.toString("binary"), boundary);
};

var decodeMultipart5 = function (message) {
    var contentType = message.headers["content-type"];
    if (!contentType.match(/^multipart\/form-data/)) return null;
    var boundary = getBoundary(contentType);
    return parseMultipart5(message.body.toString("binary"), boundary);
};

var parseMultipart = function (body, boundary) {
    if (body.substring(body.length - 2) === "\r\n") {
        body = body.substring(0, body.length - 2);
    }
    var dispositions = splitMultipart(body, boundary).map(function (part) {
        return parseDisposition(part);
    }).filter(function (disposition) {return disposition;});
    
    return dispositions.reduce(function (result, disposition) {
        var type = disposition.headers["content-disposition"];
        var contentType = disposition.headers["content-type"];
        if (!type.match(/^form-data/)) return result;
        
        var name = Buffer(
            type.match(/\bname="([^"]+)"/)[1], "binary").toString();
        if (!contentType) {
            result[name] = new Buffer(disposition.body, "binary").toString();
        } else if (contentType.match(/^multipart\/mixed;/)) {
            result[name] = parseMixed(disposition);
        } else {
            var file = parseFile(disposition);
            if (!result[name]) result[name] = file;
            else if (Array.isArray(result[name])) result[name].push(file);
            else result[name] = [result[name], file];
        }
        return result;
    }, {});
};

var parseMultipart5 = function (body, boundary) {
    if (body.substring(body.length - 2) === "\r\n") {
        body = body.substring(0, body.length - 2);
    }
    var dispositions = splitMultipart(body, boundary).map(function (part) {
        return parseDisposition(part);
    }).filter(function (disposition) {return disposition;});
    
    return dispositions.reduce(function (result, disposition) {
        var type = disposition.headers["content-disposition"];
        var contentType = disposition.headers["content-type"];
        if (!type.match(/^form-data/)) return result;
        
        var name = Buffer(
            type.match(/\bname="([^"]+)"/)[1], "binary").toString();
        if (!contentType) {
            result[name] = new Buffer(disposition.body, "binary").toString();
        } else if (contentType.match(/^multipart\/mixed;/)) {
            result[name] = parseMixed(disposition);
        } else {
            var file = parseFile(disposition);
            if (!result[name]) result[name] = [file];
            else if (Array.isArray(result[name])) result[name].push(file);
            else result[name] = [result[name], file];
        }
        return result;
    }, {});
};


var parseFile = function (disposition) {
    var type = disposition.headers["content-disposition"];
    var filename = Buffer(
        type.match(/\bfilename="([^"]+)"/)[1], "binary").toString();
    return {filename: filename,
            body: Buffer(disposition.body, "binary"),
            headers: disposition.headers};
};

var parseMixed = function (disposition) {
    var contentType = disposition.headers["content-type"];
    var boundary = getBoundary(contentType);
    var dispositions = splitMultipart(disposition.body, boundary).map(
        function (part) {
            return parseDisposition(part);
        }).filter(function (disposition) {return disposition;});
    
    return dispositions.reduce(function (result, disposition) {
        var type = disposition.headers["content-disposition"];
        if (!type.match(/^file/)) return result;
        result.push(parseFile(disposition));
        return result;
    }, []);
};

var getBoundary = function (contentType) {
    var regex = /boundary=(?:"([^"]+)"|([^;]+))+/i;
    var result = contentType.match(regex);
    return result[1] || result[2];
};

var splitMultipart = function (body, boundary) {
    var head = "--" + boundary + "\r\n";
    var tail = "\r\n--" + boundary + "--";
    // assert(body.substring(0, head.length) === head)
    // assert(body.substring(body.length - tail.length) === tail)
    var core = body.substring(head.length, body.length - tail.length);
    var regex = RegExp("\r\n--" + boundary + "\r\n");
    return core.split(regex);
};

var parseDisposition = function (part) {
    var headerLast = part.indexOf("\r\n\r\n");
    // when invalid
    if (headerLast < 0) return null;
    var headerLines = part.substring(0, headerLast).split("\r\n");
    var headers = headerLines.reduce(function (headers, line) {
        var keyLast = line.indexOf(": ");
        var key = line.substring(0, keyLast);
        var value = line.substring(keyLast + 2);
        headers[key.toLowerCase()] = value; //TBD: RFC5987 for non-ascii vals
        return headers;
    }, {});
    var body = part.substring(headerLast + 4, part.length);
    return {headers: headers, body: body};
};


// encoder
var encodeMultipart = function (obj) {
    var bodies = Object.keys(obj).map(function (key) {
        var value = obj[key];
        var binkey = Buffer(key).toString("binary");
        if (typeof value === "string") return encodeKeyValue(binkey, value);
        if (Array.isArray(value)) return encodeFileList(binkey, value);
        return encodeSingleFile(binkey, value);
    });
    var boundary = makeBoundary(bodies);
    var sep = "--" + boundary;
    var body = bodies.reduce(function (buf, body) {
        return buf + "\r\n" + body + "\r\n" + sep;
    }, sep) + "--\r\n";
    
    var headers = {
        "content-type": "multipart/form-data; boundary=" + boundary,
    };
    return {headers: headers, body: Buffer(body, "binary")};
};

var encodeMultipart5 = function (obj) {
    var bodies = Object.keys(obj).reduce(function (bodies, key) {
        var value = obj[key];
        var binkey = Buffer(key).toString("binary");
        if (typeof value === "string") {
            bodies.push(encodeKeyValue(binkey, value));
        } else if (Array.isArray(value)) {
            value.forEach(function (file) {
                bodies.push(encodeSingleFile(binkey, file));
            });
        } else bodies.push(encodeSingleFile(binkey, value));
        return bodies;
    }, []);
    var boundary = makeBoundary(bodies);
    var sep = "--" + boundary;
    var body = bodies.reduce(function (buf, body) {
        return buf + "\r\n" + body + "\r\n" + sep;
    }, sep) + "--\r\n";
    
    var headers = {
        "content-type": "multipart/form-data; boundary=" + boundary,
    };
    return {headers: headers, body: Buffer(body, "binary")};
};

var encodeMessage = function (headers, body) {
    var headerPart = Object.keys(headers).reduce(function (part, key) {
        var line = key + ": " + headers[key]; //TBD: RFC5987 for non-ascii vals
        return part + line + "\r\n";
    }, "");
    return headerPart + "\r\n" + body;
};

var encodeKeyValue = function (key, value) {
    var disposition = ["form-data", 'name="' + key + '"'].join("; ");
    var headers = {
        "content-disposition": disposition,
    };
    return encodeMessage(headers, Buffer(value).toString("binary"));
};
var encodeSingleFile = function (key, fileData) {
    var filename = Buffer(fileData.filename).toString("binary");
    var disposition = ["form-data", 'name="' + key + '"', 
                       'filename="' + filename + '"'].join("; ");
    var headers = updateHeaders(fileData.headers, {
        "content-disposition": disposition,
        //"content-transfer-encoding": "binary",
    });
    return encodeMessage(headers, fileData.body.toString("binary"));
};
var encodeFileList = function (key, fileDataList) {
    var bodies = fileDataList.map(function (fileData) {
        return encodeFileData(fileData);
    });
    var boundary = makeBoundary(bodies);
    var sep = "--" + boundary;
    var body = bodies.reduce(function (buf, body) {
        return buf + "\r\n" + body + "\r\n" + sep;
    }, sep) + "--";
    
    var disposition = ["form-data", 'name="' + key + '"'].join("; ");
    var headers = {
        "content-disposition": disposition,
        "content-type": "multipart/mixed; boundary=" + boundary,
    };
    return encodeMessage(headers, body);
};
var encodeFileData = function (fileData) {
    var filename = Buffer(fileData.filename).toString("binary");
    var disposition = ["file",
                       'filename="' + filename + '"'].join("; ");
    var headers = updateHeaders(fileData.headers, {
        "content-disposition": disposition,
        "content-transfer-encoding": "binary",
    });
    return encodeMessage(headers, fileData.body.toString("binary"));
};
var makeBoundary = function (bodies) {
    while (true) {
        var candidate = crypto.randomBytes(4).toString("hex");
        var ok = bodies.every(function (body) {
            return body.indexOf(candidate) < 0;
        });
        if (ok) return candidate;
    }
};

exports.encode = encodeMultipart;
exports.decode = decodeMultipart;
exports.encode5 = encodeMultipart5;
exports.decode5 = decodeMultipart5;
