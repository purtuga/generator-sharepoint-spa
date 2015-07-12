
        var app = requirejs.config(/* BUILD_INCLUDE(""<%= buildTempFolder %>/require.config.json") */);

        app(["scripts/main"], function(main){
            main.start(appCntrEle, overlayEle);
        });
