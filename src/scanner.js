(function (global) {
    "use strict";

    if (!global.Kuma) { global.Kuma = {} }

    function Scanner(src) {
        this.src = src;
        this.lineno = 1;
    }

    // constant variables
    Scanner.TOKEN_EOF    = -1;
    Scanner.TOKEN_IDENT  = 0;
    Scanner.TOKEN_DOUBLE  = 7;
    Scanner.TOKEN_INTEGER = 4;

    Scanner.TOKEN_LPAREN = 1;
    Scanner.TOKEN_RPAREN = 2;
    Scanner.TOKEN_STRING = 3;
    Scanner.TOKEN_LBRACE = 5;
    Scanner.TOKEN_RBRACE = 6;

    Scanner.TOKEN_OPADD     = 101;
    Scanner.TOKEN_OPSUB     = 102;
    Scanner.TOKEN_OPMUL     = 103;
    Scanner.TOKEN_OPDIV     = 104;
    Scanner.TOKEN_OPASSIGN  = 105;
    Scanner.TOKEN_OPEQ      = 106;
    Scanner.TOKEN_OPANDAND  = 107;
    Scanner.TOKEN_OPOROR    = 108;

    Scanner.TOKEN_CLASS       = 200;
    Scanner.TOKEN_RETURN      = 201;
    Scanner.TOKEN_USE         = 202;
    Scanner.TOKEN_UNLESS      = 203;
    Scanner.TOKEN_IF          = 204;
    Scanner.TOKEN_DO          = 205;
    Scanner.TOKEN_SUB         = 206;
    Scanner.TOKEN_STR_NOT     = 207;
    Scanner.TOKEN_DIE         = 208;
    Scanner.TOKEN_TRY         = 209;
    Scanner.TOKEN_STR_OR      = 210;
    Scanner.TOKEN_STR_XOR     = 211;
    Scanner.TOKEN_STR_AND     = 212;
    Scanner.TOKEN_ELSIF       = 213;
    Scanner.TOKEN_LAST        = 214;
    Scanner.TOKEN_NEXT        = 215;
    Scanner.TOKEN_ELSE        = 216;
    Scanner.TOKEN_WHILE       = 217;
    Scanner.TOKEN_FOR         = 218;
    Scanner.TOKEN_MY          = 219;
    Scanner.TOKEN_UNDEF       = 220;
    Scanner.TOKEN_TRUE        = 221;
    Scanner.TOKEN_FALSE       = 222;
    Scanner.TOKEN_SELF        = 223;
    Scanner.TOKEN_FILE        = 224;
    Scanner.TOKEN_LINE        = 225;

    var KEYWORDS = {
        "class" : Scanner.TOKEN_CLASS,
        "return" : Scanner.TOKEN_RETURN,
        "use" : Scanner.TOKEN_USE,
        "unless" : Scanner.TOKEN_UNLESS,
        "if" : Scanner.TOKEN_IF,
        "do" : Scanner.TOKEN_DO,
        "sub" : Scanner.TOKEN_SUB,
        "not" : Scanner.TOKEN_STR_NOT,
        "die" : Scanner.TOKEN_DIE,
        "try" : Scanner.TOKEN_TRY,
        "or" : Scanner.TOKEN_STR_OR,
        "xor" : Scanner.TOKEN_STR_XOR,
        "and" : Scanner.TOKEN_STR_AND,
        "elsif" : Scanner.TOKEN_ELSIF,
        "last" : Scanner.TOKEN_LAST,
        "next" : Scanner.TOKEN_NEXT,
        "else" : Scanner.TOKEN_ELSE,
        "while" : Scanner.TOKEN_WHILE,
        "for" : Scanner.TOKEN_FOR,
        "my" : Scanner.TOKEN_MY,
        "undef" : Scanner.TOKEN_UNDEF,
        "true" : Scanner.TOKEN_TRUE,
        "false" : Scanner.TOKEN_FALSE,
        "self" : Scanner.TOKEN_SELF,
        "__FILE__" : Scanner.TOKEN_FILE,
        "__LINE__" : Scanner.TOKEN_LINE,
    };

    var ops = {
        '(': Scanner.TOKEN_LPAREN,
        ')': Scanner.TOKEN_RPAREN,
        '{': Scanner.TOKEN_LBRACE,
        '}': Scanner.TOKEN_RBRACE,
        '+': Scanner.TOKEN_OPADD,
        '-': Scanner.TOKEN_OPSUB,
        '*': Scanner.TOKEN_OPMUL,
        '/': Scanner.TOKEN_OPDIV,
        '=': Scanner.TOKEN_OPASSIGN,
        '==': Scanner.TOKEN_OPEQ,
        '&&': Scanner.TOKEN_OPANDAND,
        '||': Scanner.TOKEN_OPOROR,
    };

    Scanner.prototype.get = function () {
        // skip white spaces
        LOOP: while (1) {
            switch (this.src.charAt(0)) {
            case "\n":
                this.src = this.src.substr(1);
                this.lineno++;
                continue LOOP;
            case " ":
                this.src = this.src.substr(1);
                continue LOOP;
            }
            break;
        }

        if (this.src.length == 0) {
            return [Scanner.TOKEN_EOF, undefined, this.lineno];
        }

        // scan keywords
        for (var keyword in KEYWORDS) {
            if (this.src.substr(0, keyword.length) == keyword) {
                this.src = this.src.substr(keyword.length);
                return [KEYWORDS[keyword], undefined, this.lineno];
            }
        }

        // handle ident.
        var m = this.src.match(/^[$A-Za-z_][$A-Za-z0-9_]*/);
        if (m) {
            this.src = this.src.substr(m[0].length);
            return [Scanner.TOKEN_IDENT, m[0], this.lineno];
        }

        // handle number
        var doublematched = this.src.match(/^[1-9][0-9]*(\.[0-9]+)/);
        if (doublematched) {
            this.src = this.src.substr(doublematched[0].length);
            return [Scanner.TOKEN_DOUBLE, 0+doublematched[0], this.lineno];
        }
        var matched = this.src.match(/^[1-9][0-9]*/);
        if (matched) {
            this.src = this.src.substr(matched[0].length);
            return [Scanner.TOKEN_INTEGER, 0+matched[0], this.lineno];
        }
        var hexmatched = this.src.match(/^0x[0-9a-fA-F]+/);
        if (hexmatched) {
            this.src = this.src.substr(hexmatched[0].length);
            return [Scanner.TOKEN_INTEGER, parseInt(hexmatched[0], 16), this.lineno];
        }
        if (this.src.substr(0, 1) == '0') {
            this.src = this.src.substr(1);
            return [Scanner.TOKEN_INTEGER, 0, this.lineno];
        }

        // handle operators
        for (var op in ops) {
            if (this.src.substr(0, op.length) == op) {
                this.src = this.src.substr(op.length);
                return [ops[op], undefined, this.lineno];
            }
        }

        throw "An error occured in tokenize: " + this.src.substr(0,20);
    };
    global.Kuma.Scanner = Scanner;

})(this.exports || this);
