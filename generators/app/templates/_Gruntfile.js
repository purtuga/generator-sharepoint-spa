module.exports = function(grunt) {

    "use strict";

    // If we don't yet have a user's build file, create it.
    if (!grunt.file.isFile('me.build.json')) {

        grunt.file.write('me.build.json',
            JSON.stringify({
                buildLocation:  "./_build",
                deployLocation: ""
            }, null, 4)
        );
        grunt.log.writeln("me.build.json file was created!\nOpen it to set build defults\n");

    }

    var
    userOpt     = grunt.file.readJSON('me.build.json'),
    pkgSetup    = grunt.file.readJSON('package.json'),
    requireCnfg = grunt.file.readJSON('setup/require.config.json'),
    buildDate   = grunt.template.today('yyyy-mm-dd'),
    buildYear   = grunt.template.today('yyyy'),
    buildId     = (new Date()).getTime(),
    _           = require("grunt/node_modules/lodash/lodash.js"),
    fs          = require('fs'),
    path        = require('path'),
    htmlMinifier= require('html-minifier').minify,
    isHtmlFile  = /\.html|htm$/i;


    /**
     * Grunt copy task processor that returns minified HTML markup. Meant to be
     * used with the processContent/process option of the copy task.
     *
     * @param {String} fileContent
     * @param {String} filePath
     * @return {String} file content
     *
     * @see https://www.npmjs.com/package/html-minifier
     *
     * @example
     *
     * copy: {
     *      build: {
     *          src: '',
     *          dest: '',
     *          expand: true,
     *          options: {
     *              processConent: minifyHtml
     *          }
     *      }
     * }
     *
     */
    function fileProcessorMinifyHtml(fileContent, filePath){

        if (isHtmlFile.test(filePath)) {

            grunt.verbose.writeln("minifyHtml: minifying: " + filePath);

            return htmlMinifier(fileContent, {
                    removeComments              : true,
                    collapseWhitespace          : true,
                    conservativeCollapse        : true,
                    collapseBooleanAttributes   : true,
                    removeEmptyAttributes       : true,
                    caseSensitive               : true,
                    ignoreCustomComments        : [
                                                    /^\s+ko/,
                                                    /\/ko\s+$/
                                                ]
                });

        }
        return fileContent;
    }


    /**
     * includeFile() - embeds a file content within another. Meant to be
     * used from the copy task as a 'processContent' function. The following
     * tokens can be used in files: <br>
     *
     *  -   BUILD_INCLUDE('file')
     *  -   / * BUILD_INCLUDE('file') *\x47
     *  -   &lt;!-- BUILD_INCLUDE("file") --&gt;
     *
     * In addition, options can be added to the token above that further
     * process the file being included:
     *
     *  -   BUILD_INCLUDE('file')[option1,option2,option3]
     *
     * Supported options:
     *
     *  -   asJsString : Escapes all double-quotes and new line characters
     *                   in the file
     *
     * @param {String} fileContent
     * @param {String} filePath
     *
     * @return {String} fileContent
     *
     * @example
     *
     *  ...
     *  copy: {
     *      options: {
     *          expand: true,
     *          process: includeFile
     *      }
     *  }
     *  ...
     *
     */
    function includeFile(fileContent, filePath){

        if (fileContent.indexOf("BUILD_INCLUDE") > -1) {

            grunt.log.write("includeFile(): [" + filePath + "] has BUILD_INCLUDE: ");

            // Match:
            //      // BUILD_INCLUDE('file')
            //      /* BUILD_INCLUDE('file') */
            //      <!-- BUILD_INCLUDE("file") -->
            //
            //  Token OPtions:
            //      // BUILD_INCLUDE('file')[options,here,as,array]
            //
            //      asJsString
            //
            var re = /(?:(?:\/\/)|(?:<\!\-\-)|(?:\/\*)) {0,}BUILD_INCLUDE\(['"](.*)['"]\)(?:\[(.*)\])?(?: {0,}(?:\-\-\>)| {0,}(?:\*\/))?/i,
                match, file, fileIncludeOptions;

            while ((match = re.exec(fileContent)) !== null) {

                grunt.log.write(".");
                grunt.verbose.writeln("    Match array: " + match );

                file = grunt.template.process( match[1] );

                grunt.verbose.writeln("    File to embed: " + file );

                file = grunt.file.read( file );

                // If options were set, then parse them
                if (match[2]) {

                    fileIncludeOptions = match[2].split(',');

                    // If option: asJsString
                    if (
                        fileIncludeOptions.some(function(option){
                            return String(option).toLowerCase() === "asjsstring";
                        })
                    ) {

                        file = file
                                .replace(/\"/g, '\\x22')
                                .replace(/\r\n|\n/g, "\\n");

                    }


                }

                fileContent = fileContent.replace(match[0], function(){ return file; });

            }
            grunt.log.writeln("");
            return fileContent;

        }

        return fileContent;

    }

    /**
     * Replaces build variables in files with actual values. Meant to be used
     * with the 'copy' task as a contentProcess function
     *
     * @param {String} fileContent
     * @param {String} srcPath
     *
     * @return {String}
     */
    function replaceBuildVariables(fileContent, srcPath){

        grunt.verbose.writeln("Processing : " + srcPath );

        return fileContent
            .replace( /@BUILD/g, buildId)
            .replace( /@VERSION/g, grunt.template.process("<%= pkg.version %>"))
            .replace( /@DATE/g, buildDate )
            .replace( /@YEAR/g, buildYear );

    } //end: replaceBuildVariables()

    /**
     * Returns a function that can be used with grunt's copy
     * task 'filter' option. Checks if file being copied
     * is newer than that destination file.
     *
     * @param {Object} target
     *      The config object from copy task.
     * @param {String} timestampFile
     *      A timestamp file. Will be used instead of accessing the
     *      destination file when detemining if file should be copied.
     *
     * @return {Boolean}
     *      True - yes, its new
     *      false - no, its not new
     *
     * @see {https://github.com/gruntjs/grunt-contrib-copy/issues/78#issuecomment-19027806}
     *
     */
    function onlyNew(target, timestampFile) {

        if (!onlyNew.isTaskCreated) {

            onlyNew.isTaskCreated = true;

            grunt.registerTask('onlyNewPostRun', function(){
                var file = Array.prototype.slice.call(arguments, 0).join(':');
                grunt.log.writeln("onlyNewPostRun Task RUNNING for file: " + file);
                fs.writeFileSync(file, 'temp file');
            });

            onlyNew.timestampFiles = {};

        }

        // Return the callback function for each file check - used in the task
        return function(src) {

            var dest    = grunt.config(target.concat('dest')),
                cwd     = grunt.config(target.concat('cwd')),
                dstat, stat, response;

            if (!timestampFile) {
                dest = cwd ?
                       path.join(dest, path.relative(cwd, src)) :
                       path.join(dest, src);

            } else {
                dest = timestampFile;
            }

            if (timestampFile && !onlyNew.timestampFiles[timestampFile]) {
                onlyNew.timestampFiles[timestampFile] = true;
                grunt.task.run("onlyNewPostRun:" + timestampFile);
            }

            // grunt.log.writeln("this.target: " + this.name);

            grunt.verbose.writeln("Src  File: " + src);
            grunt.verbose.writeln("Dest File: " + dest);

            try {
                dstat   = fs.statSync(dest);
                stat    = fs.statSync(src);
            } catch (e) {
                // grunt.log.writeln("    Unable to get stat data... Returning True");
                return true;
            }

            // grunt.log.writeln("    Src  is File: " + stat.isFile() + " | mTime: " + stat.mtime.getTime());
            // grunt.log.writeln("    Dest is File: " + dstat.isFile() + " | mTime: " + dstat.mtime.getTime());
            // grunt.log.writeln("mod[" + dstat.mtime.getTime() + "]: " + dest);

            response = ( stat.isFile() && stat.mtime.getTime() > dstat.mtime.getTime() );
            // grunt.log.writeln("    Response: " + response);
            return response;

        };

    } //end: onlyNew()


    // ----------------
    // Validations
    // ----------------
    if (!userOpt.buildLocation) {
        grunt.fail.fatal("me.build.json: missing buildLocation value!" );
        return;
    }

    // Expand any templates in buildLocation... Uses custom data for expansion.
    userOpt.buildLocation = grunt.template.process(
        userOpt.buildLocation,
        {
            data: {
                ENV: process.env
            }
        }
    );

    // If the build folder is the same as this directory, error.
    if (grunt.file.isPathCwd(userOpt.buildLocation)) {
        grunt.fail.fatal("me.build.json: buildLocation cannot be current directory (cwd)!" );
        return;
    }

    // If build folder does not exist, create it
    if (!grunt.file.exists(userOpt.buildLocation) ||
        !grunt.file.isDir(userOpt.buildLocation)
    ) {
        grunt.file.mkdir(userOpt.buildLocation);
    }

    // Task configuration.
    grunt.initConfig({

        pkg: pkgSetup,

        ENV: process.env,

        userOpt: userOpt,

        buildFolder: "<%= userOpt.buildLocation %>/<%= pkg.name %>",

        buildTempFolder: "<%= buildFolder %>/_temp",

        banner : '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        // Task configuration.
        clean : {
            options: {
                force: true
            },
            files : [
                '<%= buildFolder %>'
            ],
            build: [
                '<%= buildFolder %>/app/app.aspx',
                '<%= buildFolder %>/app/scripts/init.js',
                '<%= buildTempFolder %>/appInit.js',
                '<%= buildTempFolder %>/appLoad.html'
            ]
        },
        concat : {
            options : {
                banner:         '<%= banner %>',
                stripBanners:   true
            },
            dist : {
                src:    [],
                dest:   'app.<%= pkg.name %>.js'
            }
        },
        copy: {
            options: {
                processContentExclude: [
                    '**/*.{png,gif,jpg,ico,psd}'
                ]
            },
            spaCode: {
                options: {
                    expand: true,
                    processContent: function(fileData, srcPath){
                        return includeFile(
                                    replaceBuildVariables(fileData, srcPath),
                                    srcPath
                                );
                    }
                },
                expand: true,
                files: {
                    '<%= buildTempFolder %>/appInit.js': 'setup/initApp.compiled.js',
                    '<%= buildTempFolder %>/spa.js': 'app/scripts/init.js'
                }
            },
            spaExe: {
                options: {
                    expand: true,
                    processContent: function(fileData, srcPath){
                        return includeFile(
                                    replaceBuildVariables(fileData, srcPath),
                                    srcPath
                                );
                    }
                },
                expand: true,
                files: {
                    '<%= buildTempFolder %>/appLoad.html': 'setup/load.compiled.html',
                    '<%= buildFolder %>/app.run.aspx': 'app/app.aspx'
                }
            },
            spaDebugCode: {
                options: {
                    expand: true,
                    processContent: function(fileData, srcPath){
                        return includeFile(
                                    replaceBuildVariables(fileData, srcPath),
                                    srcPath
                                );
                    }
                },
                expand: true,
                files: {
                    '<%= buildTempFolder %>/appInit.js': 'setup/initApp.compiled.js',
                    '<%= buildTempFolder %>/spa.min.js': 'app/scripts/init.js'
                }
            },
            spaDebugExe: {
                options: {
                    expand: true,
                    processContent: function(fileData, srcPath){
                        return includeFile(
                                    replaceBuildVariables(fileData, srcPath),
                                    srcPath
                                );
                    }
                },
                expand: true,
                files: {
                    '<%= buildTempFolder %>/appLoad.html': 'setup/load.compiled.html',
                    '<%= buildFolder %>/app.debug.aspx': 'app/app.aspx'
                }
            },
            buildPrep: {
                options: {
                    expand: true,
                    processContent: function(fileData, srcPath){
                        return includeFile(
                                    replaceBuildVariables(fileData, srcPath),
                                    srcPath
                                );
                    }
                },
                expand: true,
                files: [
                    {
                        '<%= buildTempFolder %>/appInit.js': 'setup/initApp.requirejs.js',
                        '<%= buildTempFolder %>/appLoad.html': 'setup/load.requirejs.html'
                    }
                ]
            },
            build: {
                options: {
                    expand: true,
                    processContent: function(fileData, srcPath){
                        // Skip files from vendor/ folder
                        if (srcPath.indexOf("app/vendor/") > -1) {
                            return fileData;
                        }
                        // Process the content
                        var content = fileProcessorMinifyHtml(fileData, srcPath);
                        content = replaceBuildVariables(content, srcPath);
                        content = includeFile(content, srcPath);
                        return content;
                    }
                },
                expand: true,
                filter: onlyNew(['copy', 'build']),
                dest: "<%= buildFolder %>",
                // Any other folder added to the APP folder should be added below.
                // Also, any new vendor library should be added below so that its
                // included in the build.
                src: [
                    "app/*.aspx",
                    "app/scripts/**/*",
                    "app/styles/**/*",
                    "app/vendor/requirejs/require.js",
                    "app/vendor/requirejs-text/text.js",
                    "app/vendor/require-less/*.js"<$=props.gruntfile.join('')$>
                ]
            },
            deploy: {
                options : {
                    processContentExclude: [ '**/*.*' ]
                },
                cwd: "<%= buildFolder %>",
                src:    [
                   "app/**/*",
                   "app.run.aspx",
                   "app.debug.aspx"
                ],
                dest:   "<%= userOpt.deployLocation %>",
                expand: true,
                filter: onlyNew(
                    ['copy', 'deploy'],
                    // file includes deploy location name
                    path.join(
                        userOpt.buildLocation,
                        pkgSetup.name,
                        "deploy.timestamp--" + userOpt.deployLocation.replace(/\W/g, "") + ".txt"
                    )
                )
            }
        },
        uglify : {
            options : {
                banner :    '<%= banner %>',
                sourceMap:  true
            },
            spa: {
                src:    '<%= buildTempFolder %>/spa.js',
                dest:   '<%= buildTempFolder %>/spa.min.js'
            },
            app: {
                options: {
                    sourceMap: true
                },
                files: [{
                    expand: true,
                    cwd:    "<%= buildFolder %>/app/scripts",
                    src:    "**/*.js",
                    dest:   "<%= buildFolder %>/app/scripts"
                }]
            }
        },

        jshint : {
            options : {
                jshintrc : true
            },
            gruntfile : {
                src : 'Gruntfile.js'
            },
            src : {
                src : [
                    'app/scripts/**/*.js'
                ]
            },
            test : {
                src : ['test/**/*.js']
            }
        },
        watch : {
            gruntfile : {
                files : '<%= jshint.gruntfile.src %>',
                tasks : ['jshint:gruntfile']
            },
            src : {
                files : [
                    'src/**/*'
                ],
                tasks : ['jshint:src']
            },
            test : {
                files : '<%= jshint.test.src %>',
                tasks : ['jshint:test']
            }
        },

        requirejs: {
            // Options Documented here:
            //      https://github.com/jrburke/r.js/blob/master/build/example.build.js
            compile: {
                options: {
                    baseUrl: "<%= buildFolder %>/app",
                    urlArgs: buildId,
                    paths: _.extend({}, requireCnfg.paths, {
                        'less-builder': 'vendor/require-less/less-builder'
                        // Any library that should not be included in the single
                        // compiled module, should be listed here with a value of
                        // 'empty'. Example: to exclude jquery, do the following:
                        //            'jquery': 'empty'
                        // See:
                        //    http://requirejs.org/docs/optimization.html#empty
                    }),
                    less: {
                        relativeUrls:   true,
                        logLevel:       0
                    },
                    exclude: [
                        "less", "text", "normalize", "less-builder"
                    ],
                    optimize: "none",
                    done: function(done, output) {
                        var
                        duplicates = require('rjs-build-analysis').duplicates(output),
                        key;

                        if (Object.keys(duplicates).length > 0) {
                            grunt.log.subhead('Duplicates found in requirejs build:');
                            for (key in duplicates) {
                                grunt.log.error(duplicates[key] + ": " + key);
                            }
                            return done(new Error('r.js built duplicate modules, please check the excludes option.'));
                        } else {
                            grunt.log.success("requirejs:compile - No duplicates found!");
                        }

                        done();
                    },
                    onModuleBundleComplete: function (data) {
                        var fs = require('fs'),
                            amdclean = require('amdclean'),
                            outputFile = data.path;

                            // Make a copy of the requireJS optmized file
                            fs.writeFileSync(
                                outputFile + ".requirejs.optimized.js",
                                fs.readFileSync(outputFile)
                            );

                            fs.writeFileSync(outputFile, amdclean.clean({
                                'filePath': outputFile,
                                // Modules that are not packaged with your app, but
                                // are referenced in requireJS code, should be listed here.
                                // Ex. knockout, jquery, etc.
                                'ignoreModules': [],
                                wrap: {
                                    // start: 'var appMain;\n',
                                    end: '\n appMain = scripts_main;\n}());'
                                }
                            }));
                    },
                    name: "scripts/main",
                    out: "<%= buildTempFolder %>/app.code.js"
                }

            } // end: requirejs:compile

        }

    }); //end: config()


    //-------------------------------------------
    //     LOAD TASKS
    //-------------------------------------------
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-requirejs');


    //-------------------------------------------
    //      REGISTER TASKS
    //-------------------------------------------

    grunt.registerTask('default', ['build']);

    grunt.registerTask('build', function(){

        grunt.file.write(grunt.template.process("<%= buildTempFolder %>/app.code.js"), "");

        grunt.task.run([
            "jshint",
            "clean:build",
            "copy:buildPrep",
            'copy:build'
        ]);
    });

    /**
     * Deploy task
     * Will use the my.build.json settings to
     * copy content from the build folder to the deploy destination.
     *
     */
    grunt.registerTask('deploy', function(){
        if (!grunt.config.get(["userOpt", "deployLocation"])) {
            grunt.fail.fatal("me.build.json: missing deployLocation value!" );
            return;
        }

        grunt.log.writeln("Deploy to: " + grunt.config.get(["userOpt", "deployLocation"]));
        grunt.task.registerTask("deploy-DONE", function(){
            grunt.log.writeln("------------------------------------------------");
            grunt.log.writeln("   BUILD ID: " + buildId);
            grunt.log.writeln("------------------------------------------------");
            grunt.log.writeln("");
        });
        grunt.task.run([
            "build",
            "copy:deploy",
            "deploy-DONE"
        ]);
    });

    /**
     * Builds the Single Page Application into 1 single file. This builds two files
     * -    One with the minified code; app.run.aspx
     * -    One with the non-minified code: app.debug.aspx
     */
    grunt.registerTask('spa', function(){

        grunt.task.run([
            "build",
            "requirejs:compile",
            "copy:spaDebugCode",
            "copy:spaDebugExe",
            "copy:spaCode",
            "uglify:spa",
            "copy:spaExe",
            "uglify:app"
        ]);

    });

}; //end: module.exports
