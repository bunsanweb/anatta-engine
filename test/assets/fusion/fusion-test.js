/*global tap, fusion*/
"use strict";

tap.suite("[fusion]");
tap.test("apply fusion", () => {
    const template = document.querySelector(".items");
    
    const data = {
        title: "My News",
        href: "http://example.org/",
        links: [
            {title: "Hello", tags: "greeting", content: "Hello Fusion"},
            {
                title: "Good Bye",
                content: '<span style="color: red">...</span>'
            },
        ],
    };

    const node = fusion(data, template);
    //console.log(node.outerHTML);
    tap.equal(node.querySelector("span").textContent, data.title);
    tap.equal(node.querySelector("a").href, data.href);
    
    const items = node.querySelectorAll("article");
    tap.equal(items.length, data.links.length);
    
    tap.equal(items[0].querySelector("h1").textContent, data.links[0].title);
    tap.equal(items[0].querySelector("div").innerHTML, data.links[0].content);
    const tags = items[0].querySelector(".tags span");
    tap.equal(tags.textContent, data.links[0].tags);
    
    tap.equal(items[1].querySelector("h1").textContent, data.links[1].title);
    tap.equal(items[1].querySelector("div").innerHTML, data.links[1].content);
});
