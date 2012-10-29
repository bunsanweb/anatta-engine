var assert = require("assert");

suite("[Design for Matadata API]");
test("A link metadata and get entity for it", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine();
    var ref = engine.link({href: "file:tests/assets/content.html"});
    ref.get().then(function (entity) {
        assert(true);
    }).then(done, done);
    
    //[REST methods for metadata]
    //- ref.get(); //promise of get response
    //- ref.put(doc); // promise of put response
    //- ref.post(message); // promise of post response
    //- ref.delete();
    
    //TBD: redirect response as link metadata (or auto redirect)
    //- as in engine configuration
});

test("Entity as a content metadata", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine();
    var ref = engine.link({href: "file:tests/assets/content.html"});
    ref.get().then(function (entity) {
        //[method for metadata access]
        //entity.href(); // URI of the entity
        //entity.find(key); // get the first metadata value of the entity
        //entity.list(key); // get metadata values of the entity
    }).then(done, done);
});

test("Entity as a link metadata container", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine();
    var ref = engine.link({href: "file:tests/assets/content.html"});
    ref.get().then(function (entity) {
        //[method for link metadata list access]
        //entity.entries(); // list of link metadata
        //entity.query({key: value}); //list of matched link metadata
        //entity.first({key: value}); //promise of a matched link metadata
    }).then(done, done);
});

test("Entity as a content metadata state", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine();
    var ref = engine.link({href: "file:tests/assets/content.html"});
    ref.get().then(function (entity) {
        //[method for metadata update]
        // entiry.set({key: value}); // update a value of the key
        // entiry.push({key: value}); // append a value of the key
        // entiry.remove({key: value}); // delete the key as the value
    }).then(done, done);
});

test("Entity as a link metadata container state", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine();
    var ref = engine.link({href: "file:tests/assets/content.html"});
    ref.get().then(function (entity) {
        //[method for link metadata list update]
        //entity.append(link); // append a link metadata
    }).then(done, done);
});
