'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
    prompting : function() {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay('Welcome to the supreme ' + chalk.red('SharepointSpa') + ' generator!'));

        var prompts = [{
            type : 'confirm',
            name : 'someOption',
            message : 'Would you like to enable this option?',
            default : true
        }];

        this.prompt(prompts, function(props) {
            this.props = props;
            // To access props later use this.props.someOption;

            done();
        }.bind(this));
    },

    writing : {
        app : function() {
            this.fs.copy(this.templatePath('_package.json'), this.destinationPath('package.json'));
            this.fs.copy(this.templatePath('_bower.json'), this.destinationPath('bower.json'));
            this.fs.copy(this.templatePath('_Gruntfile.js'), this.destinationPath('Gruntfile.js'));
            this.fs.copy(this.templatePath('app'), this.destinationPath('app'));
            this.fs.copy(this.templatePath('setup'), this.destinationPath('setup'));
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

