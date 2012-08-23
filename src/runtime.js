/*jslint node: true, es5: true */
(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {}; }

    var sprintf = require('sprintf').sprintf;
    var sys = require('sys');

    if (!Array.prototype.grep) {
        Object.defineProperty(Array.prototype, 'grep', {
            enumerable: false,
            value: function (callback) {
                var ret = [];
                for (var i=0, len = this.length; i<len; i++) {
                    if (callback(this[i])) {
                        ret.push(this[i]);
                    }
                }
                return ret;
            }
        });
    }
    if (!Array.prototype.each) {
        Object.defineProperty(Array.prototype, 'each', {
            enumerable: false,
            value: Array.prototype.forEach
        });
    }
    if (!Array.prototype.sum) {
        Object.defineProperty(Array.prototype, 'sum', {
            enumerable: false,
            value: function () {
                var ret = 0;
                var container = this;
                for (var i=0, len = this.length; i<len; i++) {
                    ret += this[i];
                }
                return ret;
            }
        });
    }
    if (!Object.prototype.reverse) {
        Object.defineProperty(Object.prototype, 'reverse', {
            enumerable: false,
            value: function () {
                var ret = {};
                for (var k in this) {
                    if (this.hasOwnProperty(k)) {
                        ret[this[k]] = k;
                    }
                }
                return ret;
            }
        });
    }

    var glob_cache;
    var fs_cache;
    var system3_cache;
    global.Kuma.Core = {
        say: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        },
        glob: function (pattern) {
            if (!glob_cache) { // lazy loading
                glob_cache = require('glob');
            }
            return glob_cache.sync(pattern);
        },
        p: function () {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        },
        getpid: function () {
            return process.pid;
        },
        sprintf: function () {
            return sprintf.apply(this, Array.prototype.slice.call(arguments));
        },
        printf: function () {
            sys.print(sprintf.apply(this, Array.prototype.slice.call(arguments)));
        },
        print: function () {
            sys.print.apply(this, Array.prototype.slice.call(arguments));
        },
        int: function (s) {
            return parseInt(s, 10);
        },
        oct: function (s) {
            return parseInt(s, 8);
        },
        _qx: function (cmd) {
            if (!system3_cache) { system3_cache = require('system3'); }
            return system3_cache.qx(cmd);
        },
        system: function (cmd) {
            if (!system3_cache) { system3_cache = require('system3'); }
            return system3_cache.system(cmd);
        },
        fileTest: function (type, path) {
            if (!fs_cache) { fs_cache = require('fs'); }
            var stat;
            try {
                stat = fs_cache.lstatSync(path);
            } catch (e) { }
            switch (type) {
            case 'f':
                return stat && stat.isFile();
            case 'd':
                return stat && stat.isDirectory();
            case 'e':
                return !!stat;
            default:
                throw "Unknown file test type: " + type;
            }
            return stat;
        },
        exit: function (status) {
            // http://nodejs.org/api/process.html#process_process_exit_code
            process.exit(status);
       }
    };

})(this.exports || this);
