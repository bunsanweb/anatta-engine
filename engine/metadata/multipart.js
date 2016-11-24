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


const crypto = require("crypto");

const normalizeHeaders = (headers, to) => Object.keys(headers).reduce(
    (o, key) => Object.assign(o, {[key.toLowerCase()]: headers[key]}),
    to || {});
const updateHeaders = (headers, updates) =>
          normalizeHeaders(updates, normalizeHeaders(headers));

// decoder
const getBoundary = (contentType) => {
    const regex = /boundary=(?:"([^"]+)"|([^;]+))+/i;
    const result = contentType.match(regex);
    return result[1] || result[2];
};

const parseFile = (disposition) => {
    const type = disposition.headers["content-disposition"];
    const filename = Buffer.from(
        type.match(/\bfilename="([^"]+)"/)[1], "binary").toString();
    return {
        filename,
        body: Buffer.from(disposition.body, "binary"),
        headers: disposition.headers,
    };
};

const splitMultipart = (body, boundary) => {
    const head = `--${boundary}\r\n`;
    const tail = `\r\n--${boundary}--`;
    // assert(body.substring(0, head.length) === head)
    // assert(body.substring(body.length - tail.length) === tail)
    const core = body.substring(head.length, body.length - tail.length);
    const regex = RegExp(`\r\n--${boundary}\r\n`);
    return core.split(regex);
};

const parseDisposition = (part) => {
    const headerLast = part.indexOf("\r\n\r\n");
    // when invalid
    if (headerLast < 0) return null;
    const headerLines = part.substring(0, headerLast).split("\r\n");
    const headers = headerLines.reduce((headers, line) => {
        const keyLast = line.indexOf(": ");
        const key = line.substring(0, keyLast);
        const value = line.substring(keyLast + 2);
        headers[key.toLowerCase()] = value; //TBD: RFC5987 for non-ascii vals
        return headers;
    }, {});
    const body = part.substring(headerLast + 4, part.length);
    return {headers, body};
};

const parseMixed = (disposition) => {
    const contentType = disposition.headers["content-type"];
    const boundary = getBoundary(contentType);
    const dispositions = splitMultipart(disposition.body, boundary).map(
        part => parseDisposition(part)).filter(disposition => disposition);
    
    return dispositions.reduce((result, disposition) => {
        const type = disposition.headers["content-disposition"];
        if (!type.match(/^file/)) return result;
        result.push(parseFile(disposition));
        return result;
    }, []);
};

const parseMultipart = (body, boundary) => {
    if (body.substring(body.length - 2) === "\r\n") {
        body = body.substring(0, body.length - 2);
    }
    const dispositions = splitMultipart(body, boundary).map(
        part => parseDisposition(part)).filter(disposition => disposition);
    
    return dispositions.reduce((result, disposition) => {
        const type = disposition.headers["content-disposition"];
        const contentType = disposition.headers["content-type"];
        if (!type.match(/^form-data/)) return result;

        const rawname = type.match(/\bname="([^"]+)"/)[1];
        const name = Buffer.from(rawname, "binary").toString();
        if (!contentType) {
            result[name] = Buffer.from(disposition.body, "binary").toString();
        } else if (contentType.match(/^multipart\/mixed;/)) {
            result[name] = parseMixed(disposition);
        } else {
            const file = parseFile(disposition);
            if (!result[name]) result[name] = file;
            else if (Array.isArray(result[name])) result[name].push(file);
            else result[name] = [result[name], file];
        }
        return result;
    }, {});
};

const parseMultipart5 = (body, boundary) => {
    if (body.substring(body.length - 2) === "\r\n") {
        body = body.substring(0, body.length - 2);
    }
    const dispositions = splitMultipart(body, boundary).map(
        part => parseDisposition(part)).filter(disposition => disposition);
    
    return dispositions.reduce((result, disposition) => {
        const type = disposition.headers["content-disposition"];
        const contentType = disposition.headers["content-type"];
        if (!type.match(/^form-data/)) return result;

        const rawname = type.match(/\bname="([^"]+)"/)[1];
        const name = Buffer.from(rawname, "binary").toString();
        if (!contentType) {
            result[name] = Buffer.from(disposition.body, "binary").toString();
        } else if (contentType.match(/^multipart\/mixed;/)) {
            result[name] = parseMixed(disposition);
        } else {
            const file = parseFile(disposition);
            if (!result[name]) result[name] = [file];
            else if (Array.isArray(result[name])) result[name].push(file);
            else result[name] = [result[name], file];
        }
        return result;
    }, {});
};

