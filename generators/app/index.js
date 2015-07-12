'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');

module.exports = yeoman.generators.Base.extend({

    prompting : function() {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay('Welcome to the supreme ' + chalk.red('SharePoint SPA') + ' generator!'));

        var prompts = [
            {
                type : 'input',
                name : 'appName',
                message : 'What is the App name?',
                default : this.appname,
                validate: function(val){ return !!String(val).trim(); }
            },
            {
                type : 'input',
                name : 'appVersion',
                message : 'What is the version number for the App?',
                default : '0.1.0',
                validate: function(val){ return !!String(val).trim(); }
            },
            {
                type : 'input',
                name : 'authorName',
                message : 'Who is the Author Name?',
                default : ''
            },
            {
                type : 'checkbox',
                name : 'libraries',
                message : 'Select Libraries to Install?',
                choices: [
                    {
                        name: "SPWidgets - jQuery SharePoint Widgets",
                        value: {
                            bower:      ",\n        " + '"SPWidgets": "purtuga/SPWidgets#^2.5.2"',
                            requirejs:  ",\n                " + '"SPWidgets": "vendor/SPWidgets/src"',
                            gruntfile:  "\n" + '                    "app/vendor/SPWidgets/src/**/*"'
                        }
                    },
                    {
                        name: "SPServices - jQuery SharePoint WebServices API",
                        value: {
                            bower: ",\n        " + '"SPServices": "sympmarc/SPServices#2014.02"'
                        }
                    },
                    {
                        name: "SharepointPlus - Extended features for SharePoint",
                        value: {
                            bower: ",\n        " + '"SharepointPlus": "Aymkdn/SharepointPlus#^3.0.10"'
                        }
                    }
                ],
                default : ''
            }

        ];

        this.prompt(prompts, function(props) {
            this.props              = props;
            this.props.bowerConfig  = [];
            this.props.requirejs    = [];
            this.props.gruntfile    = [];

            this.props.libraries.forEach(function(lib){
                this.props.bowerConfig.push(lib.bower);
                this.props.requirejs.push(lib.requirejs);
                this.props.gruntfile.push(lib.gruntfile);
            }.bind(this) );

            this.props.appNameCamelCase = _.camelCase(this.props.appName);
            // To access props later use this.props.someOption;
            done();
        }.bind(this));
    },

    writing : {
        app : function() {
            // this.fs.copy(this.templatePath('_package.json'), this.destinationPath('package.json'));
            this.fs.copyTpl(this.templatePath('_package.json'), this.destinationPath('package.json'), this);
            this.fs.copyTpl(this.templatePath('_bower.json'), this.destinationPath('bower.json'), this);
            this.fs.copy(this.templatePath('_Gruntfile.js'), this.destinationPath('Gruntfile.js'));
            this.fs.copy(this.templatePath('README.md'), this.destinationPath('README.md'));

            this.fs.copy(this.templatePath('app'), this.destinationPath('app'));

            this.fs.copy(this.templatePath('setup'), this.destinationPath('setup'));
            this.fs.copyTpl(this.templatePath('setup/require.config.json'), this.destinationPath('setup/require.config.json'), this);

            this.fs.copy(this.templatePath('test'), this.destinationPath('test'));
        },

        projectfiles : function() {
            this.fs.copy(this.templatePath('editorconfig'), this.destinationPath('.editorconfig'));
            this.fs.copy(this.templatePath('jshintrc'), this.destinationPath('.jshintrc'));
            this.fs.copy(this.templatePath('bowerrc'), this.destinationPath('.bowerrc'));
            this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
        }
    },

    install : function() {
        this.installDependencies();
    }
});

