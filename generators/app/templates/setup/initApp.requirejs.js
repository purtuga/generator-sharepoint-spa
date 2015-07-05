
        var app = requirejs.config(/* BUILD_INCLUDE("setup/require.config.json") */);

        app(["scripts/main"], function(main){
            main.start(appCntrEle);
        });
