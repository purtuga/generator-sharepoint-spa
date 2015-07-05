define([], function(){

    var
    /**
     * Apps main module
     * @namespace main
     */
    main = /** @lends main */{
        /**
         * Starts the app.
         * @param {HTMLElement} domAppEle
         */
        start: function(domAppEle){

            var divEle = document.createElement("div");
            divEle.innerHTML = "<h3>App Loaded</h3>";
            domAppEle.appendChild(divEle);

        }
    };

    return main;

});