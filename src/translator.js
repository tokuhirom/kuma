(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {}; }
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
            src += this._translate(args[i]);
            if (i >= argLen) { src += ","; }
        }
        return src;
    };
    Translator.prototype.translate = function (ast) {
        return '"use strict";' + "\n" + this._translate(ast);
    };
    Translator.prototype._translate = function (ast) {
        var translator = this;
        var self = this;
        switch (ast[ND_TYPE]) {
        case Parser.NODE_STMTS:
            return (function () {
                var ret= [];
                for (var i=0, len=ast[ND_DATAS].length; i<len; i++) {
                    ret.push(self._translate(ast[ND_DATAS][i]));
                }
                return ret.join(";\n");
            })();
        case Parser.NODE_BUILTIN_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                return "Kuma.Core." + translator._translate(func) + "(" + translator.translateArgs(args) + ")";
            })();
        case Parser.NODE_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                return translator._translate(func) + "(" + translator.translateArgs(args) + ")";
            })();
        case Parser.NODE_UNARY_NOT:
            return "!(" + translator._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_UNARY_TILDE:
            return "~(" + translator._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_UNARY_PLUS:
            return "+(" + translator._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_UNARY_MINUS:
            return "-(" + translator._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_INTEGER:
            return ast[ND_DATAS];
        case Parser.NODE_TRUE:
            return "true";
        case Parser.NODE_FALSE:
            return "false";
        case Parser.NODE_IDENT:
            return ast[ND_DATAS];
        case Parser.NODE_LT:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")<(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_LE:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")<=(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_GT:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")>(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_GE:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")>=(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_LSHIFT:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")<<(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_RSHIFT:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")>>(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_ADD:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")+(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_SUBTRACT:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")-(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_MUL:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")*(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_DIV:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")/(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_MOD:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")%(" + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_STRING:
            return "'" + ast[ND_DATAS] + "'";
        case Parser.NODE_POW:
            return 'Math.pow(('+translator._translate(ast[ND_DATAS][0]) + "), (" + this._translate(ast[ND_DATAS][1]) + "))";
        default:
            console.log("Unknown ast node: " + ast[ND_TYPE]); // debug
            throw "Unknown ast node: " + ast[ND_TYPE];
        }
    };

    global.Kuma.Translator = Translator;
})(this.exports || this);
