(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {} }

    var Scanner = require('./scanner.js').Kuma.Scanner;

    // index for each token
    var TK_TAG    = 0;
    var TK_VALUE  = 1;
    var TK_LINENO = 2;

    // index for ast node
    var ND_TYPE   = 0;
    var ND_LINENO = 1;
    var ND_DATAS  = 2;

    var BUILTIN_FUNCTIONS = [
        'say', 'open'
    ];

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
    Parser.NODE_BUILTIN_FUNCALL = 3;

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
        this.trace("Start");
        var mark = this.getMark();

        var primary = this.takePrimary();
        if (!primary) {
            this.trace("not a primary");
            this.restoreMark(mark);
            return;
        }

        var token = this.getToken();
        if (token[TK_TAG] == Scanner.TOKEN_LPAREN) {
            // say(3)
            this.trace("Parsing funcall");
            this.ungetToken();

            var args = this.takeArguments();
            if (args) {
                var node_type = primary[0] == Parser.NODE_IDENT && primary[2] in BUILTIN_FUNCTIONS
                    ? Parser.NODE_FUNCALL
                    : Parser.NODE_BUILTIN_FUNCALL;
                return this.makeNode( 
                    node_type,
                    primary[ND_LINENO], // lineno
                    [primary, args]
                );
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
        if (token[TK_TAG] !== Scanner.TOKEN_LPAREN) {
            this.restoreMark(mark);
            return;
        }

        var args = [];
        while (1) {
            var exp = this.takeAssignExpression();
            if (exp) {
                this.trace("Found exp");
                args.push(exp);
                var commaMark = this.getMark();
                var commaToken = this.getToken();
                if (commaToken[TK_TAG] === Scanner.TOKEN_COMMA) {
                    // nop
                } else {
                    this.restoreMark(commaMark);
                    break;
                }
            } else {
                this.trace("exp not found");
                break;
            }
        }
        // TODO: take args

        var token = this.getToken();
        if (token[TK_TAG] !== Scanner.TOKEN_RPAREN) {
            this.restoreMark(mark);
            return;
        }
        return args;
    };
    Parser.prototype.makeNode = function (type, lineno, datas) {
        return [
            type,
            lineno,
            datas
        ];
    };
    Parser.prototype.takeAssignExpression = function () {
        // TODO
        return this.takePrimary();
    };
    Parser.prototype.takePrimary = function () {
        var mark = this.getMark();

        var token = this.getToken();
        if (token[TK_TAG] == Scanner.TOKEN_IDENT) {
            return this.makeNode( 
                Parser.NODE_IDENT,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        } else if (token[TK_TAG] == Scanner.TOKEN_INTEGER) {
            return this.makeNode(
                Parser.NODE_INTEGER,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        } else {
            this.restoreMark(mark);
            return;
        }
    };

    global.Kuma.Parser = Parser;

})(this.exports || this);
