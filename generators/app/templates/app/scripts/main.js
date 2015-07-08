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
         * @param {HTMLElement} domAppCntr
         */
        start: function(domAppCntr){

            var divEle = document.createElement("div");
            divEle.innerHTML = viewTemplate;
            domAppCntr.appendChild(divEle);

        }
    };

    return main;

});