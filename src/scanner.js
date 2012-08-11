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
    Scanner.TOKEN_LPAREN = 1;
    Scanner.TOKEN_RPAREN = 2;
    Scanner.TOKEN_STRING = 3;
    Scanner.TOKEN_NUMBER = 4;

    var ops = {
        '(': Scanner.TOKEN_LPAREN,
        ')': Scanner.TOKEN_RPAREN,
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

        throw "An error occured in tokenize: " + this.src.substr(0,20);
    };
    global.Kuma.Scanner = Scanner;

})(this.exports || this);
