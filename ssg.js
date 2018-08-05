'use strict';

const fs = require('fs-extra');
const handlebars = require('handlebars');
const utils = require('./utils.js');
const config = require('./config');

let layout = handlebars.compile(
    fs.readFileSync(`views/layouts/index.html`, 'utf8')
);

handlebars.registerPartial({
    footer: fs.readFileSync('views/partials/footer.html', 'utf8'),
    header: fs.readFileSync('views/partials/header.html', 'utf8'),
    meta: fs.readFileSync('views/partials/meta.html', 'utf8'),
    toc: fs.readFileSync('views/partials/toc.html', 'utf8')
});

const posts = utils.init();

// first, we make the index page
let entry = {
    url: config.url,
    website: config.website,
    author: config.author,
    title: config.title,
    license: config.license,
    lib: config.lib,
    root: config.root,
    toc: posts.byDate
};

fs.writeFileSync(`${config.dstDir}/index.html`, layout(entry));

// now, reset the root for individual entries
// entry.root = '../lib/';

for (let i = 0, j = posts.byDate.length; i < j; i++) {

    const file = posts.byDate[i]['file'];
    let entryData = utils.getEntry({
        file: file, 
        singleEntry: true
    });
    
    layout = handlebars.compile(
        fs.readFileSync(`views/layouts/${entryData.layout || "main"}.html`, 'utf8')
    );

    handlebars.registerPartial({
        content: fs.readFileSync(`views/${entryData.content || "entry"}.html`, 'utf8')
    });
    
    for (let key in entryData) {
        entry[key] = entryData[key];
    }

    fs.copySync(`${config.srcDir}/${file}/img`, `${config.dstDir}/${file}/img`);
    fs.writeFileSync(`${config.dstDir}/${file}/index.html`, layout(entry));
}