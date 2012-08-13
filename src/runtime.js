(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {} }

    global.Kuma.Core = {
        say: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        }
    };

})(this.exports || this);