(function (global) {
    "use strict";
    if (!global.Kuma) { global.Kuma = {}; }

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
        if (!src) { throw "Missing mandatory parameter: src"; }
        this.src = src;
        var scanner = new Scanner(src);
        var tokens = [];
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
    Parser.NODE_POW = 9;
    Parser.NODE_INTEGER = 10;
    Parser.NODE_UNARY_NOT = 11;
    Parser.NODE_UNARY_TILDE = 12;
    Parser.NODE_UNARY_REF = 13;
    Parser.NODE_UNARY_PLUS = 14;
    Parser.NODE_UNARY_MINUS = 15;
    Parser.NODE_UNARY_MUL = 15;
    Parser.NODE_TRUE = 16;
    Parser.NODE_FALSE = 17;
    Parser.NODE_MUL = 18;
    Parser.NODE_DIV = 19;
    Parser.NODE_MOD = 20;
    Parser.NODE_ADD = 21;
    Parser.NODE_SUBTRACT = 22;
    Parser.NODE_LSHIFT = 23;
    Parser.NODE_RSHIFT = 24;
    Parser.NODE_GT = 25;
    Parser.NODE_GE = 26;
    Parser.NODE_LT = 27;
    Parser.NODE_LE = 28;
    Parser.NODE_EQ = 29;
    Parser.NODE_NE = 30;
    Parser.NODE_CMP = 31;
    Parser.NODE_DOTDOT = 32;
    Parser.NODE_DOTDOTDOT = 33;
    Parser.NODE_LOGICAL_OR = 34;
    Parser.NODE_LOGICAL_AND = 35;
    Parser.NODE_BITOR = 36;
    Parser.NODE_BITXOR = 37;
    Parser.NODE_BITAND = 38;
    Parser.NODE_THREE = 39;
    Parser.NODE_COMMA = 40;
    Parser.NODE_UNARY_NOT = 41;
    Parser.NODE_LOGICAL_XOR = 44;

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
        if (this.idx === 0) { throw "Invalid index"; }
        this.idx--;
    };
    Parser.prototype.getMark = function () {
        return this.idx;
    };
    Parser.prototype.restoreMark = function (i) {
        this.idx = i;
    };
    Parser.prototype.parse = function () {
        var ret = this.parseStrOrExpression();
        if (this.idx < this.tokens.length-1) {
            console.log(this.src);
            throw "Cannot parse. " + this.idx + "   " + this.tokens.length;
        }
        return ret;
    };

    // see http://en.wikipedia.org/wiki/Parsing_expression_grammar#Indirect_left_recursion
    // %left operator.
    Parser.prototype.left_op = function (upper, ops)  {
        var child = upper.call(this);
        if (!child) { return; }

        while (1) {
            var token = this.lookToken();
            if (!token) { break; }

            var node_type = ops[token[TK_TAG]];
            if (!node_type) { break; }
            this.getToken();

            var rhs = upper.call(this);
            if (!rhs) {
                // TODO better diag
                throw "Syntax error after " + node_type + " at line " + this.lineno;
            }

            child = this.makeNode(
                node_type,
                token[TK_LINENO],
                [child, rhs]
            );
        }
        return child;
    };

    var strOrMap = { };
    strOrMap[Scanner.TOKEN_STR_OR] = Parser.NODE_LOGICAL_OR;
    strOrMap[Scanner.TOKEN_STR_XOR] = Parser.NODE_LOGICAL_XOR;
    Parser.prototype.parseStrOrExpression = function () {
        return this.left_op(this.parseStringAndExpression, strOrMap);
    };

    var strAndMap = { };
    strAndMap[Scanner.TOKEN_STR_AND] = Parser.NODE_LOGICAL_AND;
    Parser.prototype.parseStringAndExpression = function() {
        return this.left_op(this.parseNotExpression, strAndMap);
    };

    Parser.prototype.parseNotExpression = function () {
        if (this.lookToken()[0] == Scanner.TOKEN_STR_NOT) {
            var head = this.getToken();
            var body = this.parseNotExpression();
            return this.makeNode(
                                 Parser.NODE_UNARY_NOT,
                                 head[TK_LINENO],
                                 body
                                 );
        } else {
            return this.parseCommaExpression();
        }
    };

    var commaMap = {};
    commaMap[Scanner.TOKEN_COMMA] = Parser.NODE_COMMA;
    Parser.prototype.parseCommaExpression = function () {
        return this.left_op(this.parseAssignExpression, commaMap);
    };

    // %right
    Parser.prototype.parseAssignExpression = function () {
        /*
        TODO
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
        return this.parseThreeExpression();
    };

    // parse ? :
    // %right
    Parser.prototype.parseThreeExpression = function() {
        var cond =this.parseDotdotExpression();
        if (!cond) { return; }

        var op = this.lookToken();
        if (op[TK_TAG] === Scanner.TOKEN_QUESTION) {
            this.trace("COME ON");
            this.getToken();
            var if_ = this.parseDotdotExpression();
            if (!if_) { return; }

            var colon = this.lookToken();
            if (colon[TK_TAG] !== Scanner.TOKEN_COLON) {
                return;
            }
            this.getToken();

            var else_ = this.parseDotdotExpression();
            if (!else_) { return; }
            return this.makeNode(
                                 Parser.NODE_THREE,
                                 cond[ND_LINENO],
                                 [
                                     cond,
                                     if_,
                                     else_
                                 ]
                                 );
        } else {
            return cond;
        }
    };

    var dotdotMap = {};
    dotdotMap[Scanner.TOKEN_DOTDOT] = Parser.NODE_DOTDOT;
    Parser.prototype.parseDotdotExpression = function () {
        return this.left_op(this.parseOrOrExpression, dotdotMap);
    };

    var ororMap = {};
    ororMap[Scanner.TOKEN_OROR] = Parser.NODE_LOGICAL_OR;
    Parser.prototype.parseOrOrExpression = function () {
        return this.left_op(this.parseAndAndExpression, ororMap);
    }

    var andandMap = {};
    andandMap[Scanner.TOKEN_ANDAND] = Parser.NODE_LOGICAL_AND;
    Parser.prototype.parseAndAndExpression = function () {
        return this.left_op(this.parseOrExpression, andandMap);
    };

    var orMap = {};
    orMap[Scanner.TOKEN_OR] = Parser.NODE_BITOR;
    orMap[Scanner.TOKEN_XOR] = Parser.NODE_BITXOR;
    Parser.prototype.parseOrExpression = function() {
        return this.left_op(this.parseAndExpression, orMap);
    };

    var andMap = {};
    andMap[Scanner.TOKEN_AND] = Parser.NODE_BITAND;
    Parser.prototype.parseAndExpression = function () {
        return this.left_op(this.parseEqualityExpression, andMap);
    };

    var equalityMap = {};
    equalityMap[Scanner.TOKEN_EQUAL_EQUAL] = Parser.NODE_EQ;
    equalityMap[Scanner.TOKEN_NOT_EQUAL] = Parser.NODE_NE;
    equalityMap[Scanner.TOKEN_CMP] = Parser.NODE_CMP;
    Parser.prototype.parseEqualityExpression = function () {
        return this.left_op(this.parseCmpExpression, equalityMap);
    };

    var cmpMap = { };
    cmpMap[Scanner.TOKEN_GT] = Parser.NODE_GT;
    cmpMap[Scanner.TOKEN_GE] = Parser.NODE_GE;
    cmpMap[Scanner.TOKEN_LT] = Parser.NODE_LT;
    cmpMap[Scanner.TOKEN_LE] = Parser.NODE_LE;
    Parser.prototype.parseCmpExpression = function () {
        return this.left_op(this.parseShiftExpression, cmpMap);
    };

    var shiftMap = { };
    shiftMap[Scanner.TOKEN_LSHIFT] = Parser.NODE_LSHIFT;
    shiftMap[Scanner.TOKEN_RSHIFT] = Parser.NODE_RSHIFT;
    Parser.prototype.parseShiftExpression = function () {
        return this.left_op(this.parseAdditiveExpression, shiftMap);
    };

    var additiveMap = { };
    additiveMap[Scanner.TOKEN_MINUS] = Parser.NODE_SUBTRACT;
    additiveMap[Scanner.TOKEN_PLUS]  = Parser.NODE_ADD;
    Parser.prototype.parseAdditiveExpression = function () {
        return this.left_op(this.parseTerm, additiveMap);
    };

    var termMap = { };
    termMap[Scanner.TOKEN_MUL] = Parser.NODE_MUL;
    termMap[Scanner.TOKEN_DIV] = Parser.NODE_DIV;
    termMap[Scanner.TOKEN_MOD] = Parser.NODE_MOD;
    Parser.prototype.parseTerm = function () {
        return this.left_op(this.parseRegexpMatch, termMap);
    };

    Parser.prototype.parseRegexpMatch = function () {
        // TODO: support =~, !~
        return this.parseUnary();
    };

    var UNARY_OPS = {};
    UNARY_OPS[Scanner.TOKEN_NOT] = Parser.NODE_UNARY_NOT;
    UNARY_OPS[Scanner.TOKEN_TILDE] = Parser.NODE_UNARY_TILDE;
    UNARY_OPS[Scanner.TOKEN_PLUS] = Parser.NODE_UNARY_PLUS;
    UNARY_OPS[Scanner.TOKEN_MINUS] = Parser.NODE_UNARY_MINUS;
    Parser.prototype.parseUnary = function (src) {
        var token = this.lookToken();
        // file test operator
        /*
        };
        */
        if (token[TK_TAG] === Scanner.NODE_FILETEST) {
            this.getToken();
            throw 'not implemented';
        } else if (token[TK_TAG] in UNARY_OPS) {
            this.getToken();

            var lhs = this.parseUnary();
            // TODO: show token name
            if (!lhs) { throw "Missing lhs for token number " + token[TK_TAG]; }
            return this.makeNode(
                UNARY_OPS[token[TK_TAG]],
                token[TK_LINENO],
                lhs
            );
        } else {
            return this.parsePow();
        }
    };
    Parser.prototype.parsePow = function () {
        // x**y
        var lhs = this.parseIncDec();
        if (!lhs) { return; }

        var token = this.lookToken();
        if (token[TK_TAG] == Scanner.TOKEN_POW) {
            this.getToken(); // move head
            var rhs = this.parsePow();
            if (rhs) {
                return this.makeNode(
                    Parser.NODE_POW,
                    token[TK_LINENO],
                    [
                        lhs,
                        rhs
                    ]
                );
            } else {
                throw "Missing right side value for ** at line " + token[TK_LINENO];
            }
        } else {
            return lhs;
        }
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
                this.getToken();
                // i++
                return this.makeNode(
                    Parser.NODE_POST_INC,
                    token[TK_LINENO],
                    meth
                );
            } else if (token[TK_TAG] == Scanner.TOKEN_MINUSMINUS) {
                this.getToken();
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
            var exp = this.parseAssignExpression();
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

        token = this.getToken();
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
    Parser.prototype.takePrimary = function () {
        var mark = this.getMark();

        var token = this.getToken();
        if (token[TK_TAG] == Scanner.TOKEN_IDENT) {
            return this.makeNode( 
                Parser.NODE_IDENT,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        } else if (token[TK_TAG] == Scanner.TOKEN_TRUE) {
            return this.makeNode( 
                Parser.NODE_TRUE,
                token[TK_LINENO]
            );
        } else if (token[TK_TAG] == Scanner.TOKEN_FALSE) {
            return this.makeNode( 
                Parser.NODE_FALSE,
                token[TK_LINENO]
            );
        } else if (token[TK_TAG] == Scanner.TOKEN_INTEGER) {
            return this.makeNode(
                Parser.NODE_INTEGER,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        } else if (token[TK_TAG] == Scanner.TOKEN_DOTDOTDOT) {
            return this.makeNode(
                Parser.NODE_DOTDOTDOT,
                token[TK_LINENO]
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
