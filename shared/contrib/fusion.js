"use strict";

window.fusion = (function () {
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
    
    const fuse = (context, template, doc) => {
        if (typeof context.attr !== "function" &&
            typeof context.find !== "function") {
            context = JsonEntity(context);
        }
        return doFuse(context, template, doc);
    };
    const doFuse = (context, template, doc) => {
        doc = doc || template.ownerDocument;
        const result = doc.importNode(template, true);
        applyTree(result, context);
        return result;
    };
    const applyTree = (elem, context) => {
        if (elem.nodeType !== 1) return;
        const desc = pickDesc(elem);
        const parent = elem.parentNode;
        if (desc.when && !context.attr(desc.when)) {
            parent.removeChild(elem);
            return;
        }
        if (desc.unless && context.attr(desc.unless)) {
            parent.removeChild(elem);
            return;
        }
        if (desc.links) {
            const links = context.find(desc.links); //NOTE: "*" only allow
            const last = elem.nextSibling;
            links.forEach(link => {
                const cloned = elem.cloneNode(true);
                parent.insertBefore(cloned, last);
                applyMetadata(cloned, link, desc);
            });
            parent.removeChild(elem);
        } else {
            applyMetadata(elem, context, desc);
        }
    };
    const applyMetadata = (elem, context, desc) => {
        Object.keys(desc).forEach(key => {
            if (specials.indexOf(key) >= 0) return null;
            const attr = context.attr(desc[key]);
            if (shorthandAttrs[key]) {
                return void (elem[shorthandAttrs[key]] = attr);
            } else if (htmlAttrs.indexOf(key) >= 0) {
                return void (elem[key] = attr);
            }
            return void elem.setAttribute(key, attr);
        });
        Array.from(elem.childNodes).forEach(
            child => applyTree(child, context));
    };
    const specials = ["links", "when", "unless"];
    const shorthandAttrs = {
        text: "textContent",
        html: "innerHTML",
        class: "className"
    };
    const htmlAttrs = ["id", "title", "lang", "rel"];

    const pickDesc = (elem) => {
        // data-fusion="key1:value1,key2:value2" => {key1:value1, key2:value2}
        const src = elem.getAttribute("data-fusion") || "";
        elem.removeAttribute("data-fusion");
        return src.split(/\s*,\s*/).reduce((desc, kvstr) => {
            const kv = kvstr.split(/\s*:\s*/);
            if (!kv[0]) return desc;
            desc[kv[0].toLowerCase()] = kv[1];
            return desc;
        }, {});
    };
    
    // wrap as Metadata for JSONable object
    const JsonEntity = function JsonEntity(json) {
        return Object.create(JsonEntity.prototype, {
            json: {value: json}
        });
    };
    JsonEntity.prototype.attr = function (key) {
        const value = this.json[key];
        return value ? value.toString() : "";
    };
    JsonEntity.prototype.find = function (query) {
        if (query !== "*") return [];
        return (this.json.links || []).map(JsonLink);
    };
    const JsonLink = function JsonLink(json) {
        return Object.create(JsonLink.prototype, {
            json: {value: json}
        });
    };
    JsonLink.prototype.attr = function (key) {
        const value = this.json[key];
        return value ? value.toString() : "";
    };
    JsonLink.prototype.find = function (query) {
        return [];
    };
    
    return fuse;
})();
