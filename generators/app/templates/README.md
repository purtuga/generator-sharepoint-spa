SharePoint SPA
----------------

This app was generated using [Yeoman](http://yeoman.io) and [SharePoint-SPA generator](https://github.com/purtuga/generator-sharepoint-spa) and provides the scafolding needed to create browser based applications for SharePoint.

The project is setup to use AMD by including RequireJS, along with the Text plugin and the Less plugin. The Grunt build process includes a Task to build a single-file SPA where all modules are included into a single file.



Build
=====

The build is handled by Grunt.  Run `grunt --help` to see the available tasks. By default, the build will create a folder named `build` at the root of the project that is used as a staging area.  All files located under `app` is copied to the `build` folder and process so that they can be served from a SharePoint location (ex. the `app.aspx` file will include the appropriate loading code).

### Add Files to your Project

By default, the task `copy:build` will only copy the following:
```
app/*.aspx
app/script/**/*
app/styles/**/*
vendor/requirejs/requirejs.js
vendor/requirejs-text/text.js
vendor/require-less/*.js

```
If any new folder is created in `app/`, or if any new files/module are added to `app/vendor/`, the `copy:build` task in the `Gruntfile.js` must be edited so that those files can be included in the build.


### Compile app to Single File

The `grunt spa` task will use requireJS compiler (`r.js`) to package the entire application code into 1 single file that can be used instead of the regular app files. This file will be found under the build folder and named `app.run.aspx`.

Note however that as other 3rd party libraries are added to the project, the `Gruntfile` `requirejs:compile` task may need additional setup. Ex. If loading `jQuery` or `knockout` from a CDN, entries will need to be added so that these modules are not included in the build.


