// This is for serving the static files in the public directory

const inert = {
    method: 'GET',

    path: '/lib/{param*}',

    config: {
        description: "static files for the website",
        tags: ['private']
    },

    handler: {
        directory: {
            path: './lib',
            redirectToSlash: true,
            index: true
        }
    }
};

module.exports = inert;