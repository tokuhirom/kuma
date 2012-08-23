/*jslint node: true, es5: true */
(function (global) {
    "use strict";

    if (!global.Kuma) { global.Kuma = {}; }

    var token_map = require('./token-map.js');

    // constructor
    function Scanner(src) {
        if (typeof src === 'undefined') { throw "Missing mandatory parameter: src"; }
        if (!src.charAt) { throw "src must be string"; }
        this.heredocTokenQueue = [];
        this.src = src;
        this.lineno = 1;
    }

    Scanner.id2name = token_map.id2name;
    for (var id in token_map.name2id) {
        if (!token_map.name2id.hasOwnProperty(id)) { continue; }
        Scanner[id] = token_map.name2id[id];
    }

    // constant variables
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
        "is" : Scanner.TOKEN_IS,
        "new" : Scanner.TOKEN_NEW,
        "static": Scanner.TOKEN_STATIC
    };

    var ops = {
        '?': Scanner.TOKEN_QUESTION,
        ':': Scanner.TOKEN_COLON,
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
        '<<': Scanner.TOKEN_LSHIFT,
        '<=>': Scanner.TOKEN_CMP,
        '<=': Scanner.TOKEN_LE,
        '<': Scanner.TOKEN_LT,
        '>>=': Scanner.TOKEN_RSHIFT_ASSIGN,
        '>>': Scanner.TOKEN_RSHIFT,
        '>=': Scanner.TOKEN_GE,
        '>': Scanner.TOKEN_GT,
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
        '"': Scanner.TOKEN_STRING_DQ,
        "'": Scanner.TOKEN_STRING_SQ,
        '[': Scanner.TOKEN_LBRACKET,
        ']': Scanner.TOKEN_RBRACKET,
        '}': Scanner.TOKEN_RBRACE,
        '--': Scanner.TOKEN_MINUSMINUS,
        '->': Scanner.TOKEN_LAMBDA,
        '-=': Scanner.TOKEN_MINUS_ASSIGN,
        '-': Scanner.TOKEN_MINUS,
        ';' : Scanner.TOKEN_SEMICOLON
    };
    var QW_MAP = {
        '@' : /^(\w+)|(\n)|(\s+)|(@)/,
        '(' : /^(\w+)|(\n)|(\s+)|(\))/,
        '{' : /^(\w+)|(\n)|(\s+)|(\})/,
        '[' : /^(\w+)|(\n)|(\s+)|(\])/,
        '<' : /^(\w+)|(\n)|(\s+)|(>)/,
        '/' : /^(\w+)|(\n)|(\s+)|(\/)/,
        '!' : /^(\w+)|(\n)|(\s+)|(!)/
    };
    var QX_MAP = {
        '@' : /^(@)|([^@]+)/,
        '(' : /^(\))|([^\)]+)/,
        '{' : /^(\})|([^}]+)/,
        '[' : /^(\])|([^\]]+)/,
        '<' : /^(>)|([^>]+)/,
        '/' : /^(\/)|([^\/]+)/,
        '`' : /^(`)|([^`]+)/,
        '!' : /^(!)|([^!]+)/
    };
    var QR_MAP = {
        '@' : /^(@)|([^@]+)/,
        '(' : /^(\))|([^\)]+)/,
        '{' : /^(\})|([^}]+)/,
        '[' : /^(\])|([^\]]+)/,
        '<' : /^(>)|([^>]+)/,
        '/' : /^(\/)|([^\/]+)/,
        '!' : /^(!)|([^!]+)/
    };
    var Q_MAP = {
        '@' : /^(@)|([^@]+)/,
        '(' : /^(\))|([^\)]+)/,
        '{' : /^(\})|([^}]+)/,
        '[' : /^(\])|([^\]]+)/,
        '<' : /^(>)|([^>]+)/,
        '/' : /^(\/)|([^\/]+)/,
        '!' : /^(!)|([^!]+)/
    };
    var QQ_MAP = {
        '@' : /^(@)|([^@]+)/,
        '(' : /^(\))|([^\)]+)/,
        '{' : /^(\})|([^}]+)/,
        '[' : /^(\])|([^\]]+)/,
        '<' : /^(>)|([^>]+)/,
        '/' : /^(\/)|([^\/]+)/,
        '!' : /^(!)|([^!]+)/
    };
    var OPS_KEYS = Object.keys(ops).sort(function (a,b) { return b.length - a.length; });

    Scanner.prototype.get = function () {
        var retval = this._get();
        if (retval[0] !== Scanner.TOKEN_LF) {
            this.lastToken = retval[0];
            this.lastTokenIsLF = false;
        } else {
            this.lastTokenIsLF = true;
        }
        return retval;
    };
    Scanner.prototype.divable = function (token_id) {
        switch (token_id) {
        case Scanner.TOKEN_IDENT:
        case Scanner.TOKEN_DOUBLE:
        case Scanner.TOKEN_INTEGER:
        case Scanner.TOKEN_PLUSPLUS:
        case Scanner.TOKEN_BYTES_DQ:
        case Scanner.TOKEN_BYTES_SQ:
        case Scanner.TOKEN_QW:
        case Scanner.TOKEN_STRING_DQ:
        case Scanner.TOKEN_STRING_SQ:
        case Scanner.TOKEN_LBRACKET:
        case Scanner.TOKEN_MINUSMINUS:
        case Scanner.TOKEN_LAMBDA:
        case Scanner.TOKEN_RPAREN:
        case Scanner.TOKEN_RBRACKET:
        case Scanner.TOKEN_REGEXP:
        case Scanner.TOKEN_LPAREN:
            return true;
        default:
            return false;
        }
    };
    Scanner.prototype._get = function () {
        // ------------------------------------------------------------------------- 
        // skip white space and comments
        // ------------------------------------------------------------------------- 
        this.src = this.src.replace(/^[ ]+/, '');
        this.src = this.src.replace(/^#[^\n]+/, '');
        this.src = this.src.replace(/^\n__END__\n[\s\S]+/, '');

        if (this.src.length === 0) {
            return [Scanner.TOKEN_EOF, undefined, this.lineno];
        }

        // ------------------------------------------------------------------------- 
        // LF
        // ------------------------------------------------------------------------- 
        if (this.src.charAt(0) === "\n") {
            this.src = this.src.substr(1);
            var token = [
                Scanner.TOKEN_LF,
                undefined,
                this.lineno++
            ];
            this.processHeredoc();
            return token;
        }

        // ------------------------------------------------------------------------- 
        // qx
        // ------------------------------------------------------------------------- 
        var qxMatch = this.src.match(/^qx([{\[(!@<\/])/) || this.src.match(/^(`)/);
        if (qxMatch) {
            return this.scanQX(qxMatch);
        }

        // ------------------------------------------------------------------------- 
        // qw
        // ------------------------------------------------------------------------- 
        var qwMatch = this.src.match(/^qw([{\[(!@<\/])/);
        if (qwMatch) {
            return this.scanQW(qwMatch);
        }

        // ------------------------------------------------------------------------- 
        // qr
        // ------------------------------------------------------------------------- 
        var qrMatch = this.src.match(/^qr([{\[(!@<\/])/);
        if (qrMatch) {
            return this.scanQR(qrMatch);
        }
        if (!this.divable(this.lastToken)) {
            var reMatch = this.src.match(/^(\/)/);
            if (reMatch) {
                return this.scanQR(reMatch);
            }
        }

        // ------------------------------------------------------------------------- 
        // q
        // ------------------------------------------------------------------------- 
        var qMatch = this.src.match(/^q([{\[(!@<\/])/);
        if (qMatch) {
            return this.scanQ(qMatch);
        }

        // ------------------------------------------------------------------------- 
        // qq
        // ------------------------------------------------------------------------- 
        var qqMatch = this.src.match(/^qq([{\[(!@<\/])/);
        if (qqMatch) {
            return this.scanQQ(qqMatch);
        }

        // ------------------------------------------------------------------------- 
        // heredoc
        // ------------------------------------------------------------------------- 
        var heredocSQMatch = this.src.match(/^<<'([^']+)'/);
        if (heredocSQMatch) {
        console.log("HEEEEEEEEEEER");
            this.src = this.src.substr(heredocSQMatch[0].length);
            return this.scanHeredocSQ(heredocSQMatch[1]);
        }

        // ------------------------------------------------------------------------- 
        // scan keywords
        // ------------------------------------------------------------------------- 
        for (var keyword in KEYWORDS) {
            if (KEYWORDS.hasOwnProperty(keyword)) {
                if (this.src.match(new RegExp('^' + keyword + '([^a-zA-Z_]|$)'))) {
                    this.src = this.src.substr(keyword.length);
                    return [KEYWORDS[keyword], undefined, this.lineno];
                }
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
        // filetest operator
        // ------------------------------------------------------------------------- 
        var ftmatched = this.src.match(/^-([xefd])([^a-zA-Z_]|$)/);
        if (ftmatched) {
            this.src = this.src.substr(ftmatched[0].length);
            return [Scanner.TOKEN_FILETEST, ftmatched[1], this.lineno];
        }

        // ------------------------------------------------------------------------- 
        // handle number
        // ------------------------------------------------------------------------- 
        var doublematched = this.src.match(/^(?:[1-9][0-9]*|0)(\.[0-9]+)/);
        if (doublematched) {
            this.src = this.src.substr(doublematched[0].length);
            return [Scanner.TOKEN_DOUBLE, parseFloat(doublematched[0]), this.lineno];
        }
        var matched = this.src.match(/^[1-9][0-9_]*/);
        if (matched) {
            this.src = this.src.substr(matched[0].length);
            return [Scanner.TOKEN_INTEGER, parseInt(matched[0].replace(/_/g, ''), 10), this.lineno];
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
            // TODO: is it correct?
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
        if (this.src.match(/^'/)) {
            return this.scanSQ();
        }

        // ------------------------------------------------------------------------- 
        // handle operators
        // ------------------------------------------------------------------------- 
        for (var i=0; i<OPS_KEYS.length; i++) {
            var op = OPS_KEYS[i];
            if (this.src.substr(0, op.length) == op) {
                this.src = this.src.substr(op.length);
                return [ops[op], undefined, this.lineno];
            }
        }

        console.log("Bad token" + this.src.substr(0,20));
        throw "An error occured in tokenize: " + this.src.substr(0,20);
    };
    Scanner.prototype.scanQW = function (qwMatch) {
        var re = QW_MAP[qwMatch[1]];
        this.src = this.src.substr(qwMatch[0].length);
        var closed = false;
        var words = [];
        var qwScanCallback = function (all, word, lf, space, close) {
            if (word) {
                words.push(word);
            } else if (lf) {
                this.lineno++;
            } else if (close) {
                closed = true;
            }
            return '';
        };
        while (this.src.length!==0 && !closed) {
            this.src = this.src.replace(re, qwScanCallback.bind(this));
        }
        return [
            Scanner.TOKEN_QW,
            words,
            this.lineno
        ];
    };
    Scanner.prototype.scanQR = function (qrMatch) {
        var re = QR_MAP[qrMatch[1]];
        this.src = this.src.substr(qrMatch[0].length);
        var closed = false;
        var regex = '';
        var scanCallback = function (all, close, word) {
            if (word) {
                regex += word;
            } else if (close) {
                closed = true;
            }
            return '';
        };
        while (this.src.length!==0 && !closed) {
            this.src = this.src.replace(
                re, scanCallback
            );
        }
        var option;
        this.src = this.src.replace(/^[ismg]+/i, function (opt) {
            option = opt;
            return '';
        });
        return [
            Scanner.TOKEN_REGEXP,
            [regex, option],
            this.lineno
        ];
    };
    Scanner.prototype.scanQX = function (qxMatch) {
        var re = QX_MAP[qxMatch[1]];
        this.src = this.src.substr(qxMatch[0].length);
        var closed = false;
        var str = '';
        var scanCallback = function (all, close, word) {
            if (word) {
                str += word;
            } else if (close) {
                closed = true;
            }
            return '';
        };
        while (this.src.length!==0 && !closed) {
            this.src = this.src.replace(
                re, scanCallback
            );
        }
        return [
            Scanner.TOKEN_QX,
            str,
            this.lineno
        ];
    };
    Scanner.prototype.scanQQ = function (qqMatch) {
        // TODO: support #{ }
        var re = QQ_MAP[qqMatch[1]];
        this.src = this.src.substr(qqMatch[0].length);
        var closed = false;
        var str = '';
        var scanCallback = function (all, close, word) {
            if (word) {
                str += word;
            } else if (close) {
                closed = true;
            }
            return '';
        };
        while (this.src.length!==0 && !closed) {
            this.src = this.src.replace(
                re, scanCallback
            );
        }
        return [
            Scanner.TOKEN_STRING,
            str,
            this.lineno
        ];
    };
    Scanner.prototype.scanQ = function (qMatch) {
        var re = Q_MAP[qMatch[1]];
        this.src = this.src.substr(qMatch[0].length);
        var closed = false;
        var str = '';
        var scanCallback = function (all, close, word) {
            if (word) {
                str += word;
            } else if (close) {
                closed = true;
            }
            return '';
        };
        while (this.src.length!==0 && !closed) {
            this.src = this.src.replace(
                re, scanCallback
            );
        }
        var option;
        this.src = this.src.replace(/^[ism]+/i, function (opt) {
            option = opt;
            return '';
        });
        return [
            Scanner.TOKEN_STRING,
            str,
            this.lineno
        ];
    };
    Scanner.prototype.scanSQ = function () {
        var ret = this.src.match(/^'((\\'|[^']+)*)'/);
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
    };
    Scanner.prototype.scanHeredocSQ = function (marker) {
        var token = [
            Scanner.TOKEN_HEREDOC_SQ_START,
            undefined,
            this.lineno
        ];
        this.heredocTokenQueue.push([marker, token]);
        return token;
    };
    Scanner.prototype.processHeredoc = function () {
        while (this.heredocTokenQueue.length > 0) {
            var h = this.heredocTokenQueue.shift();
            var marker = h[0];
            var token = h[1];
            var buffer = '';
            while (true) {
                var m = this.src.match(/^(.*)(\n|$)/);
                if (!m) {
                    throw 'Unexpected EOF in heredoc.'; // TODO: better diag
                }
                this.src = this.src.substr(m[0].length);
                this.lineno++;
                if (m[1] === marker) {
                    break;
                }
                buffer += m[0];
                if (this.src.length === 0) {
                    throw 'Unexpected EOF in heredoc.'; // TODO: better diag
                }
            }
            token[0] = Scanner.TOKEN_STRING;
            token[1] = buffer;
        }
    };
    global.Kuma.Scanner = Scanner;

})(this.exports || this);
