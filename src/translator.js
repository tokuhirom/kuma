(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {} }
    if (!global.Kuma.Parser) {
        global.Kuma.Parser = require('./parser.js').Kuma.Parser;
    }

    var Parser = global.Kuma.Parser;

    // index for ast node
    var ND_TYPE   = 0;
    var ND_LINENO = 1;
    var ND_DATAS  = 2;

    function Translator() {
    }
    Translator.prototype.translateArgs = function (args) {
        var src = '';
        for (var i=0, argLen = args.length; i<argLen; i++) {
            src += this.translate(args[i]);
            if (i >= argLen) { src += ","; }
        }
        return src;
    };
    Translator.prototype.translate = function (ast) {
        var translator = this;
        switch (ast[ND_TYPE]) {
        case Parser.NODE_BUILTIN_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                return "Kuma.Core." + translator.translate(func) + "(" + translator.translateArgs(args) + ")";
            })();
        case Parser.NODE_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                return translator.translate(func) + "(" + translator.translateArgs(args) + ")";
            })();
        case Parser.NODE_NUMBER:
            return ast[ND_DATAS];
        case Parser.NODE_IDENT:
            return ast[ND_DATAS];
        default:
            console.log("Unknown ast node: " + ast[ND_TYPE]); // debug
            throw "Unknown ast node: " + ast[ND_TYPE];
        }
    };

    global.Kuma.Translator = Translator;
})(this.exports || this);
