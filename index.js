'use strict';

/*

Start this program from the command line with `pm2`

    ~/Nodes/punkish$ NODE_ENV=production pm2 start index.js --name punkish
    ~/Nodes/punkish$ NODE_ENV=production pm2 restart index.js

To sync images and other binary files, run `rsync` from within 'punkish-ssg'

    ~Projects/punkish$ rsync -azPv --exclude-from exclude.txt ../punkish-ssg lko:/home/punkish/Nodes/

*/

const Hapi = require('hapi');

// blipp is a simple hapi plugin to display the routes table at startup
const Blipp = require('blipp');

// Static file and directory handlers for hapi.js
const Inert = require('inert');

// Templates rendering support for hapi.js
const Vision = require('vision');

const Handlebars = require('handlebars');

const server = Hapi.server({
    port: 3030,
    host: 'localhost'
});

const utils = require('./utils.js');

const init = async () => {

    await server.register([
        Inert,
        Blipp,
        Vision
    ]);

    server.app.posts = utils.init();

    server.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: './views',
        layoutPath: './views/layouts',
        partialsPath: './views/partials',
        //layout: 'main',
        //helpersPath: './templates/helpers'
        isCached: false
    });

    server.route([
        require('./resources/default-entry.js'),
        require('./resources/lib.js'),
        require('./resources/entry-files.js'),
        require('./resources/node-files.js'),
        require('./resources/entries.js'),
        require('./resources/entry.js')
    ]);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();