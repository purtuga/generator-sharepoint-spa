define([
    "less!../styles/common"
], function(){

    var
    /**
     * Apps main module
     * @namespace main
     */
    main = /** @lends main */{
        /**
         * Starts the app.
         * @param {HTMLElement} domAppCntr
         */
        start: function(domAppCntr){

            var divEle = document.createElement("div");
            divEle.innerHTML = "<h3>App main.js Loaded</h3>";
            domAppCntr.appendChild(divEle);

        }
    };

    return main;

});