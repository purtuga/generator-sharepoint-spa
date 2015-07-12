
        var
        app,
        requirejsConfig = /* BUILD_INCLUDE("setup/require.config.json") */;

        requirejsConfig.urlArgs = buildNumber;
        app                     = requirejs.config(requirejsConfig);

        app(["scripts/main"], function(main){
            main.start(appCntrEle, overlayEle);
        });
