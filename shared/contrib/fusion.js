"use strict";

var fusion = (function () {
    // Generic library for mapping entity and links to DOM Element tree
    // e.g. fusion(entity, templateTree[, doc]) => Element
    //
    // [Example HTML of template element tree]
    /*
       <div>
         <h1><a href="" data-fusion="href: href, text: name">
           XXXX</a></h1>
         <article id="" data-fusion="links: *, id: id">
           <h1><a href="" data-fusion="href: href, text: title">YYY</a></h1>
           <div data-fusion="html: body">ZZZ/div>
         </article>
         <a href="" data-fusion="when: next, href: next">next</a>
       </div>
    */
    
    // It also allow map data object to same template tree
    // e.g. fusion(jsonable, templateTree[. doc]) => Element
    //
    // [Example of JSONable object]
    /*
      {
        "name": "...",
        "href": "...",
        "links": [
          {"href": ...", "title": "..."},
          ...
        ]
      }
    */
    
    var fuse = function (context, template, doc) {
        if (typeof context.attr !== "function" && 
            typeof context.find !== "function") {
            context = JsonEntity(context);
        }
        return doFuse(context, template, doc);
    };
    var doFuse = function (context, template, doc) {
        doc = doc || template.ownerDocument;
        var result = doc.importNode(template, true);
        applyTree(result, context);
        return result;
    };
    var applyTree = function (elem, context) {
        if (elem.nodeType !== 1) return;
        var desc = pickDesc(elem);
        var parent = elem.parentNode;
        if (desc.when && !context.attr(desc.when)) {
            parent.removeChild(elem);
            return;
        }
        if (desc.unless && context.attr(desc.unless)) {
            parent.removeChild(elem);
            return;
        }
        if (desc.links) {
            var links = context.find(desc.links); //NOTE: "*" only allow
            var last = elem.nextSibling;
            links.forEach(function (link) {
                var cloned = elem.cloneNode(true);
                parent.insertBefore(cloned, last);
                applyMetadata(cloned, link, desc);
            });
            parent.removeChild(elem);
        } else {
            applyMetadata(elem, context, desc);
        }
    };
    var applyMetadata = function (elem, context, desc) {
        Object.keys(desc).forEach(function (key) {
            if (specials.indexOf(key) >= 0) return;
            if (shorthandAttrs[key]) {
                return elem[shorthandAttrs[key]] = context.attr(desc[key]);
            }
            if (htmlAttrs.indexOf(key) >= 0) {
                return elem[key] = context.attr(key);
            }
            elem.setAttribute(key, context.attr(key));
        });
        Array.prototype.forEach.call(elem.childNodes, function (child) {
            applyTree(child, context);
        });
    };
    var specials = ["links", "when", "unless"];
    var shorthandAttrs = {
        text: "textContent",
        html: "innerHTML",
        "class": "className",
    };
    var htmlAttrs = ["id", "title", "href", "src"];

    var pickDesc = function (elem) {
        // data-fusion="key1:value1,key2:value2" => {key1:value1, key2:value2}
        var src = elem.getAttribute("data-fusion") || "";
        elem.removeAttribute("data-fusion");
        return src.split(/\s*,\s*/).reduce(function (desc, kvstr) {
            var kv = kvstr.split(/\s*:\s*/);
            if (!kv[0]) return desc;
            desc[kv[0].toLowerCase()] = kv[1].toLowerCase();
            return desc;
        }, {});
    };
    
    // wrap as Metadata for JSONable object
    var JsonEntity = function JsonEntity(json) {
        return Object.create(JsonEntity.prototype, {
            json: {value: json},
        });
    };
    JsonEntity.prototype.attr = function (key) {
        var value = this.json[key];
        return value ? value.toString() : "";
    };
    JsonEntity.prototype.find = function (query) {
        if (query !== "*") return [];
        return (this.json.links || []).map(JsonLink);
    };
    var JsonLink = function JsonLink(json) {
        return Object.create(JsonLink.prototype, {
            json: {value: json},
        });
    };
    JsonLink.prototype.attr = function (key) {
        var value = this.json[key];
        return value ? value.toString() : "";
    };
    JsonLink.prototype.find = function (query) {
        return [];
    };
    
    return fuse;
})();
