(function (global) {
    if (!global.Kuma) { global.Kuma = {} }

    var Scanner = require('./scanner.js').Kuma.Scanner;

    function Parser(src) {
        // scan all tokens...
        // ugly but works. performance tuning needed.
        var scanner = new Scanner(src);
        var tokens = []
        while (1) {
            var token = scanner.get();
            tokens.push(token);
            if (token[0] === Scanner.TOKEN_EOF) {
                break;
            }
        }
        this.tokens = tokens;
        this.idx = 0;
    }

    Parser.NODE_FUNCALL = 1;
    Parser.NODE_IDENT = 2;

    Parser.prototype.trace = function () {
        if (this.TRACE_ON) {
            console.log.apply(null, Array.prototype.slice.call(arguments));
        }
    };
    Parser.prototype.getToken = function () {
        return this.tokens[this.idx++];
    };
    Parser.prototype.ungetToken = function () {
        if (this.idx == 0) { throw "Invalid index" }
        this.idx--;
    };
    Parser.prototype.getMark = function () {
        return this.idx;
    };
    Parser.prototype.restoreMark = function (i) {
        this.idx = i;
    };
    Parser.prototype.parse = function (src) {
        var mark = this.getMark();

        var primary = this.takePrimary();
        if (!primary) {
            this.trace("not a primary");
            this.restoreMark(mark);
            return;
        }

        var token = this.getToken();
        if (token[0] == Scanner.TOKEN_LPAREN) {
            // say(3)
            this.trace("Parsing funcall");
            this.ungetToken();

            var args = this.takeArguments();
            if (args) {
                return [
                    Parser.NODE_FUNCALL,
                    primary[2], // lineno
                    primary,
                    args
                ];
            } else {
                this.trace("no args");
                this.restoreMark(mark);
                return;
            }
        } else {
            this.restoreMark(mark);
            return;
        }
    };
    Parser.prototype.takeArguments = function () {
        var mark = this.getMark();

        var token = this.getToken();
        if (token[0] !== Scanner.TOKEN_LPAREN) {
            this.restoreMark(mark);
            return;
        }

        var args = [];
        // TODO: take args

        var token = this.getToken();
        if (token[0] !== Scanner.TOKEN_RPAREN) {
            this.restoreMark(mark);
            return;
        }
        return args;
    };
    Parser.prototype.takePrimary = function () {
        var mark = this.getMark();

        var token = this.getToken();
        if (token[0] == Scanner.TOKEN_IDENT) {
            return [Parser.NODE_IDENT, token[1], token[2]];
        } else {
            this.restoreMark(mark);
            return;
        }
    };

    global.Kuma.Parser = Parser;

})(this.exports || this);
