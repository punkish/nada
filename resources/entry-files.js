const config = require('../config');

const entryFiles = {
    method: 'GET',

    path: '/entry-files/{param*}',

    config: {
        description: "static files specific to an entry",
        tags: ['private']
    },

    handler: {
        directory: {
            path: config.srcDir,
            redirectToSlash: true,
            index: true
        }
    }
};


module.exports = entryFiles;