const nodeFiles = {
    method: 'GET',

    path: '/node-files/{param*}',

    config: {
        description: "static files specific to an entry",
        tags: ['private']
    },

    handler: {
        directory: {
            path: './node_modules',
            redirectToSlash: true,
            index: true
        }
    }
};


module.exports = nodeFiles;