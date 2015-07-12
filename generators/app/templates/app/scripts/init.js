/**
 * This APP loader and initializer is meant to be embedded directly into an HTML/ASPX
 * file, in the exact location where the functionality should be displayed. It will
 * create a <div> element that will then be used as app's container.
 */
(function(window, document){
    /* global _spBodyOnLoadFunctionNames, ExecuteOrDelayUntilScriptLoaded */

    // Create the app container
    var
    uid         = "app_" + (Math.random() * 1e9 >>> 0),
    buildNumber = "@BUILD";

    document.write('<div id="' + uid + '"></div>');                     // jshint ignore:line

    var appMain;                                                        // jshint ignore:line

// BUILD_INCLUDE("<%= buildTempFolder %>/app.code.js")

    var
    overlayEle = document.createElement("div"),

    isInitDone = false,

    // App initializer... executes only once.
    initApp = function(){
        if (isInitDone) {return;}
        isInitDone = true;
        var appCntrEle = document.body.querySelector("#" + uid);        // jshint ignore:line

        // BUILD_INCLUDE("<%= buildTempFolder %>/appInit.js")

    },

    hasSpOnBodyLoad = (typeof _spBodyOnLoadFunctionNames !== "undefined"),

    hasExecuteOrDelayUntilScriptLoaded = (typeof ExecuteOrDelayUntilScriptLoaded !== "undefined");

    // Display overlay on page
    overlayEle.className = uid + "-page-overlay";
    overlayEle.setAttribute(
        "style",
        'height: 100%;left: 0;position: ' +
        'absolute;top: 0;width: 100%; background-color:rgb(170, 170, 170);' +
        'opacity: 0.3;filter:Alpha(Opacity=30);z-index:9999;'
    );
    overlayEle.innerHTML = '<div style="position: absolute; font-weight: bold; ' +
        'color: gray; background-image: ' +
        'url(\'/_layouts/images/hig_progcircle_loading24.gif\'); ' +
        'top: 15%; right: 0%; font-size: 4em; background-repeat: ' +
        'no-repeat; background-position: left center; padding-left: ' +
        '45px; letter-spacing: 0.3em;" >Loading...</div>';
    document.body.appendChild(overlayEle);

    // If _spBodyOnLoadFunctionNames (SP2010, 2013) is defined,
    // then add our initializer to it.
    if (hasSpOnBodyLoad) {
        var globalFnName = uid + "_loader";
        window[globalFnName] = function() {
            initApp();
            window[globalFnName]= null;
        };
        _spBodyOnLoadFunctionNames.push(globalFnName);
    }

    if (hasExecuteOrDelayUntilScriptLoaded) {
        ExecuteOrDelayUntilScriptLoaded(initApp, "sp.js"); // jshint ignore:line
    }

    // If we don't seem to have any sharepoint loader, then init app now
    if (!hasSpOnBodyLoad && !hasExecuteOrDelayUntilScriptLoaded) {
        initApp();

    // FAIL SAFE: make sure we execute within 3 seconds
    } else {
        setTimeout(initApp, 3000);
    }

}(window, document));
