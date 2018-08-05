'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');
//const lunr = require('lunr');
const Yaml = require('yaml-front-matter');
const showdown = require('showdown');
const sh = new showdown.Converter({
    tables: true
});
const config = require('./config');
const untaggedLabel = 'untagged';

const utils = {

    toTitleCase: function(str) {
        return str.replace(
            /\w\S*/g, 
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    },

    findFile: function(file) {

        // since the user-entered file could be different from the 
        // actual file on disk (different case, different words, etc.)
        // we have to figure out the correct file. We do that by 
        // finding its instance in the pre-built 'posts' index
        for (let i = 0, j = utils.posts.byDate.length; i < j; i++) {
            if (file.toLowerCase() === utils.posts.byDate[i]['file'].toLowerCase()) {
                file = utils.posts.byDate[i]['file'];
                return file;
            }
        }

        // nothing found
        return false;
    },

    getEntry: function(options) {
        let file = options['file'];
        const singleEntry = options['singleEntry'];

        if (singleEntry) {

            if (!this.findFile(file)) {
                file = this.posts.byDate[0]['file'];
            }
        }
        

        // construct the entry directory and the entry URL
        let entryDir = `${config.srcDir}/${file}`;
        let entryUrl = `${file}`;

        if (config.fileLayout === 'hierarchical') {
            const o = file.substr(0, 1).toUpperCase();
            const t = file.substr(0, 2).toUpperCase();
            const r = file.substr(0, 3).toUpperCase();
            entryDir = `${config.srcDir}/${o}/${t}/${r}/${file}`;
            entryUrl = `${file}`;
        }

        // this is the path to the actual entry file
        const entryIndex = `${entryDir}/index.md`;
        
        try {

            const fileContents = fs.readFileSync(entryIndex, 'utf8');

            let entry = Yaml.loadFront(fileContents);
            if (entry) {

                // format user-entered date using moment
                let dateFormat = 'YYYY-MM-DD HH:MM:SS';
                if (singleEntry) {
                    dateFormat = 'MMM DD, YYYY';
                }
                
                if (entry.modified) {
                    entry.created = moment(entry.modified).format(dateFormat);
                }
                else if (entry.created) {
                    entry.created = moment(entry.created).format(dateFormat);
                }
                else {
                    entry.created = moment().format(dateFormat);
                }

                if (!entry.title) {
                    entry.title = file;
                }

                entry.entryDir = entryDir;
                entry.entryUrl = entryUrl;

                if (singleEntry) {
                    
                    entry.__content = sh.makeHtml(entry.__content);
                    entry.__content = entry.__content.replace(
                        /img src="(.*?)\.(png|gif|jpg)(.*)/g, 
                        `img src="img/$1.$2$3`
                    );

                    // find prev and next entries
                    let i = 0;
                    const j = this.posts.byDate.length;
                    for (; i < j; i++) {
                        if (file.toLowerCase() === this.posts.byDate[i]['file'].toLowerCase()) {

                            if (i == 0) {
                                entry.prev = this.posts.byDate[i];
                            }
                            else if (i > 0) {
                                entry.prev = this.posts.byDate[i - 1];
                            }
                            
                            if (i < j) {
                                entry.next = this.posts.byDate[i + 1];
                            }
                            else if (i == j) {
                                entry.next = this.posts.byDate[i];
                            }
                            
                            break;
                        }
                    }
                }


                return entry;
            }
        }
        catch (e) {
            return {
                title: "Error",
                __content: "Not found"
            }
        }
    },

    posts: {
        byTag: {},
        byDate: [],
        byYear: []
    },

    dirWalker: function(start) {
        const files = fs.readdirSync(start);
        let i = 0;
        let j = files.length;

        for (; i < j; i++) {
            const f = files[i];
            const next = start + '/' + f;
            const stats = fs.statSync(next);
            if (stats.isDirectory()) {
                this.dirWalker(next);
            }
            else if (stats.isFile()) {
                if (path.basename(next) === 'index.md') {
    
                    const nextParts = next.split('/');
                    const file = nextParts[nextParts.length - 2];
                    const entry = utils.getEntry({
                        file: file, 
                        singleEntry: false
                    });
    
                    const entryIdx = {
                        title: entry.title,
                        file: file,
                        tags: entry.tags,
                        notes: entry.notes,
                        created: entry.created
                    };
    
                    if (entry.tags) {
                        for (i = 0, j = entry.tags.length; i < j; i++) {
                            if (this.posts.byTag[entry.tags[i]]) {
                                this.posts.byTag[entry.tags[i]].push(entryIdx);
                            }
                            else {
                                this.posts.byTag[entry.tags[i]] = [entryIdx]
                            }
                        }
                    }
                    else {
                        if (this.posts.byTag[untaggedLabel]) {
                            this.posts.byTag[untaggedLabel].push(entryIdx);
                        }
                        else {
                            this.posts.byTag[untaggedLabel] = [entryIdx]
                        }
                    }

                    const entryYear = moment(entry.created).format('YYYY');
                    const entryMonth = moment(entry.created).format('M');
                    const indexOfYear = this.posts.byYear.map(x => { return x.year }).indexOf(entryYear);
                    const entrySmallIdx = {
                        title: entry.title,
                        file: file,
                        notes: entry.notes
                    };

                    if (indexOfYear > -1) {
                        
                        const indexOfMonth = this.posts.byYear[indexOfYear].months.map(x => { return x.month }).indexOf(entryMonth);
                        if (indexOfMonth > -1) {

                            if (this.posts.byYear[indexOfYear].months[indexOfMonth].entries.length) {
                                this.posts.byYear[indexOfYear].months[indexOfMonth].entries.push(entrySmallIdx);
                            }
                            else {
                                this.posts.byYear[indexOfYear].months[indexOfMonth].entries = [ entrySmallIdx ];
                            }
                        }
                        else {
                            this.posts.byYear[indexOfYear].months.push(
                                {
                                    month: entryMonth,
                                    entries: [ entrySmallIdx ]
                                }
                            )
                        }
                    }
                    else {
                        this.posts.byYear.push(
                            {
                                year: entryYear,
                                months: [
                                    {
                                        month: entryMonth,
                                        entries: [ entrySmallIdx ]
                                    }
                                ]
                            }
                        )
                    }

                    this.posts.byDate.push(entryIdx);
                }
            }
        }
    },

    init: function() {
        
        this.dirWalker(config.srcDir);
        
        const sortFunc = function(field) {
            return function(a, b) {
                if (a[field] < b[field]) {
                    return 1;
                }
                if (a[field] > b[field]) {
                    return -1;
                }
        
                // names must be equal
                return 0;
            }
        };

        //this.posts.byDate.sort(sortFunc('created'));
        this.posts.byDate.sort(sortFunc('title'));

        this.posts.byYear.sort((a, b) => b['year'] - a['year']); // For descending sort

        this.posts.byYear.forEach(x => {
            x.months.sort((a, b) => b['month'] - a['month']); // For descending sort
        });

        return this.posts;
    }
};

module.exports = utils;