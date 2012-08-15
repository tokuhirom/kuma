/*jslint node: true, es5: true */
(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {}; }

    global.Kuma.Core = {
        say: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        },
        p: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        }
    };

})(this.exports || this);
