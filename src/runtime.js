/*jslint node: true, es5: true */
(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {}; }

    if (!Array.prototype.grep) {
        Array.prototype.grep = function (callback) {
            var ret = [];
            for (var i=0, len = this.length; i<len; i++) {
                if (callback(this[i])) {
                    ret.push(this[i]);
                }
            }
            return ret;
        };
    }
    if (!Array.prototype.sum) {
        Array.prototype.sum = function () {
            var ret = 0;
            var container = this;
            for (var i=0, len = this.length; i<len; i++) {
                ret += this[i];
            }
            return ret;
        };
    }

    global.Kuma.Core = {
        say: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        },
        p: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        },
        exit: function (status) {
            // http://nodejs.org/api/process.html#process_process_exit_code
            process.exit(status);
        }
    };

})(this.exports || this);
