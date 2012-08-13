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
    Parser.NODE_STRING = 4;
    Parser.NODE_PRE_INC = 5;
    Parser.NODE_POST_INC = 6;
    Parser.NODE_PRE_DEC = 7;
    Parser.NODE_POST_DEC = 8;

    Parser.prototype.trace = function (msg) {
        if (this.TRACE_ON) {
            console.log("### " + msg);
        }
    };
    Parser.prototype.getToken = function () {
        return this.tokens[this.idx++];
    };
    Parser.prototype.lookToken = function () {
        return this.tokens[this.idx];
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
        return this.parseIncDec();
    };
    Parser.prototype.parseIncDec = function () {
        var token = this.lookToken();
        if (token[TK_TAG] == Scanner.TOKEN_PLUSPLUS) {
            // ++i
            this.getToken(); // remove ++
            var meth = this.parseMethodCall();
            if (meth) {
                return this.makeNode(
                    Parser.NODE_PRE_INC,
                    token[TK_LINENO],
                    meth
                );
            } else {
                throw "Cannot process ++ operator at line " + token[TK_LINENO];
            }
        } else if (token[TK_TAG] == Scanner.TOKEN_MINUSMINUS) {
            // --i
            this.getToken(); // remove --
            var meth = this.parseMethodCall();
            if (meth) {
                return this.makeNode(
                    Parser.NODE_PRE_DEC,
                    token[TK_LINENO],
                    meth
                );
            } else {
                throw "Cannot process -- operator at line " + token[TK_LINENO];
            }
        } else {
            var meth = this.parseMethodCall();
            if (!meth) { return; }

            var token = this.lookToken();
            this.trace("TOKEN: " + JSON.stringify(token));
            if (token[TK_TAG] == Scanner.TOKEN_PLUSPLUS) {
                // i++
                return this.makeNode(
                    Parser.NODE_POST_INC,
                    token[TK_LINENO],
                    meth
                );
            } else if (token[TK_TAG] == Scanner.TOKEN_MINUSMINUS) {
                // i--
                return this.makeNode(
                    Parser.NODE_POST_DEC,
                    token[TK_LINENO],
                    meth
                );
            } else {
                // normal method call
                return meth;
            }
        }
    };
    Parser.prototype.parseMethodCall = function (src) {
        // TODO: handle method call at here
        return this.parseFuncall(src);
    };
    Parser.prototype.parseFuncall = function () {
        var mark = this.getMark();

        var primary = this.takePrimary();
        if (!primary) {
            this.trace("not a primary");
            this.restoreMark(mark);
            return;
        }

        var token = this.lookToken();
        if (token[TK_TAG] == Scanner.TOKEN_LPAREN) {
            // say(3)
            this.trace("Parsing funcall");

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
            // It's primary token
            return primary;
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
        /*
        ($c, my $rhs) = three_expression($c)
            or return;
        my ($used, $token_id) = _token_op($c);
        my $op = +{
            TOKEN_ASSIGN()        => NODE_ASSIGN,
            TOKEN_MUL_ASSIGN()    => NODE_MUL_ASSIGN,
            TOKEN_PLUS_ASSIGN()   => NODE_PLUS_ASSIGN,
            TOKEN_DIV_ASSIGN()    => NODE_DIV_ASSIGN,
            TOKEN_MOD_ASSIGN()    => NODE_MOD_ASSIGN,
            TOKEN_MINUS_ASSIGN()  => NODE_MINUS_ASSIGN,
            TOKEN_LSHIFT_ASSIGN() => NODE_LSHIFT_ASSIGN,
            TOKEN_RSHIFT_ASSIGN() => NODE_RSHIFT_ASSIGN,
            TOKEN_POW_ASSIGN()    => NODE_POW_ASSIGN,
            TOKEN_AND_ASSIGN()    => NODE_AND_ASSIGN,
            TOKEN_OR_ASSIGN()     => NODE_OR_ASSIGN,
            TOKEN_XOR_ASSIGN()    => NODE_XOR_ASSIGN,
            TOKEN_OROR_ASSIGN()   => NODE_OROR_ASSIGN,
        }->{$token_id};
        if ($op) {
            $c = substr($c, $used);
            ($c, my $lhs) = expression($c)
                or _err "Cannot get expression after $op";
            return ($c, _node($op, $rhs, $lhs));
        } else {
            return ($c, $rhs);
        }
        */
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
        } else if (token[TK_TAG] == Scanner.TOKEN_STRING) {
            return this.makeNode(
                Parser.NODE_STRING,
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
