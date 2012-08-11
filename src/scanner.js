(function (global) {
    if (!global.Kuma) { global.Kuma = {} }

    function Scanner(src) {
        this.src = src;
        this.lineno = 1;
    }

    // constant variables
    Scanner.TOKEN_EOF    = -1;
    Scanner.TOKEN_IDENT  = 0;
    Scanner.TOKEN_LPAREN = 1;
    Scanner.TOKEN_RPAREN = 2;
    Scanner.TOKEN_STRING = 3;
    Scanner.TOKEN_NUMBER = 4;

    var ops = {
        '(': Scanner.TOKEN_LPAREN,
        ')': Scanner.TOKEN_RPAREN,
    };

    Scanner.prototype.get = function () {
        if (this.src.length == 0) {
            return [Scanner.TOKEN_EOF, undefined, this.lineno];
        }

        // handle ident.
        var m = this.src.match(/^[$A-Za-z_][$A-Za-z0-9_]*/);
        if (m) {
            this.src = this.src.substr(m[0].length);
            return [Scanner.TOKEN_IDENT, m[0], this.lineno];
        }

        // handle number
        var matched = this.src.match(/^[0-9]+(\.[0-9]+)?/);
        if (matched) {
            this.src = this.src.substr(matched[0].length);
            return [Scanner.TOKEN_NUMBER, matched[0], this.lineno];
        }

        // handle operators
        for (var op in ops) {
            if (this.src.substr(0, op.length) == op) {
                this.src = this.src.substr(op.length);
                return [ops[op], undefined, this.lineno];
            }
        }

        return ["ERROR"];
    };
    global.Kuma.Scanner = Scanner;

})(this.exports || this);
