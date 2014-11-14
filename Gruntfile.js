var path = require('path');
var unwrap = require('unwrap');


module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            version: '<%= pkg.version %>',
            core_banner: '// Rivet MarionetteJS (Backbone.Marionette)\n' +
                '// ----------------------------------\n' +
                '// v<%= pkg.version %>\n' +
                '//\n' +
                '// Copyright (c)<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                '// Distributed under MIT license\n' +
                '//\n' +
                '// http://marionettejs.com\n' +
                '\n',
            banner: '<%= meta.core_banner %>\n' +
                '/*!\n' +
                ' * Includes sightglass\n' +
                ' * https://github.com/mikeric/rivets/\n' +
                ' *\n' +
                ' * Includes rivets\n' +
                ' * https://github.com/mikeric/sightglass/\n' +
                ' */\n\n\n'
        },

        clean: {
            tmp: '.tmp',
            build: 'build'
        },

        bower: {
            install: {
                options: {
                    copy: false
                }
            }
        },

        preprocess: {
            core: {
                src: 'src/build/marionette.rivets.core.js',
                dest: '.tmp/marionette.rivets.core.js'
            },
            bundle: {
                src: 'src/build/marionette.rivets.bundle.js',
                dest: '.tmp/marionette.rivets.js'
            }
        },

        template: {
            options: {
                data: {
                    version: '<%= pkg.version %>'
                }
            },
            core: {
                src: '<%= preprocess.core.dest %>',
                dest: '<%= preprocess.core.dest %>'
            },
            bundle: {
                src: '<%= preprocess.bundle.dest %>',
                dest: '<%= preprocess.bundle.dest %>'
            }
        },

        concat: {
            options: {
                banner: '<%= meta.core_banner %>'
            },
            core: {
                src: '<%= preprocess.core.dest %>',
                dest: 'build/core/backbone.marionette.rivets.js'
            },
            bundle: {
                options: {
                    banner: '<%= meta.banner %>'
                },
                src: '<%= preprocess.bundle.dest %>',
                dest: 'build/backbone.marionette.rivets.js'
            }
        },

        uglify: {
            core: {
                src: '<%= concat.core.dest %>',
                dest: 'build/core/backbone.marionette.rivets.min.js',
                options: {
                    banner: '<%= meta.core_bundle %>',
                    sourceMap: true,
                    sourceMapName: 'build/core/backbone.marionette.rivets.map',
                    sourceMapPrefix: 1
                }
            },
            bundle: {
                src: '<%= concat.bundle.dest %>',
                dest: 'build/backbone.marionette.rivets.min.js',
                options: {
                    banner: '<%= meta.banner %>',
                    sourceMap: true,
                    sourceMapName: 'build/backbone.marionette.rivets.map',
                    sourceMapPrefix: 2
                }
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },

            marionette: {
                src: ['src/*.js']
            }
        },



        'string-replace': {
            sightglass: {
                files: {
                    './.tmp/sightglass.bare.js': './bower_components/sightglass/index.js'
                },
                options: {
                    replacements: [{
                        pattern: /\(function\(\) {/g,
                        replacement: ''
                    }, {
                        pattern: /if\(typeof module([\s\S]*?)else {([^}]*)}/g,
                        replacement: ''
                    }, {
                        pattern: /}\).call\((this)\)/g,
                        replacement: ''
                    }]
                }
            }

        },

        coffee: {
            compile: {
                options: {
                    bare: true
                },
                files: {
                    './.tmp/rivets.bare.js': ['./bower_components/rivets/src/rivets.coffee',
                        './bower_components/rivets/src/util.coffee',
                        './bower_components/rivets/src/parsers.coffee',
                        './bower_components/rivets/src/observer.coffee',
                        './bower_components/rivets/src/view.coffee',
                        './bower_components/rivets/src/bindings.coffee',
                        './bower_components/rivets/src/binders.coffee',
                        './bower_components/rivets/src/adapter.coffee',
                        './src/build/export.rivets.coffee'
                    ]
                }
            },

        },



        unwrap: {
            sightglass: {
                src: './bower_components/sightglass/index.js',
                dest: './tmp/sightglass.bare.js'
            },
            rivets: {
                src: './bower_components/rivets/dist/rivets.js',
                dest: './tmp/rivets.bare.js'
            }
        }
    });


    grunt.registerMultiTask('unwrap', 'Unwrap UMD', function() {
        console.log('unwrap task');
        var done = this.async();
        var timesLeft = 0;
        console.log('unwrap task');
        this.files.forEach(function(file) {
            console.log('unwrap task');
            file.src.forEach(function(src) {
                console.log('unwrap task', path.resolve(__dirname, src));
                console.log(unwrap);
                timesLeft++;
                unwrap(path.resolve(__dirname, src), function(err, content) {
                    onsole.log('unwrap task');
                    if (err) return grunt.log.error(err);
                    grunt.file.write(path.resolve(__dirname, file.dest), content);
                    grunt.log.ok(file.dest + ' created.');
                    timesLeft--;
                    if (timesLeft <= 0) done();
                });
            });
        });
    });

    grunt.registerTask('verify-bower', function() {
        if (!grunt.file.isDir('./bower_components')) {
            grunt.fail.warn('Missing bower components. You should run `bower install` before.');
        }
    });


    grunt.registerTask('lint', 'Lints our sources', ['jshint']);

    grunt.registerTask('build', 'Build all three versions of the library.', ['clean', 'bower:install', 'lint', 'string-replace', 'coffee', 'preprocess', 'template', 'concat', 'uglify']);
};