function decodeMultipart(message) {
    const contentType = message.headers["content-type"];
    if (!contentType.match(/^multipart\/form-data/)) return null;
    const boundary = getBoundary(contentType);
    return parseMultipart(message.body.toString("binary"), boundary);
}

function decodeMultipart5(message) {
    const contentType = message.headers["content-type"];
    if (!contentType.match(/^multipart\/form-data/)) return null;
    const boundary = getBoundary(contentType);
    return parseMultipart5(message.body.toString("binary"), boundary);
}


// encoder
const makeBoundary = (bodies) => {
    while (true) {
        const candidate = crypto.randomBytes(4).toString("hex");
        const ok = bodies.every(body => body.indexOf(candidate) < 0);
        if (ok) return candidate;
    }
};

const encodeMessage = (headers, body) => {
    //TBD: RFC5987 for non-ascii vals
    const headerPart = Object.keys(headers).reduce(
        (part, key) => `${part}${key}: ${headers[key]}\r\n`, "");
    return `${headerPart}\r\n${body}`;
};

const encodeKeyValue = (key, value) => {
    const disposition = `form-data; name="${key}"`;
    const headers = {
        "content-disposition": disposition
    };
    return encodeMessage(headers, Buffer.from(value).toString("binary"));
};

const encodeSingleFile = (key, fileData) => {
    const filename = Buffer.from(fileData.filename).toString("binary");
    const disposition = `form-data; name="${key}"; filename="${filename}"`;
    const headers = updateHeaders(fileData.headers, {
        //"content-transfer-encoding": "binary",
        "content-disposition": disposition
    });
    return encodeMessage(headers, fileData.body.toString("binary"));
};

const encodeFileData = (fileData) => {
    const filename = Buffer.from(fileData.filename).toString("binary");
    const disposition = `file; filename="${filename}"`;
    const headers = updateHeaders(fileData.headers, {
        "content-disposition": disposition,
        "content-transfer-encoding": "binary"
    });
    return encodeMessage(headers, fileData.body.toString("binary"));
};

const encodeFileList = (key, fileDataList) => {
    const bodies = fileDataList.map(fileData => encodeFileData(fileData));
    const boundary = makeBoundary(bodies);
    const sep = `--${boundary}`;
    const body = `${bodies.reduce(
        (buf, body) => `${buf}\r\n${body}\r\n${sep}`, sep)}--`;
    
    const disposition = `form-data; name="${key}"`;
    const headers = {
        "content-disposition": disposition,
        "content-type": `multipart/mixed; boundary=${boundary}`
    };
    return encodeMessage(headers, body);
};

function encodeMultipart(obj) {
    const bodies = Object.keys(obj).map(key => {
        const value = obj[key];
        const binkey = Buffer.from(key).toString("binary");
        if (typeof value === "string") return encodeKeyValue(binkey, value);
        if (Array.isArray(value)) return encodeFileList(binkey, value);
        return encodeSingleFile(binkey, value);
    });
    const boundary = makeBoundary(bodies);
    const sep = `--${boundary}`;
    const body = `${bodies.reduce(
        (buf, body) => `${buf}\r\n${body}\r\n${sep}`, sep)}--\r\n`;
    
    const headers = {
        "content-type": `multipart/form-data; boundary=${boundary}`
    };
    return {headers, body: Buffer.from(body, "binary")};
}

function encodeMultipart5(obj) {
    const bodies = Object.keys(obj).reduce((bodies, key) => {
        const value = obj[key];
        const binkey = Buffer.from(key).toString("binary");
        if (typeof value === "string") {
            bodies.push(encodeKeyValue(binkey, value));
        } else if (Array.isArray(value)) {
            value.forEach(file => bodies.push(encodeSingleFile(binkey, file)));
        } else bodies.push(encodeSingleFile(binkey, value));
        return bodies;
    }, []);
    const boundary = makeBoundary(bodies);
    const sep = `--${boundary}`;
    const body = `${bodies.reduce(
        (buf, body) => `${buf}\r\n${body}\r\n${sep}`, sep)}--\r\n`;
    
    const headers = {
        "content-type": `multipart/form-data; boundary=${boundary}`
    };
    return {headers, body: Buffer.from(body, "binary")};
}


exports.encode = encodeMultipart;
exports.decode = decodeMultipart;
exports.encode5 = encodeMultipart5;
exports.decode5 = decodeMultipart5;
