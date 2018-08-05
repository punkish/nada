'use strict';

const utils = require('../utils.js');
const config = require('../config');

const defaultEntry = {
    method: 'GET',
    path: '/',
    config: {
        description: "serve the toc if no specific entry is requested",
        tags: ['private']
    },
    handler: function (request, h) {

        const entryData = {
            url: config.url,
            website: config.website,
            author: config.author,
            title: config.title,
            license: config.license,
            lib: config.lib,
            root: config.root,
            toc: request.server.app.posts.byDate
        };
        
        return h.view(

            // content template
            entryData.type || 'entry', 

            // data
            entryData,

            // layout
            { layout: 'index' }
        );
    }
};

module.exports = defaultEntry;