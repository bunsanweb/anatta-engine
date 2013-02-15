tap.test("[sync ok] library.join", function () {
    tap.ok(join);
    tap.equal(join("http://example.org/", "index.html"),
              "http://example.org/index.html");
    tap.equal(join("http://example.org/sub/index.html", "/index.html"),
              "http://example.org/index.html");
});

tap.test("[async ok] library.get", function (done) {
    tap.ok(get);
    get("http://example.org/").then(function (entity) {
        tap.ok(entity);
        tap.equal(entity.request.uri, "http://www.iana.org/domains/example");
    }).then(done, done);
});

tap.test("[sync fail]", function () {
    throw new Error("fail");
});

tap.test("[async fail]", function (done) {
    get("http://example.org/").then(function (entity) {
        throw new Error("fail");
    }).then(done, done);
});
