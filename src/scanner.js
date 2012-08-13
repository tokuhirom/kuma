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
    Scanner.TOKEN_STRING = 3;

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

    Scanner.TOKEN_QUESTION            = 300;
    Scanner.TOKEN_PLUSPLUS            = 301;
    Scanner.TOKEN_PLUS_ASSIGN         = 302;
    Scanner.TOKEN_PLUS                = 303;
    Scanner.TOKEN_BYTES_DQ            = 304;
    Scanner.TOKEN_BYTES_SQ            = 305;
    Scanner.TOKEN_LPAREN              = 306;
    Scanner.TOKEN_HEREDOC_SQ_START    = 307;
    Scanner.TOKEN_DIV_ASSIGN          = 308;
    Scanner.TOKEN_DIV                 = 309;
    Scanner.TOKEN_MOD_ASSIGN          = 310;
    Scanner.TOKEN_MOD                 = 311;
    Scanner.TOKEN_COMMA               = 312;
    Scanner.TOKEN_NOT_EQUAL           = 313;
    Scanner.TOKEN_REGEXP_NOT_MATCH    = 314;
    Scanner.TOKEN_NOT                 = 315;
    Scanner.TOKEN_EQUAL_EQUAL         = 316;
    Scanner.TOKEN_FAT_COMMA           = 317;
    Scanner.TOKEN_REGEXP_MATCH        = 318;
    Scanner.TOKEN_ASSIGN              = 319;
    Scanner.TOKEN_XOR_ASSIGN          = 320;
    Scanner.TOKEN_XOR                 = 321;
    Scanner.TOKEN_DOTDOTDOT           = 322;
    Scanner.TOKEN_DOTDOT              = 323;
    Scanner.TOKEN_DOT                 = 324;
    Scanner.TOKEN_OROR_ASSIGN         = 325;
    Scanner.TOKEN_OROR                = 326;
    Scanner.TOKEN_OR_ASSIGN           = 327;
    Scanner.TOKEN_OR                  = 328;
    Scanner.TOKEN_ANDAND              = 329;
    Scanner.TOKEN_AND_ASSIGN          = 330;
    Scanner.TOKEN_AND                 = 331;
    Scanner.TOKEN_LSHIFT_ASSIGN       = 332;
    Scanner.TOKEN_HEREDOC_SQ_START    = 333;
    Scanner.TOKEN_LSHIFT              = 334;
    Scanner.TOKEN_CMP                 = 335;
    Scanner.TOKEN_LE                  = 336;
    Scanner.TOKEN_LT                  = 337;
    Scanner.TOKEN_RSHIFT_ASSIGN       = 338;
    Scanner.TOKEN_RSHIFT              = 339;
    Scanner.TOKEN_GE                  = 340;
    Scanner.TOKEN_GT                  = 341;
    Scanner.TOKEN_REF                 = 342;
    Scanner.TOKEN_TILDE               = 343;
    Scanner.TOKEN_DEREF               = 344;
    Scanner.TOKEN_POW_ASSIGN          = 345;
    Scanner.TOKEN_POW                 = 346;
    Scanner.TOKEN_MUL_ASSIGN          = 347;
    Scanner.TOKEN_MUL                 = 348;
    Scanner.TOKEN_PLUSPLUS            = 349;
    Scanner.TOKEN_PLUS_ASSIGN         = 350;
    Scanner.TOKEN_PLUS                = 351;
    Scanner.TOKEN_LBRACE              = 352;
    Scanner.TOKEN_BYTES_SQ            = 354;
    Scanner.TOKEN_BYTES_DQ            = 355;
    Scanner.TOKEN_STRING_QQ_START     = 356;
    Scanner.TOKEN_REGEXP_QR_START     = 357;
    Scanner.TOKEN_QW_START            = 358;
    Scanner.TOKEN_STRING_Q_START      = 359;
    Scanner.TOKEN_STRING_DQ           = 360;
    Scanner.TOKEN_STRING_SQ           = 361;
    Scanner.TOKEN_LBRACKET            = 362;
    Scanner.TOKEN_FILETEST            = 363;
    Scanner.TOKEN_MINUSMINUS          = 364;
    Scanner.TOKEN_LAMBDA              = 365;
    Scanner.TOKEN_MINUS_ASSIGN        = 366;
    Scanner.TOKEN_MINUS               = 367;
    Scanner.TOKEN_RPAREN              = 368;

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
        '?': Scanner.TOKEN_QUESTION,
        '+=': Scanner.TOKEN_PLUS_ASSIGN,
        'b"': Scanner.TOKEN_BYTES_DQ,
        "b'": Scanner.TOKEN_BYTES_SQ,
        '/=': Scanner.TOKEN_DIV_ASSIGN,
        '/': Scanner.TOKEN_DIV,
        '%=': Scanner.TOKEN_MOD_ASSIGN,
        '%': Scanner.TOKEN_MOD,
        ',': Scanner.TOKEN_COMMA,
        '!=': Scanner.TOKEN_NOT_EQUAL,
        '!~': Scanner.TOKEN_REGEXP_NOT_MATCH,
        '!': Scanner.TOKEN_NOT,
        '==': Scanner.TOKEN_EQUAL_EQUAL,
        '=>': Scanner.TOKEN_FAT_COMMA,
        '=~': Scanner.TOKEN_REGEXP_MATCH,
        '=': Scanner.TOKEN_ASSIGN,
        '^=': Scanner.TOKEN_XOR_ASSIGN,
        '^': Scanner.TOKEN_XOR,
        '...': Scanner.TOKEN_DOTDOTDOT,
        '..': Scanner.TOKEN_DOTDOT,
        '.': Scanner.TOKEN_DOT,
        '||=': Scanner.TOKEN_OROR_ASSIGN,
        '||': Scanner.TOKEN_OROR,
        '|=': Scanner.TOKEN_OR_ASSIGN,
        '|': Scanner.TOKEN_OR,
        '&&': Scanner.TOKEN_ANDAND,
        '&=': Scanner.TOKEN_AND_ASSIGN,
        '&': Scanner.TOKEN_AND,
        '<<=': Scanner.TOKEN_LSHIFT_ASSIGN,
        "<<'": Scanner.TOKEN_HEREDOC_SQ_START,
        '<<': Scanner.TOKEN_LSHIFT,
        '<=>': Scanner.TOKEN_CMP,
        '<=': Scanner.TOKEN_LE,
        '<': Scanner.TOKEN_LT,
        '>>=': Scanner.TOKEN_RSHIFT_ASSIGN,
        '>>': Scanner.TOKEN_RSHIFT,
        '>=': Scanner.TOKEN_GE,
        '>': Scanner.TOKEN_GT,
        '\\': Scanner.TOKEN_REF,
        '~': Scanner.TOKEN_TILDE,
        '${': Scanner.TOKEN_DEREF,
        '**=': Scanner.TOKEN_POW_ASSIGN,
        '**': Scanner.TOKEN_POW,
        '*=': Scanner.TOKEN_MUL_ASSIGN,
        '*': Scanner.TOKEN_MUL,
        '++': Scanner.TOKEN_PLUSPLUS,
        '+': Scanner.TOKEN_PLUS,
        '{': Scanner.TOKEN_LBRACE,
        '(': Scanner.TOKEN_LPAREN,
        ')': Scanner.TOKEN_RPAREN,
        'qq': Scanner.TOKEN_STRING_QQ_START,
        'qr': Scanner.TOKEN_REGEXP_QR_START,
        'qw': Scanner.TOKEN_QW_START,
        'q': Scanner.TOKEN_STRING_Q_START,
        '"': Scanner.TOKEN_STRING_DQ,
        "'": Scanner.TOKEN_STRING_SQ,
        '[': Scanner.TOKEN_LBRACKET,
        '--': Scanner.TOKEN_MINUSMINUS,
        '->': Scanner.TOKEN_LAMBDA,
        '-=': Scanner.TOKEN_MINUS_ASSIGN,
        '-': Scanner.TOKEN_MINUS,
    };

    Scanner.prototype.get = function () {
        // ------------------------------------------------------------------------- 
        // skip white spaces
        // ------------------------------------------------------------------------- 
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

        // ------------------------------------------------------------------------- 
        // scan keywords
        // ------------------------------------------------------------------------- 
        for (var keyword in KEYWORDS) {
            if (this.src.substr(0, keyword.length) == keyword) {
                this.src = this.src.substr(keyword.length);
                return [KEYWORDS[keyword], undefined, this.lineno];
            }
        }

        // ------------------------------------------------------------------------- 
        // handle ident.
        // ------------------------------------------------------------------------- 
        var m = this.src.match(/^[$A-Za-z_][$A-Za-z0-9_]*/);
        if (m) {
            this.src = this.src.substr(m[0].length);
            return [Scanner.TOKEN_IDENT, m[0], this.lineno];
        }

        // ------------------------------------------------------------------------- 
        // handle number
        // ------------------------------------------------------------------------- 
        var doublematched = this.src.match(/^[1-9][0-9]*(\.[0-9]+)/);
        if (doublematched) {
            this.src = this.src.substr(doublematched[0].length);
            return [Scanner.TOKEN_DOUBLE, 0+doublematched[0], this.lineno];
        }
        var matched = this.src.match(/^[1-9][0-9]*/);
        if (matched) {
            this.src = this.src.substr(matched[0].length);
            return [Scanner.TOKEN_INTEGER, parseInt(matched[0], 10), this.lineno];
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

        // ------------------------------------------------------------------------- 
        // handle strings
        // ------------------------------------------------------------------------- 
        if (this.src.match(/^"/)) {
            var ret = this.src.match(/^"((\\"|[^"]+)*)"/);
            if (ret) {
                this.src = this.src.substr(ret[0].length);
                var lineno = this.lineno;
                // count up lineno.
                ret[1].replace(/\n/g, (function () {
                    this.lineno++;
                    return "\n";
                }).bind(this));
                return [
                    Scanner.TOKEN_STRING,
                    ret[1],
                    lineno
                ];
            } else {
                throw "Scanning error: Unexpected EOF in string.";
            }
        }

        // ------------------------------------------------------------------------- 
        // handle operators
        // ------------------------------------------------------------------------- 
        for (var op in ops) {
            if (this.src.substr(0, op.length) == op) {
                this.src = this.src.substr(op.length);
                return [ops[op], undefined, this.lineno];
            }
        }

        console.log("Bad token" + this.src.substr(0,20));
        throw "An error occured in tokenize: " + this.src.substr(0,20);
    };
    global.Kuma.Scanner = Scanner;

})(this.exports || this);
