define([
    "text!./main.html",
    // -modules not needing a reference----------
    "less!../styles/common"
], function(
    viewTemplate
){

    var
    /**
     * Apps main module
     * @namespace main
     */
    main = /** @lends main */{
        /**
         * Starts the app.
         * @param {HTMLElement} appCntrEle
         *      The HTMl element where the app should live
         *
         * @param {HTMLElement} overlayEle
         *      The overlay (ui blocker) for the app.
         */
        start: function(appCntrEle, overlayEle){

            var divEle = document.createElement("div");
            divEle.innerHTML = viewTemplate;
            appCntrEle.appendChild(divEle);

            // hide the overlay
            overlayEle.style.display = "none";

        }
    };

    return main;

});