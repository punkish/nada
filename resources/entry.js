'use strict';

const utils = require('../utils.js');
const config = require('../config');

const entry = {
    method: 'GET',

    /*
     *
     * /<Entry>
     * 
     */

    path: '/{entry}',

    config: {
        description: "dynamic serving of a specific entry or a subentry",
        tags: ['private']
    },

    handler: function (request, h) {

        const file = request.params['entry'];

        const entry = {
            url: config.url,
            website: config.website,
            author: config.author,
            title: config.title,
            license: config.license,
            lib: config.lib,
            root: config.root,
            toc: request.server.app.posts.byDate
        };

        const entryData = utils.getEntry({
            file: file,  
            singleEntry: true
        });

        for (let key in entry) {
            entryData[key] = entry[key];
        }

        // entryData.toc = request.server.app.posts.byDate;
        // console.log(entryData);
        
        return h.view(

            // content template
            entryData.content || 'entry', 

            // data
            entryData,

            // layout
            { layout: entryData.layout || 'main' }
        );
    }
};

module.exports = entry;