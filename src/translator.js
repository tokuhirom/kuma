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

    function getNodeNameByType(type) {
        return Parser.id2name[''+type];
    }

    function Translator() {
        this.id = 0;
        this.requireIsArray = false;
        this.requireExtend = false;
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
        var header = '"use strict";';
        var body = this._translate(ast);
        if (this.requireIsArray) {
            header += 'var KF$$ArrayisArray = Array.isArray || function (vArg) { return Object.prototype.toString.call(vArg) === "[object Array]" };';
        }
        if (this.requireExtend) {
            header += 'var KF$$hasProp = {}.hasOwnProperty;';
            header += 'var KF$$extends = function(child, parent) { for (var key in parent) { if (KF$$hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };';
        }
        return header + "\n(function () {\n" + this._translate(this._injectReturn(ast)) + "\n})()";
    };
    Translator.prototype._injectReturn = function (ast, option) {
        switch (ast[ND_TYPE]) {
        case Parser.NODE_BLOCK:
            ast[ND_DATAS] = this._injectReturn(ast[ND_DATAS]);
            return ast;
        case Parser.NODE_STMTS:
            if (ast[ND_DATAS].length > 0) {
                var lastNode = ast[ND_DATAS][ast[ND_DATAS].length-1];
                ast[ND_DATAS][ast[ND_DATAS].length-1] = this._injectReturn(
                    ast[ND_DATAS][ast[ND_DATAS].length-1]
                );
            }
            return ast;
        case Parser.NODE_INTEGER:
        case Parser.NODE_IDENT:
        case Parser.NODE_BUILTIN_FUNCALL:
        case Parser.NODE_STRING:
        case Parser.NODE_PRE_INC:
        case Parser.NODE_POST_INC:
        case Parser.NODE_PRE_DEC:
        case Parser.NODE_POST_DEC:
        case Parser.NODE_POW:
        case Parser.NODE_UNARY_NOT:
        case Parser.NODE_UNARY_TILDE:
        case Parser.NODE_UNARY_REF:
        case Parser.NODE_UNARY_PLUS:
        case Parser.NODE_UNARY_MINUS:
        case Parser.NODE_UNARY_MUL:
        case Parser.NODE_FUNCALL:
        case Parser.NODE_TRUE:
        case Parser.NODE_FALSE:
        case Parser.NODE_MUL:
        case Parser.NODE_DIV:
        case Parser.NODE_MOD:
        case Parser.NODE_ADD:
        case Parser.NODE_SUBTRACT:
        case Parser.NODE_LSHIFT:
        case Parser.NODE_RSHIFT:
        case Parser.NODE_GT:
        case Parser.NODE_GE:
        case Parser.NODE_LT:
        case Parser.NODE_LE:
        case Parser.NODE_EQ:
        case Parser.NODE_NE:
        case Parser.NODE_CMP:
        case Parser.NODE_RANGE:
        case Parser.NODE_LOGICAL_OR:
        case Parser.NODE_LOGICAL_AND:
        case Parser.NODE_BITOR:
        case Parser.NODE_BITXOR:
        case Parser.NODE_BITAND:
        case Parser.NODE_THREE:
        case Parser.NODE_COMMA:
        case Parser.NODE_UNARY_NOT:
        case Parser.NODE_LOGICAL_XOR:
        case Parser.NODE_NOP:
        case Parser.NODE_BLOCK:
        case Parser.NODE_UNDEF:
        case Parser.NODE_MUL_ASSIGN:
        case Parser.NODE_PLUS_ASSIGN:
        case Parser.NODE_DIV_ASSIGN:
        case Parser.NODE_MOD_ASSIGN:
        case Parser.NODE_MINUS_ASSIGN:
        case Parser.NODE_LSHIFT_ASSIGN:
        case Parser.NODE_RSHIFT_ASSIGN:
        case Parser.NODE_POW_ASSIGN:
        case Parser.NODE_AND_ASSIGN:
        case Parser.NODE_OR_ASSIGN:
        case Parser.NODE_XOR_ASSIGN:
        case Parser.NODE_OROR_ASSIGN:
        case Parser.NODE_MAKE_ARRAY:
        case Parser.NODE_MAKE_HASH:
        case Parser.NODE_REGEXP_MATCH:
        case Parser.NODE_REGEXP_NOT_MATCH:
        case Parser.NODE_DO:
        case Parser.NODE_SELF:
        case Parser.NODE_REGEXP:
        case Parser.NODE_NEW:
        case Parser.NODE_LAMBDA:
        case Parser.NODE_ITEM:
        case Parser.NODE_METHOD_CALL:
        case Parser.NODE_FILETEST:
        case Parser.NODE_QX:
            return this.makeReturnNode(ast);
            // is not returnable
        case Parser.NODE_RETURN:
        case Parser.NODE_WHILE:
        case Parser.NODE_CLASS:
        case Parser.NODE_LABELED:
        case Parser.NODE_DIE:
        case Parser.NODE_USE:
        case Parser.NODE_FOREACH:
        case Parser.NODE_FOR:
        case Parser.NODE_DOTDOTDOT:
        case Parser.NODE_LAST:
        case Parser.NODE_NEXT:
        case Parser.NODE_SUB:
        case Parser.NODE_TRY:
        case Parser.NODE_THROW:
        case Parser.NODE_MY:
            return ast;
            // can be return?
        case Parser.NODE_IF:
            ast[ND_DATAS][1] = this._injectReturn(ast[ND_DATAS][1]);
            if (ast[ND_DATAS][2]) {
                ast[ND_DATAS][2] = this._injectReturn(ast[ND_DATAS][2]);
            }
            return ast;
        case Parser.NODE_ELSIF:
            ast[ND_DATAS][1] = this._injectReturn(ast[ND_DATAS][1]);
            if (ast[ND_DATAS][2]) {
                ast[ND_DATAS][2] = this._injectReturn(ast[ND_DATAS][2]);
            }
            return ast;
        case Parser.NODE_ELSE:
            return this._injectReturn(ast[ND_DATAS]);
        case Parser.NODE_GET_METHOD:
        case Parser.NODE_STATIC:
        case Parser.NODE_ASSIGN: // XXX This should be returnable, but it's not accepted by JS syntax..
            return ast;
        default:
            throw "[BUG] Unknown node";
        }
    };
    Translator.prototype.makeReturnNode = function (ast) {
        return [
            Parser.NODE_RETURN,
            ast[ND_LINENO],
            ast
        ];
    };
    Translator.prototype._translate = function (ast, option) {
        if (!ast) { console.trace("missing argument"); }
        if (!option) { option = { }; }

        switch (ast[ND_TYPE]) {
        case Parser.NODE_STMTS:
            return (function () {
                var ret= [];
                for (var i=0, len=ast[ND_DATAS].length; i<len; i++) {
                    ret.push(this._translate(ast[ND_DATAS][i]));
                }
                return ret.join(";\n");
            }).call(this);
        case Parser.NODE_NOP:
            return '';
        case Parser.NODE_UNDEF:
            return "undefined";
        case Parser.NODE_LAST:
            return (function () {
                if (ast[ND_DATAS]) {
                    return 'break ' + this._translate(ast[ND_DATAS]);
                } else {
                    return "break";
                }
            }).call(this);
        case Parser.NODE_DIE:
            return (function () {
                if (ast[ND_DATAS]) {
                    return 'throw ' + this._translate(ast[ND_DATAS]);
                } else {
                    return "throw 'Died'";
                }
            }).call(this);
        case Parser.NODE_NEXT:
            return (function () {
                if (ast[ND_DATAS]) {
                    return 'continue ' + this._translate(ast[ND_DATAS]);
                } else {
                    return "continue";
                }
            }).call(this);
        case Parser.NODE_RETURN:
            return "return (" + this._translate(ast[ND_DATAS]) + ")" ;
        case Parser.NODE_ITEM:
            return this._translate(ast[ND_DATAS][0]) + '[' + this._translate(ast[ND_DATAS][1]) + ']';
        case Parser.NODE_BUILTIN_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                var ret = 'Kuma.Core.' + this._translate(ast[ND_DATAS][0]) + '(';
                for (var i=0, len=args.length; i<len; ++i) {
                    ret += this._translate(args[i]);
                    if (i!==len-1) {
                        ret += ', ';
                    }
                }
                ret += ')';
                return ret;
            }).call(this);
        case Parser.NODE_MY:
            // TODO: check the variable scope, etc...
            return (function () {
                var func = ast[ND_DATAS];
                return "var " + this._translate(func);
            }).call(this);
        case Parser.NODE_FUNCALL:
            return (function () {
                var func = ast[ND_DATAS][0];
                var args = ast[ND_DATAS][1];
                var ret = this._translate(ast[ND_DATAS][0]) + '(';
                for (var i=0, len=args.length; i<len; ++i) {
                    ret += this._translate(args[i]);
                    if (i!==len-1) {
                        ret += ', ';
                    }
                }
                ret += ')';
                return ret;
            }).call(this);
        case Parser.NODE_ASSIGN:
            return this._translate(ast[ND_DATAS][0]) + " = " + this._translate(ast[ND_DATAS][1]);
        case Parser.NODE_CMP:
            // a <=> b
            return '(function (a, b) { return a == b ? 0 : a < b ? -1 : 1; })(' + this._translate(ast[ND_DATAS][0]) + ", " + this._translate(ast[ND_DATAS][1]) + ")";
        case Parser.NODE_UNARY_NOT:
            return "!(" + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_UNARY_TILDE:
            return "~(" + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_UNARY_PLUS:
            return "+(" + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_UNARY_MINUS:
            return "-(" + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_INTEGER:
            return ast[ND_DATAS];
        case Parser.NODE_DOUBLE:
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
                    ret += this._translate(ast[ND_DATAS][i]);
                }
                ret += "}\n";
                return ret;
            }).call(this);
        case Parser.NODE_IF:
            return (function () {
                var ret = 'if (' + this._translate(ast[ND_DATAS][0]) + ")\n";
                    ret += this._translate(ast[ND_DATAS][1]);
                if (ast[ND_DATAS][2]) {
                    ret += this._translate(ast[ND_DATAS][2]);
                }
                return ret;
            }).call(this);
        case Parser.NODE_ELSIF:
            return (function () {
                var ret = 'else if (' + this._translate(ast[ND_DATAS][0]) + ")\n";
                    ret += this._translate(ast[ND_DATAS][1]);
                if (ast[ND_DATAS][2]) {
                    ret += this._translate(ast[ND_DATAS][2]);
                }
                return ret;
            }).call(this);
        case Parser.NODE_ELSE:
            return (function () {
                var ret = 'else {';
                    ret += this._translate(ast[ND_DATAS]);
                ret += "}\n";
                return ret;
            }).call(this);
        case Parser.NODE_CLASS:
            // [name, parent, block]
            return (function () {
                var className = this._translate(ast[ND_DATAS][0]);
                var parent;
                if (ast[ND_DATAS][1]) {
                    parent = this._translate(ast[ND_DATAS][1]);
                    this.requireExtend = true;
                }

                var ret  = 'var ' + className + ' = (function (_super) {';
                    if (parent) {
                    ret += "    KF$$extends(" + className + ', _super);';
                    }
                    ret += "    function " + className + "() {";
                    if (parent) {
                    ret += "        " + className + ".__super__.constructor.apply(this, arguments);\n";
                    }
                    ret += "        if (this.initialize) {\n";
                    ret += "            this.initialize.apply(this, arguments);\n";
                    ret += "        }";
                    ret += "    };";
                    ret += "    return " + className + ";";
                    ret += "})(";
                    if (parent) {
                        ret += parent;
                    }
                    // Foo.__super__.constructor.apply(this, arguments);
                    // TODO: ctor
                    ret += ");\n";

                // set up methods
                var origClassName = this.className;
                try {
                    this.className = className;
                    ret += this._translate(ast[ND_DATAS][2][ND_DATAS]);
                } finally {
                    this.className = origClassName;
                }
                return ret;
            }).call(this);
        case Parser.NODE_FOREACH:
            // [expression, vars, block]
            return (function () {
                this.requireIsArray = true;

                // i=0
                var var1 = ast[ND_DATAS][1] ? this._translate(ast[ND_DATAS][1][0]) : '$_';
                var i = ast[ND_DATAS][1] && ast[ND_DATAS][1].length > 1 ? this._translate(ast[ND_DATAS][1][1]) : 'K$$i' + this.getID();
                // for (i=0, len=exp.length; i<len; ++i) { }
                var containerVar = 'K$$container' + this.getID();
                var lenVar = 'K$$len' + this.getID();
                var ret = 'var ' + containerVar + ' = ' + this._translate(ast[ND_DATAS][0]) + ";\n";
                ret += 'if (KF$$ArrayisArray(' + containerVar + ')) {\n';
                if (option.label) {
                    ret += '  ' + option.label + ':\n';
                }
                ret += '  for (var ' + i + '=0, ' + lenVar + '=' + containerVar + '.length; ' + i + '<' + lenVar + '; ++' + i + ') {';
                ret += '    ' + var1 + ' = ' + containerVar + '[' + i + '];';
                ret += this._translate(ast[ND_DATAS][2]);
                ret += '  } /* end-for */\n';
                ret += '} else {\n';
                if (option.label) {
                    ret += '  ' + option.label + ':\n';
                }
                ret += '  for (var ' + var1 + ' in ' + containerVar + ') { if (!' + containerVar + '.hasOwnProperty(' + var1 + ')) { continue; }';
                if (ast[ND_DATAS][1] && ast[ND_DATAS][1].length > 1) {
                var valueVar = this._translate(ast[ND_DATAS][1][1]);
                ret += '  var ' + valueVar + " = " + containerVar + "[" + var1 + "];";
                }
                ret += this._translate(ast[ND_DATAS][2]);
                ret += '}';
                ret += '}';
                return ret;
            }).call(this);
        case Parser.NODE_IDENT:
            return (function () {
                var ident = ast[ND_DATAS];
                var m = ident.match(/^\$([1-9])$/);
                if (m) { // magical variable
                    return "Kuma.Core._regexpLastMatch(" + m[1] + ")";
                } else {
                    return ident;
                }
            }).call(this);
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
        case Parser.NODE_LOGICAL_AND:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")&&(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_LOGICAL_OR:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")||(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_BITXOR:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")^(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_BITAND:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")&(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_BITOR:
            return "((" + this._translate(ast[ND_DATAS][0]) + ")|(" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_REGEXP:
            // TODO: escape requireeeeeeeeeeeed?
            return (function () {
                var ret = '/' + ast[ND_DATAS][0] + '/';
                if (ast[ND_DATAS][1]) {
                    ret += ast[ND_DATAS][1];
                }
                return ret;
            }).call(this);
        case Parser.NODE_REGEXP_MATCH:
            return "(Kuma.Runtime.match((" + this._translate(ast[ND_DATAS][0]) + "),(" + this._translate(ast[ND_DATAS][1]) + ")))";
        case Parser.NODE_REGEXP_NOT_MATCH:
            return "(!((" + this._translate(ast[ND_DATAS][0]) + ").match(" + this._translate(ast[ND_DATAS][1]) + ")))";
        case Parser.NODE_DOTDOTDOT:
            return 'throw "Unimplemented";';
        case Parser.NODE_STATIC:
            return this._translate(ast[ND_DATAS][0], {static: true});
        case Parser.NODE_SUB:
            return (function () {
                // [name, params, block]
                // name can be null
                // params can be null
                var ret = '';
                if (this.className) {
                    if (!ast[ND_DATAS][0]) {
                        throw "[Translation Error] function name is required for instance method at line " + ast[ND_LINENO];
                    }
                    if (option.static) {
                        ret += this.className + '.' +  this._translate(ast[ND_DATAS][0]) + ' = function ';
                    } else {
                        ret += this.className + '.prototype.' +  this._translate(ast[ND_DATAS][0]) + ' = function ';
                    }
                } else {
                    ret += 'function ';
                    if (ast[ND_DATAS][0]) {
                        ret += this._translate(ast[ND_DATAS][0]);
                    }
                }
                    ret += '(';
                if (ast[ND_DATAS][1]) { // arguments
                    for (var i=0, len=ast[ND_DATAS][1].length; i<len; i++) {
                        ret += this._translate(ast[ND_DATAS][1][i][0]);
                        if (i!==len-1) {
                            ret += ', ';
                        }
                    }
                }
                    ret += ') { var KV$$self = this;';
                if (ast[ND_DATAS][1]) { // arguments
                    for (var i=0, len=ast[ND_DATAS][1].length; i<len; i++) {
                        if (ast[ND_DATAS][1][i][1]) {
                            ret += 'if (arguments.length<=' + i + ') {\n';
                            ret += this._translate(ast[ND_DATAS][1][i][0]);
                            ret += '=(';
                            ret += this._translate(ast[ND_DATAS][1][i][1]);
                            ret += ');\n}\n';
                        }
                    }
                }
                    ret += this._translate(this._injectReturn(ast[ND_DATAS][2]));
                    ret += '}\n';
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
            // TODO: better escape?
            return (function () {
                return ast[ND_DATAS].split(/\n/).map(function (line) {
                    return "'" + line + "'";
                }).join(' + "\\n" +');
            }).call(this);
        case Parser.NODE_THREE:
            return '(' + this._translate(ast[ND_DATAS][0]) + ")?(" + this._translate(ast[ND_DATAS][1]) + '):(' + this._translate(ast[ND_DATAS][2]) + ')';
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
            return 'Math.pow(('+this._translate(ast[ND_DATAS][0]) + "), (" + this._translate(ast[ND_DATAS][1]) + "))";
        case Parser.NODE_PRE_INC:
            return '++(' + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_POST_INC:
            return '(' + this._translate(ast[ND_DATAS]) + ")++";
        case Parser.NODE_PRE_DEC:
            return '--(' + this._translate(ast[ND_DATAS]) + ")";
        case Parser.NODE_POST_DEC:
            return '(' + this._translate(ast[ND_DATAS]) + ")--";
        case Parser.NODE_NEW:
            // expression
            return 'new ' + this._translate(ast[ND_DATAS]);
        case Parser.NODE_FOR:
            // [e1, e2, e3, body]
            return (function () {
                var ret = '';
                if (option.label) {
                    ret += option.label + ":";
                }
                ret += 'for (';
                if (ast[ND_DATAS][0]) {
                    ret += this._translate(ast[ND_DATAS][0]);
                }
                ret += ';';
                if (ast[ND_DATAS][1]) {
                    ret += this._translate(ast[ND_DATAS][1]);
                }
                ret += ';';
                if (ast[ND_DATAS][2]) {
                    ret += this._translate(ast[ND_DATAS][2]);
                }
                ret += ')';
                ret += this._translate(ast[ND_DATAS][3]);
                return ret;
            }).call(this);
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
                ret += ") " + this._translate(this._injectReturn(ast[ND_DATAS][1])) + ")\n";
                return ret;
            }).call(this);
        case Parser.NODE_RANGE:
            return (function () {
                var ret = '(function () { var K$$results = []; for (var K$$i=(' + this._translate(ast[ND_DATAS][0]) + '); K$$i<=(' + this._translate(ast[ND_DATAS][1]) + '); ++K$$i) { K$$results.push(K$$i); } return K$$results; }).apply(this)';
                return ret;
            }).apply(this);
        case Parser.NODE_WHILE:
            return (function () {
                var ret = '';
                if (option.label) {
                    ret += option.label + ":";
                }
                    ret += 'while (';
                    ret += this._translate(ast[ND_DATAS][0]);
                    ret += ')';
                    ret += this._translate(ast[ND_DATAS][1]);
                return ret;
            }).call(this);
        case Parser.NODE_USE:
            // [module, exportType]
            return (function () {
                var module     = ast[ND_DATAS][0];
                var moduleName;
                if (module[ND_TYPE] == Parser.NODE_IDENT) {
                    moduleName = module[ND_DATAS];
                } else {
                    moduleName = module[ND_DATAS].replace(/.+\//, '').replace(/\.js/, '');
                }
                var exportType = ast[ND_DATAS][1];
                if (typeof(exportType) === 'undefined') {
                    // use fs;
                    return (function () {
                        var ret = 'var ';
                            ret += moduleName;
                            ret += ' = require(';
                        if (module[ND_TYPE] === Parser.NODE_IDENT) {
                            ret += "'" + module[ND_DATAS] + "'";
                        } else {
                            ret += this._translate(module);
                        }
                            ret += ');\n';
                        return ret;
                    }).call(this);
                } else if (Array.isArray(exportType) && exportType[ND_TYPE] === Parser.NODE_MAKE_ARRAY) {
                    // use fs qw/watch/;
                    return (function () {
                        // => var fs = require("fs");
                        var ret = 'var ';
                            ret += moduleName;
                            ret += ' = require(';
                        if (module[ND_TYPE] === Parser.NODE_IDENT) {
                            ret += "'" + module[ND_DATAS] + "'";
                        } else {
                            ret += this._translate(module);
                        }
                            ret += ');\n';

                        // => var watch = fs.watch;
                        // => var %s = %s.%s;
                        var ary = exportType[ND_DATAS];
                        for (var i=0, len=ary.length; i<len; i++) {
                            ret += 'var ';
                        if (ary[i][ND_TYPE] === Parser.NODE_STRING) {
                            ret += ary[i][ND_DATAS];
                        } else {
                            ret += this._translate(ary[i]);
                        }
                            ret += ' = ';
                            ret += this._translate(module);
                            ret += '.';
                        if (ary[i][ND_TYPE] === Parser.NODE_STRING) {
                            ret += ary[i][ND_DATAS];
                        } else {
                            ret += this._translate(ary[i]);
                        }
                            ret += ';';
                        }
                        return ret;
                    }).call(this);
                } else if (Array.isArray(exportType) && exportType[ND_TYPE] === Parser.NODE_MAKE_HASH) {
                    // use fs {'watch': 'look'};
                    return (function () {
                        // => var fs = require("fs");
                        var ret = 'var ';
                            ret += moduleName;
                            ret += ' = require(';
                        if (module[ND_TYPE] === Parser.NODE_IDENT) {
                            ret += "'" + module[ND_DATAS] + "'";
                        } else {
                            ret += this._translate(module);
                        }
                            ret += ');\n';

                        // => var watch = fs.watch;
                        // => var %s = %s.%s;
                        var ary = exportType[ND_DATAS];
                        for (var i=0, len=ary.length; i<len; i+=2) {
                            ret += 'var ';
                        if (ary[i][ND_TYPE] === Parser.NODE_STRING) {
                            ret += ary[i+1][ND_DATAS];
                        } else {
                            ret += this._translate(ary[i+1]);
                        }
                            ret += ' = ';
                            ret += this._translate(module);
                            ret += '.';
                        if (ary[i][ND_TYPE] === Parser.NODE_STRING) {
                            ret += ary[i][ND_DATAS];
                        } else {
                            ret += this._translate(ary[i]);
                        }
                            ret += ';';
                        }
                        return ret;
                    }).call(this);
                } else if (exportType === '*') {
                    // use fs *;
                    return (function () {
                        // => var fs = require("fs");
                        var ret = 'var ';
                            ret += moduleName;
                            ret += ' = require(';
                        if (module[ND_TYPE] === Parser.NODE_IDENT) {
                            ret += "'" + module[ND_DATAS] + "'";
                        } else {
                            ret += this._translate(module);
                        }
                            ret += ');\n';

                        // => for (var k in fs) { if (fs.hasOwnProperty(k)) {
                        //        this.k = fs[k];
                        //    }
                        // => var %s = %s.%s;
                        var k = 'K$$key' + this.getID();
                            ret += 'for (var '+k+' in fs) { if (fs.hasOwnProperty('+k+')) {';
                            ret += '  this[' + k + '] = ' + this._translate(module) + '[' + k + ']';
                            ret += '} }';
                        return ret;
                    }).call(this);
                } else {
                    console.log(exportType);
                    if (Array.isArray(exportType)) {
                        console.log(getNodeNameByType(exportType[ND_TYPE]));
                    }
                    throw 'Unimplemented';
                }
            }).call(this);
        case Parser.NODE_LABELED:
            return (function () {
                var label = this._translate(ast[ND_DATAS][0]);
                return this._translate(ast[ND_DATAS][1], {label: label});
            }).call(this);
        case Parser.NODE_SELF:
            return 'KV$$self';
        case Parser.NODE_FILETEST:
            return (function () {
                return 'Kuma.Core.fileTest("' + ast[ND_DATAS][0] +'",' + this._translate(ast[ND_DATAS][1]) + ')';
            }).call(this);
        case Parser.NODE_QX:
            return (function () {
            console.log("QX");
                return 'Kuma.Core._qx("' + ast[ND_DATAS] + '")';
            }).call(this);
        default:
            console.log("Unknown ast node: " + ast[ND_TYPE]); // debug
            throw "Unknown ast node: " + Parser.id2name[ast[ND_TYPE]];
        }

    };

    global.Kuma.Translator = Translator;
})(this.exports || this);
