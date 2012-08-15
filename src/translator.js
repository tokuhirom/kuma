/*jslint node: true, es5: true */
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
        this.id = 0;
    }
    Translator.prototype.translateArgs = function (args) {
        var src = '';
        for (var i=0, argLen = args.length; i<argLen; i++) {
            src += this._translate(args[i]);
            if (i >= argLen) { src += ","; }
        }
        return src;
    };
    Translator.prototype.getID = function () {
        return this.id++;
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
        case Parser.NODE_UNDEF:
            return "undefined";
        case Parser.NODE_RETURN:
            return "return (" + self._translate(ast[ND_DATAS]) + ")" ;
        case Parser.NODE_BUILTIN_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                return "Kuma.Core." + translator._translate(func) + "(" + translator.translateArgs(args) + ")";
            })();
        case Parser.NODE_LET:
            // TODO: check the variable scope, etc...
            return (function () {
                var func = ast[ND_DATAS];
                console.log(func);
                return "var " + this._translate(func);
            }).call(this);
        case Parser.NODE_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                return translator._translate(func) + "(" + translator.translateArgs(args) + ")";
            })();
        case Parser.NODE_ASSIGN:
            return translator._translate(ast[ND_DATAS][0]) + " = " + this._translate(ast[ND_DATAS][1]);
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
        case Parser.NODE_BLOCK:
            return "{\n" + this._translate(ast[ND_DATAS]) + "}\n";
        case Parser.NODE_MAKE_ARRAY:
            return (function () {
                var ret = "[";
                for (var i=0, len=ast[ND_DATAS].length; i<len; i++) {
                    ret += this._translate(ast[ND_DATAS][i]);
                    if (i!==len-1) {
                        ret += ",";
                    }
                }
                ret += "]\n";
                return ret;
            }).call(this);
        case Parser.NODE_MAKE_HASH:
            return (function () {
                var ret = "{";
                var len = ast[ND_DATAS].length;
                if (len === 0) {
                    ret += ' ';
                } else {
                    for (var i=0; i<len; i+=2) {
                        ret += this._translate(ast[ND_DATAS][i]);
                        ret += ":";
                        ret += this._translate(ast[ND_DATAS][i+1]);
                        if (i!==len-2) {
                            ret += ",";
                        }
                    }
                }
                ret += "}\n";
                return ret;
            }).call(this);
        case Parser.NODE_STMTS:
            return (function () {
                var ret = "{\n";
                for (var i=0, len=ast[ND_DATAS].length; i<len; i++) {
                    console.log(ast[ND_DATAS]);
                    ret += this._translate(ast[ND_DATAS][i]);
                }
                ret += "}\n";
                return ret;
            }).call(this);
        case Parser.NODE_IF:
            return (function () {
                var ret = 'if (' + self._translate(ast[ND_DATAS][0]) + ")\n";
                    ret += self._translate(ast[ND_DATAS][1]);
                if (ast[ND_DATAS][2]) {
                    ret += self._translate(ast[ND_DATAS][2]);
                }
                return ret;
            })();
        case Parser.NODE_ELSIF:
            return (function () {
                var ret = 'else if (' + self._translate(ast[ND_DATAS][0]) + ")\n";
                    ret += self._translate(ast[ND_DATAS][1]);
                if (ast[ND_DATAS][2]) {
                    ret += self._translate(ast[ND_DATAS][2]);
                }
                return ret;
            })();
        case Parser.NODE_ELSE:
            return (function () {
                var ret = 'else {';
                    ret += self._translate(ast[ND_DATAS]);
                ret += "}\n";
                return ret;
            })();
        case Parser.NODE_FOREACH:
            // [expression, vars, block]
            return (function () {
                // i=0
                var i = ast[ND_DATAS][1] ? this._translate(ast[ND_DATAS][1][0]) : '$_';
                // for (i=0, len=exp.length; i<len; ++i) { }
                var containerVar = 'K$$container' + this.getID();
                var lenVar = 'K$$len' + this.getID();
                var ret = 'var ' + containerVar + ' = ' + this._translate(ast[ND_DATAS][0]) + ";\n";
                ret += 'for (var ' + i + '=0, ' + lenVar + '=' + containerVar + '.length; ' + i + '<' + lenVar + '; ++' + i + ')';
                ret += this._translate(ast[ND_DATAS][2]);
                return ret;
            }).call(this);
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
        case Parser.NODE_EQ:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")===(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_NE:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")!==(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_DOTDOTDOT:
            return 'throw "Unimplemented";';
        case Parser.NODE_SUB:
            return (function () {
                // [name, params, block]
                // name can be null
                // params can be null
                var ret  = 'function ';
                if (ast[ND_DATAS][0]) {
                    ret += this._translate(ast[ND_DATAS][0]);
                }
                    ret += '(';
                if (ast[ND_DATAS][1]) {
                    for (var i=0, len=ast[ND_DATAS][1].length; i<len; i++) {
                        ret += this._translate(ast[ND_DATAS][1][i]);
                    }
                }
                    ret += ')';
                    ret += this._translate(ast[ND_DATAS][2]);
                return ret;
            }).call(this);
        case Parser.NODE_MUL_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " *= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_PLUS_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " += " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_MINUS_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " -= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_DIV_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " /= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_MOD_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " %= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_LSHIFT_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " <<= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_RSHIFT_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " >>= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_AND_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " &= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_OR_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " |= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_XOR_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " ^= " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_STRING:
            return "'" + ast[ND_DATAS] + "'";
        case Parser.NODE_METHOD_CALL:
            return (function () {
                var ret = "(" + this._translate(ast[ND_DATAS][0]) + ")." + this._translate(ast[ND_DATAS][1]) + "(";
                for (var i=0, len=ast[ND_DATAS][2].length; i<len; i++) {
                    ret += this._translate(ast[ND_DATAS][2][i]);
                    if (i!==len-1) {
                        ret += ",";
                    }
                }
                ret += ')';
                return ret;
            }).call(this);
        case Parser.NODE_GET_METHOD:
            return "(" + this._translate(ast[ND_DATAS][0]) + ")." + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_POW:
            return 'Math.pow(('+translator._translate(ast[ND_DATAS][0]) + "), (" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_PRE_INC:
            return '++(' + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_POST_INC:
            return '(' + this._translate(ast[ND_DATAS]) + ")++";
        case Parser.NODE_LAMBDA:
            return (function () {
                // TODO: support $a,$b
                // [params, body]
                var ret = "(function (";
                if (ast[ND_DATAS][0]) {
                    for (var i=0, len=ast[ND_DATAS][0].length; i<len; i++) {
                        ret += this._translate(ast[ND_DATAS][0][i]);
                        if (i!==len-1) {
                            ret += ",";
                        }
                    }
                } else {
                    ret += '$_';
                }
                ret += ") " + this._translate(ast[ND_DATAS][1]) + ")\n";
                return ret;
            }).call(this);
        case Parser.NODE_RANGE:
            return (function () {
                var ret = '(function () { var K$$results = []; for (var K$$i=(' + this._translate(ast[ND_DATAS][0]) + '); K$$i<=(' + this._translate(ast[ND_DATAS][1]) + '); ++K$$i) { K$$results.push(K$$i); } return K$$results; }).apply(this)';
                return ret;
            }).apply(this);
        case Parser.NODE_WHILE:
            return (function () {
                var ret = 'while (';
                    ret += this._translate(ast[ND_DATAS][0]);
                    ret += ')';
                    ret += this._translate(ast[ND_DATAS][1]);
                return ret;
            }).call(this);
        default:
            console.log("Unknown ast node: " + ast[ND_TYPE]); // debug
            throw "Unknown ast node: " + ast[ND_TYPE];
        }
    };

    global.Kuma.Translator = Translator;
})(this.exports || this);
