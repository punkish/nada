'use strict';

const moment = require('moment');
const utils = require('../utils.js');
const config = require('../config');

const entries = {
    method: 'GET',

    /*
     *
     * /entries<?by=dates>
     * /entries?q=<searchterm>
     * /entries?by=tags
     * 
     */

    path: '/entries/{abc?}',

    config: {
        description: "dynamic serving of list of entries by either tags or dates",
        tags: ['private']
    },

    handler: function (request, h) {

        let template = 'search';
        let layout = 'main';
        let data = {
            'created': moment().format('MMM DD, YYYY')
        };
        
        if (request.params['abc']) {
            const abc = request.params['abc'].toLowerCase();
            let matches = [];
            let j = utils.posts.byDate.length;

            for (let i = 0; i < j; i++) {
                if (~utils.posts.byDate[i]['title'].toLowerCase().indexOf(abc)) {
                    //matches.push([utils.posts.byDate[i]['title'], utils.posts.byDate[i]['file']]);
                    matches.push(utils.posts.byDate[i]['title']);
                }
            }

            return JSON.stringify(matches);

        }
        else {
        
            // /entries?by=tag(s)
            // /entries?by=date(s)
            if (request.query['by']) {

                let by = request.query['by'];
                if (by.indexOf('tag') > -1) {
                    by = 'tag';
                    data['posts'] = request.server.app.posts['byTag'];
                }
                else if (by.indexOf('date') > -1) {
                    by = 'date';
                    data['posts'] = request.server.app.posts['byYear'];
                }

                template = `entries-by-${by}`;
            }

            // /entries?q=searchterm
            else if (request.query['q']) {

                data['searchTitle'] = 'Search Results';

                let q = request.query['q'];

                if ((q.indexOf('tag:') > -1) || (q.indexOf('tags:') > -1)) {
                    const tag = q.split(':')[1];

                    if (utils.posts.byTag[tag]) {
                        data['searchResults'] = utils.posts.byTag[tag].map(x => {
                            return {
                                ref: x.file,
                                disp: x.title
                            }
                        });
                    }
                    else {
                        data['searchResults'] = utils.idx.query(function () {
                            this.term(`${tag}~1`, {
                                fields: ['tags']
                            });
                        }).map(result => {
                            return {
                                ref: result.ref,
                                disp: result.ref.replace(/-/g, ' ')
                            }
                        });
                    }
                }
                else {
                    data['searchResults'] = utils.idx.search(q)
                        .map(result => {
                            return {
                                ref: result.ref,
                                disp: result.ref.replace(/-/g, ' ')
                            }
                        });
                }

                
                

                // data['searchResults'] = utils.idx.query("hand drawn maps", {
                //     fields: ["tags"]
                //     //boost: 10,
                //     //wildcard: lunr.Query.wildcard.TRAILING
                // }).map(function(result) {
                //     return {
                //         ref : result.ref,
                //         disp : result.ref.replace(/-/g, ' ')
                //     }
                // });
            }
            // else {
            //     template = 'entries-by-date';
            //     data['posts'] = request.server.app.posts['byDate'];
            // }

            return h.view(

                // content template
                template, 
    
                // data
                data,
    
                // layout
                { layout: layout }
            );
        }

        
        
    }
};

module.exports = entries;