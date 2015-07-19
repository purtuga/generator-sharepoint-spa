# generator-sharepoint-spa [![Build Status](https://secure.travis-ci.org/purtuga/generator-sharepoint-spa.png?branch=master)](https://travis-ci.org/purtuga/generator-sharepoint-spa)

A [Yeoman](http://yeoman.io) generator for creating and distributing SharePoint Single Page Applications without the need for the App/Add-In model.  This generator will setup a project with functional boilerplate to generate an Web App that is structured using Asynchronous Module Definition (AMD) and, through the use of a Grunt build process, generates a single delivery file (`aspx`) containing the entire app.

The boilerplate also includes the use of following:

-   requireJS
-   requireJS Text plugin
-   requireJS Less plugin

Optionally, the following libraries can also be included:

-   [SPWidgets](http://purtuga.github.io/SPWidgets/)
-   [SPServices](https://github.com/sympmarc/SPServices)


# Usage


To install generator-sharepoint-spa from npm, run:

```bash
npm install -g generator-sharepoint-spa
```

Finally, initiate the generator:

```bash
yo sharepoint spa
```


## License

MIT
