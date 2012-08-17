/*jslint node: true, es5: true */
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
        'say', 'open', 'p'
    ];

    function Parser(src, filename) {
        // scan all tokens...
        // ugly but works. performance tuning needed.
        if (typeof src === 'undefined') { throw "Missing mandatory parameter: src"; }
        if (!src.charAt) { throw "src must be string"; }
        this.src = src;
        var scanner = new Scanner(src);
        var tokens = [];
        while (true) {
            var token = scanner.get();
            tokens.push(token);
            if (token[0] === Scanner.TOKEN_EOF || token[0] === Scanner.TOKEN_END) {
                break;
            }
        }
        this.tokens = tokens;
        this.filename = filename || '<eval>';
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
    Parser.NODE_RANGE = 32;
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
    Parser.NODE_NOP = 45;
    Parser.NODE_BLOCK = 46;
    Parser.NODE_RETURN = 47;
    Parser.NODE_BREAK = 48;
    Parser.NODE_CONTINUE = 49;
    Parser.NODE_SUB = 50;
    Parser.NODE_TRY = 51;
    Parser.NODE_THROW = 52;
    Parser.NODE_STMTS = 53;
    Parser.NODE_UNDEF = 54;
    Parser.NODE_IF = 55;
    Parser.NODE_ELSIF = 56;
    Parser.NODE_ELSE = 57;
    Parser.NODE_ASSIGN = 58;
    Parser.NODE_MUL_ASSIGN = 59;
    Parser.NODE_PLUS_ASSIGN = 60;
    Parser.NODE_DIV_ASSIGN = 61;
    Parser.NODE_MOD_ASSIGN = 62;
    Parser.NODE_MINUS_ASSIGN = 63;
    Parser.NODE_LSHIFT_ASSIGN = 64;
    Parser.NODE_RSHIFT_ASSIGN = 65;
    Parser.NODE_POW_ASSIGN = 66;
    Parser.NODE_AND_ASSIGN = 67;
    Parser.NODE_OR_ASSIGN = 68;
    Parser.NODE_XOR_ASSIGN = 69;
    Parser.NODE_OROR_ASSIGN = 70;
    Parser.NODE_LET = 71;
    Parser.NODE_WHILE = 72;
    Parser.NODE_MAKE_ARRAY = 73;
    Parser.NODE_MAKE_HASH = 74;
    Parser.NODE_GET_METHOD = 75;
    Parser.NODE_METHOD_CALL = 76;
    Parser.NODE_LAMBDA = 77;
    Parser.NODE_FOREACH = 78;
    Parser.NODE_DO = 79;
    Parser.NODE_CLASS = 80;
    Parser.NODE_REGEXP = 81;
    Parser.NODE_FOR = 82;

    Parser.prototype.trace = function (msg) {
        if (this.TRACE_ON) {
            console.log("### " + msg);
        }
    };
    Parser.prototype.getToken = function (use_lf) {
        if (!use_lf) {
            while (this.tokens[this.idx][TK_TAG] === Scanner.TOKEN_LF) {
                ++this.idx;
            }
        }
        return this.tokens[this.idx++];
    };
    Parser.prototype.lookToken = function (use_lf) {
        var idx = this.idx;
        if (!use_lf) {
            while (this.tokens[idx][TK_TAG] === Scanner.TOKEN_LF) {
                ++idx;
            }
        }
        return this.tokens[idx];
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
        var ret = this.parseStatementList();
        while (this.tokens[this.idx][TK_TAG] === Scanner.TOKEN_LF) {
            ++this.idx;
        }
        if (this.idx < this.tokens.length-1) {
            console.log(this.src);
            console.log(this.tokens);
            throw "Cannot parse. index:" + this.idx + "   token length:" + this.tokens.length;
        }
        return ret;
    };

    // see http://en.wikipedia.org/wiki/Parsing_expression_grammar#Indirect_left_recursion
    // %left operator.
    Parser.prototype.left_op = function (upper, ops)  {
        var child = upper.call(this);
        if (!child) { return; }

        while (true) {
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

    Parser.prototype.parseStatementList = function () {
        var ret = [];
        var lineno = this.lookToken()[TK_LINENO];

        LOOP:
        while (1) {
            var stmt = this.parseStatement();
            if (!stmt) {
                return this.makeNode(
                                     Parser.NODE_STMTS,
                                     lineno,
                                     ret);
            }
            ret.push(stmt);
            if (this.lookToken()[TK_TAG] === Scanner.TOKEN_SEMICOLON) {
                this.getToken();
            }
        }
    };

    Parser.prototype.parseStatement = function () {
        // class Name extends Parent { }
        var token = this.lookToken();
        if (token[TK_TAG] === Scanner.TOKEN_CLASS) {
            return this.parseClassStmt();
        } else if (token[TK_TAG] === Scanner.TOKEN_USE) {
            return this.parseUseStmt();
        } else if (token[TK_TAG] === Scanner.TOKEN_UNLESS) {
            return this.parseUnlessStmt();
        } else if (token[TK_TAG] === Scanner.TOKEN_IF) {
            return this.parseIfStmt();
        } else if (token[TK_TAG] === Scanner.TOKEN_WHILE) {
            return this.parseWhileStmt();
        } else if (token[TK_TAG] === Scanner.TOKEN_DO) {
            return this.parseDoStmt();
        } else if (token[TK_TAG] === Scanner.TOKEN_LBRACE) {
            var hash = this.parseHashCreation();
            if (hash) {
                return hash;
            }
            return this.parseBlock();
        } else if (token[TK_TAG] === Scanner.TOKEN_FOR) {
            console.log("FOR!!!!");
            return this.parseForStmt();
        } else {
            // normal statement
            return this.parseNormalStatemnt();
        }
    };
    Parser.prototype.parseNormalStatemnt = function () {
        var stmt = this.parseJumpStatement();
        var nextToken = this.lookToken(true);
        switch (nextToken[TK_TAG]) {
        case Scanner.TOKEN_EOF:
        case Scanner.TOKEN_RBRACE:
            return stmt;
        case Scanner.TOKEN_LF:
        case Scanner.TOKEN_SEMICOLON:
            this.getToken(true);
            return stmt;
        case Scanner.TOKEN_IF:
            // foo if bar
            this.getToken(); // if
            var condIf = this.parseExpression();
            if (!condIf) {
                throw "Missing conditional expression for postfix if at line " + nextToken[TK_LINENO];
            }
            return this.makeNode(
                Parser.NODE_IF,
                nextToken[TK_LINENO],
                [condIf, stmt, undefined]
            );
        case Scanner.TOKEN_FOR:
            // postfix for
            this.getToken(); // for
            var condFor = this.parseExpression();
            if (!condFor) {
                throw "Missing conditional expression for postfix for at line " + nextToken[TK_LINENO];
            }
            return this.makeNode(
                Parser.NODE_FOREACH,
                nextToken[TK_LINENO],
                [condFor, undefined, stmt]
            );
        case Scanner.TOKEN_UNLESS:
            this.getToken(); // if
            var condUnless = this.parseExpression();
            if (!condUnless) {
                throw "Missing conditional expression for postfix unless at line " + nextToken[TK_LINENO];
            }
            return this.makeNode(
                Parser.NODE_IF,
                nextToken[TK_LINENO],
                [this.makeNode(Parser.NODE_UNARY_NOT, condUnless[ND_LINENO], condUnless), stmt, undefined]
            );
        case Scanner.TOKEN_WHILE:
            this.getToken(); // while
            var condWhile = this.parseExpression();
            return this.makeNode(
                Parser.NODE_WHILE,
                nextToken[TK_LINENO],
                [condWhile, stmt]
            );
        default:
            throw "Unexpected token : " + nextToken[TK_TAG]  + " at line " + this.lookToken(true)[TK_LINENO];
        }
    };
    Parser.prototype.parseClassStmt = function () {
        var token = this.getToken(); // class
        var name = this.parseIdentifier();
        var parent;
        if (!name) {
            throw "Class name expected after 'class' keyword at line " + token[TK_LINENO];
        }
        if (this.lookToken()[TK_TAG] == Scanner.TOKEN_IS) {
            this.getToken();

            parent = this.parseIdentifier();
            if (!parent) {
                throw "Parent class name expected after 'is' keyword at line " + token[TK_LINENO];
            }
        }
        var block = this.parseBlock();
        if (!block) {
            console.log(this.lookToken());
            throw "Expected block after 'class' keyword. but not matched at line " + token[TK_LINENO];
        }
        return this.makeNode(
            Parser.NODE_CLASS,
            token[TK_LINENO],
            [name, parent, block]
        );
    };
    Parser.prototype.parseUseStmt = function () {
        // TODO
        /*
        } elsif ($token_id == TOKEN_USE) {
            $c = substr($c, $used);
            my ($used, $token_id, $klass) = _token_op($c);
            my $op = +{
                TOKEN_CLASS_NAME() => NODE_IDENT,
                TOKEN_IDENT()      => NODE_IDENT,
            }->{$token_id};
            _err "class name is required after 'use' keyword"
                unless $op;
            $c = substr($c, $used);
            my $type;
            if ((my $c2) = match($c, '*')) {
                $c = $c2;
                $type = '*';
            } elsif (my ($c3, $primary) = primary($c)) {
                $c = $c3;
                $type = $primary;
            } else {
                $type = _node(NODE_UNDEF);
            }
            return ($c, _node2(NODE_USE, $START, _node($op, $klass), $type));
            */
    };
    Parser.prototype.parseDoStmt = function () {
        var token = this.getToken(); // 'do'
        var block = this.parseBlock();
        if (!block) {
            throw "block is required after 'do' keyword at line " + token[TK_LINENO];
        }
        return this.makeNode(
            Parser.NODE_DO,
            token[TK_LINENO],
            block
        );
    };
    Parser.prototype.parseForStmt = function () {
        var retval = this.parseForEachStmt();
        if (!retval) {
            retval = this.parseCStyleForStmt();
        }
        return retval;
    };
    // for container -> { }
    Parser.prototype.parseForEachStmt = function () {
        var mark = this.getMark();
        var token = this.getToken(); // 'for'
        var expression = this.parseExpression();
        if (!expression) {
            this.restoreMark(mark);
            return;
        }
        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_LAMBDA) {
            throw "'->' missing after for keyword at line " + token[TK_LINENO];
        }
        this.getToken();

        var vars;
        while (1) {
            var ident = this.parseIdentifier();
            if (!ident) { break; }
            if (!vars) { vars = []; }
            vars.push(ident);

            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_COMMA) {
                break;
            }
            this.getToken();
        }
        var block = this.parseBlock();
        if (!block) {
            throw "block is required after 'for' keyword at line " + token[TK_LINENO];
        }
        return this.makeNode(
            Parser.NODE_FOREACH,
            token[TK_LINENO],
            [expression, vars, block]
        );
    };
    Parser.prototype.parseCStyleForStmt = function () {
        var mark = this.getMark();
        var token = this.getToken(); // for

        // (
        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_LPAREN) {
            this.restoreMark(mark);
            return;
        }
        this.getToken();

        var e1 = this.parseExpression(); // optional

        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_SEMICOLON) {
            this.restoreMark(mark);
            return;
        }
        this.getToken();

        var e2 = this.parseExpression(); // optional

        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_SEMICOLON) {
            this.restoreMark(mark);
            return;
        }
        this.getToken();

        var e3 = this.parseExpression(); // optional

        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_RPAREN) {
            this.restoreMark(mark);
            return;
        }
        this.getToken();

        var block = this.parseBlock();
        if (!block) {
            throw "block is required after for keyword, at line " + token[TK_LINENO];
        }

        return this.makeNode(
            Parser.NODE_FOR,
            token[TK_LINENO],
            [e1, e2, e3, block]
        );
    };
    Parser.prototype.parseIfStmt = function () {
        var token = this.getToken();
        var cond = this.parseExpression();
        if (!cond) {
            throw "Expression is required after 'if' keyword line " + token[TK_LINENO];
        }
        var block = this.parseBlock();
        if (!block) {
            console.log(this.lookToken());
            throw "Block is required after if at line " + token[TK_LINENO];
        }
        var $else = this.parseElseClause();
        return this.makeNode(
            Parser.NODE_IF,
            token[TK_LINENO],
            [cond, block, $else]
        );
    };
    Parser.prototype.parseUnlessStmt = function () {
        var token = this.getToken();
        var cond = this.parseExpression();
        if (!cond) {
            throw "Expression is required after 'unless' keyword line " + token[TK_LINENO];
        }
        var block = this.parseBlock();
        if (!block) {
            throw "Block is required after unless " + token[TK_LINENO];
        }
        return this.makeNode(
            Parser.NODE_IF,
            token[TK_LINENO],
            [
                this.makeNode(Parser.NODE_UNARY_NOT, cond[ND_LINENO], cond),
                block,
                undefined
            ]
        );
    };
    Parser.prototype.parseWhileStmt = function () {
        var token = this.getToken();
        var body = this.parseExpression();
        if (!body) {
            throw "Expression is required after 'while' keyword at line " + token[TK_LINENO];
        }
        var block = this.parseBlock();
        if (!block) {
            throw "block is required after while keyword";
        }
        return this.makeNode(
            Parser.NODE_WHILE,
            token[TK_LINENO],
            [body, block]
        );
    };

    Parser.prototype.parseElseClause = function () {
        var token = this.lookToken(),
               block;
        if (token[TK_TAG] === Scanner.TOKEN_ELSIF) {
            this.getToken();
            var expression = this.parseExpression();
            if (!expression) {
                throw "expression is required after elsif keyword at line " + token[TK_LINENO];
            }
            block = this.parseBlock();
            if (!block) {
                throw "block is required after elsif keyword at line " + token[TK_LINENO];
            }
            var $else = this.parseElseClause();
            return this.makeNode(
                                 Parser.NODE_ELSIF,
                                 token[TK_LINENO],
                                 [expression, block, $else]);
        } else if (token[TK_TAG] === Scanner.TOKEN_ELSE) {
            this.getToken();
            block = this.parseBlock();
            if (!block) {
                throw "block is required after else keyword at line " + token[TK_LINENO];
            }
            return this.makeNode(
                                 Parser.NODE_ELSE,
                                 token[TK_LINENO],
                                 block);
        }
    };

    Parser.prototype.parseJumpStatement = function () {
        var token = this.lookToken();
        if (token[TK_TAG] === Scanner.TOKEN_RETURN) {
            this.getToken();
            var body = this.parseExpression();
            return this.makeNode(
                                 Parser.NODE_RETURN,
                                 token[TK_LINENO],
                                 body ? body : this.makeNode(Parser.NODE_UNDEF));
        } else {
            return this.parseExpression();
        }
    };

    Parser.prototype.parseExpression = function () {
        var token = this.lookToken();
        this.trace("Parsing expression : " + token[TK_TAG]);
        if (token[TK_TAG] === Scanner.TOKEN_BREAK) {
            this.getToken();
            return this.makeNode(
                                 Parser.NODE_BREAK,
                                 token[TK_LINENO]
                                 );
        } else if (token[TK_TAG] === Scanner.TOKEN_CONTINUE) {
            this.getToken();
            return this.makeNode(
                                 Parser.NODE_CONTINUE,
                                 token[TK_LINENO]
                                 );
        } else if (token[TK_TAG] === Scanner.TOKEN_SUB) {
            this.getToken();
            // name is optional thing.
            // you can use anon sub.
            var name = this.parseIdentifier();
            // and parameters are optional
            var params = this.parseParameters();
            var block = this.parseBlock();
            if (!block) {
                throw "Expected block after sub at line " + token[TK_LINENO];
            }

            return this.makeNode(
                Parser.NODE_SUB,
                token[TK_LINENO],
                [name, params, block]
            );
        } else if (token[TK_TAG] === Scanner.TOKEN_TRY) {
             // TODO: test
        } else if (token[TK_TAG] === Scanner.TOKEN_THROW) {
             // TODO: test
        } else {
            return this.parseStrOrExpression();
        }
    };

    Parser.prototype.parseIdentifier = function () {
        var token = this.lookToken();
        if (token[TK_TAG] == Scanner.TOKEN_IDENT) {
            this.getToken();
            return this.makeNode(
                Parser.NODE_IDENT,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        } else {
            return;
        }
    };

    Parser.prototype.parseParameters = function () {
        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_LPAREN) {
            return;
        }
        this.getToken();

        var ret = this.parseParameterList();

        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_RPAREN) {
            throw "You dont close paren in subroutine arguments at line " + this.lookToken()[TK_LINENO];
        }
        this.getToken();

        return ret;
    };

    Parser.prototype.parseParameterList = function () {
        var ret = [];

        while (1) {
            var variable = this.parseIdentifier();
            // TODO: default value support
            if (!variable) {
                break;
            }
            ret.push(variable);

            if (this.lookToken()[TK_TAG] == Scanner.TOKEN_COMMA) {
                this.getToken();
            } else {
                break;
            }
        }
        return ret;
    };

    /*
rule('expression', [
    sub {
        my $c = shift;
        my ($used, $token_id) = _token_op($c);
        } elsif ($token_id == TOKEN_TRY) {
        // TODO
            $c = substr($c, $used);
            ($c, my $block) = block($c)
                or _err "expected block after try keyword";
            return ($c, _node2(NODE_TRY, $START, $block));
        } elsif ($token_id == TOKEN_DIE) {
        // TODO
            $c = substr($c, $used);
            ($c, my $block) = expression($c)
                or die "expected expression after die keyword";
            return ($c, _node2(NODE_DIE, $START, $block));
        } else {
            return str_or_expression($c);
        }
    },
    */

    Parser.prototype.parseBlock = function () {
        var mark = this.getMark();
        var token = this.lookToken();
        if (this.lookToken()[TK_TAG] == Scanner.TOKEN_LBRACE) {
            this.getToken();
            var body = this.parseStatementList();
            var rbrace = this.getToken();
            if (rbrace[TK_TAG] !== Scanner.TOKEN_RBRACE) {
                // throw "Missing right brace in block at line " + rbrace[TK_LINENO];
                this.restoreMark(mark);
                return;
            }

            if (body) {
                return this.makeNode(
                                     Parser.NODE_BLOCK,
                                     body[ND_LINENO],
                                     body
                                     );
            } else {
                return this.makeNode(Parser.NODE_NOP);
            }
        }
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
    var assignMap = {};
    assignMap[Scanner.TOKEN_ASSIGN] = Parser.NODE_ASSIGN;
    assignMap[Scanner.TOKEN_MUL_ASSIGN] = Parser.NODE_MUL_ASSIGN;
    assignMap[Scanner.TOKEN_PLUS_ASSIGN] = Parser.NODE_PLUS_ASSIGN;
    assignMap[Scanner.TOKEN_DIV_ASSIGN] = Parser.NODE_DIV_ASSIGN;
    assignMap[Scanner.TOKEN_MOD_ASSIGN] = Parser.NODE_MOD_ASSIGN;
    assignMap[Scanner.TOKEN_MINUS_ASSIGN] = Parser.NODE_MINUS_ASSIGN;
    assignMap[Scanner.TOKEN_LSHIFT_ASSIGN] = Parser.NODE_LSHIFT_ASSIGN;
    assignMap[Scanner.TOKEN_RSHIFT_ASSIGN] = Parser.NODE_RSHIFT_ASSIGN;
    assignMap[Scanner.TOKEN_POW_ASSIGN] = Parser.NODE_POW_ASSIGN;
    assignMap[Scanner.TOKEN_AND_ASSIGN] = Parser.NODE_AND_ASSIGN;
    assignMap[Scanner.TOKEN_OR_ASSIGN] = Parser.NODE_OR_ASSIGN;
    assignMap[Scanner.TOKEN_XOR_ASSIGN] = Parser.NODE_XOR_ASSIGN;
    assignMap[Scanner.TOKEN_OROR_ASSIGN] = Parser.NODE_OROR_ASSIGN;
    Parser.prototype.parseAssignExpression = function () {
        var rhs = this.parseThreeExpression();
        var token = this.lookToken();
        var node_type = assignMap[token[TK_TAG]];
        if (node_type) {
            this.getToken();
            var lhs = this.parseExpression();
            if (!lhs) {
                throw "Cannot get expression after " + node_type;
            }
            return this.makeNode(
                node_type,
                token[TK_LINENO],
                [rhs, lhs]
            );
        } else {
            return rhs;
        }
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
    dotdotMap[Scanner.TOKEN_DOTDOT] = Parser.NODE_RANGE;
    Parser.prototype.parseDotdotExpression = function () {
        return this.left_op(this.parseOrOrExpression, dotdotMap);
    };

    var ororMap = {};
    ororMap[Scanner.TOKEN_OROR] = Parser.NODE_LOGICAL_OR;
    Parser.prototype.parseOrOrExpression = function () {
        return this.left_op(this.parseAndAndExpression, ororMap);
    };

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
        if (token[TK_TAG] === Scanner.NODE_FILETEST) {
            this.getToken();
            // TODO:
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
        var meth;
        if (token[TK_TAG] == Scanner.TOKEN_PLUSPLUS) {
            // ++i
            this.getToken(); // remove ++
            meth = this.parseMethodCall();
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
            meth = this.parseMethodCall();
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
            meth = this.parseMethodCall();
            if (!meth) { return; }

            token = this.lookToken();
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

    Parser.prototype.parseMethodCall = function () {
        var object = this.parseFuncall();
        if (!object) { return; }
        var ret = object;
        while (1) {
            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_DOT) {
                break;
            }
            this.getToken();

            var identifier = this.parseIdentifier();
            if (!identifier) {
                throw "There is no identifier after '.' operator in method call at line " + object[ND_LINENO];
            }
            var args = this.parseArguments();
            if (args) {
                ret = this.makeNode(
                    Parser.NODE_METHOD_CALL,
                    args[ND_LINENO],
                    [ret, identifier, args]
                );
            } else {
                ret = this.makeNode(
                    Parser.NODE_GET_METHOD,
                    object[ND_LINENO],
                    [ret, identifier]
                );
            }
        }
        return ret;
    };

    Parser.prototype.parseArguments = function () {
        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_LPAREN) {
            return;
        }
        var token = this.getToken();

        var args = [];
        while (1) {
            var arg = this.parseAssignExpression();
            if (!arg) { break; }
            args.push(arg);

            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_COMMA) {
                break;
            }
            this.getToken();
        }

        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_RPAREN) {
            throw "Parse failed: missing ')' in arugment parsing at line " + token[TK_LINENO];
        }
        this.getToken();
        return args;
    };

    Parser.prototype.parseFuncall = function () {
        var mark = this.getMark();

        var primary = this.parsePrimary();
        if (!primary) {
            this.trace("not a primary");
            this.restoreMark(mark);
            return;
        }

        var token = this.lookToken();
        if (token[TK_TAG] === Scanner.TOKEN_LPAREN) {
            // say(3)
            this.trace("Parsing funcall");

            var args = this.takeArguments();
            if (args) {
                var node_type = (function () { // Note: you can optimize here.
                    if (primary[ND_TYPE] === Parser.NODE_IDENT) {
                        for (var i=0, len=BUILTIN_FUNCTIONS.length; i<len; ++i) {
                            if (BUILTIN_FUNCTIONS[i] === primary[ND_DATAS]) {
                                return Parser.NODE_BUILTIN_FUNCALL;
                            }
                        }
                    }
                    return Parser.NODE_FUNCALL;
                })();
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
    Parser.prototype.parsePrimary = function () {
        var token;

        switch (this.lookToken()[TK_TAG]) {
        case Scanner.TOKEN_LAMBDA:
            return this.parseLambda();
        case Scanner.TOKEN_IDENT:
            return this.parseIdentifier();
        case Scanner.TOKEN_REGEXP:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_REGEXP,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        case Scanner.TOKEN_TRUE:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_TRUE,
                token[TK_LINENO]
            );
        case Scanner.TOKEN_FALSE:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_FALSE,
                token[TK_LINENO]
            );
        case Scanner.TOKEN_UNDEF:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_UNDEF,
                token[TK_LINENO]
            );
        case Scanner.TOKEN_INTEGER:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_INTEGER,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        case Scanner.TOKEN_DOTDOTDOT:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_DOTDOTDOT,
                token[TK_LINENO]
            );
        case Scanner.TOKEN_STRING:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_STRING,
                token[TK_LINENO],
                token[TK_VALUE]
            );
        case Scanner.TOKEN_FILE:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_STRING,
                token[TK_LINENO],
                this.filename
            );
        case Scanner.TOKEN_LINE:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_INTEGER,
                token[TK_LINENO],
                token[TK_LINENO]
            );
        case Scanner.TOKEN_LPAREN:
            var mark = this.getMark();
            this.getToken(); // (
            var body = this.parseExpression();
            if (!body) {
                this.restoreMark(mark);
                return;
            }
            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_RPAREN) {
                this.restoreMark(mark);
                return;
            }
            this.getToken();
            return body;
        case Scanner.TOKEN_LBRACKET:
            return this.parseArray();
        case Scanner.TOKEN_LBRACE:
            return this.parseHashCreation();
        case Scanner.TOKEN_LET:
            token = this.getToken(); // let
            var lhs = this.lookToken();
            if (lhs[TK_TAG] == Scanner.TOKEN_LPAREN) {
                // TODO let (x,y) = 3;
                this.getToken();
                throw "Not implemented yet";
            } else if (lhs[TK_TAG] == Scanner.TOKEN_IDENT) {
                this.getToken();
                return this.makeNode(
                    Parser.NODE_LET,
                    token[TK_LINENO],
                    this.makeNode(Parser.NODE_IDENT, token[TK_LINENO], lhs[TK_VALUE])
                );
            } else  {
                throw "This type of token is not allowed after let: " + lhs[TK_TAG] + " at line " + lhs[TK_LINENO];
            }
            throw "Should not reach here.";
        case Scanner.TOKEN_QW:
            token = this.getToken();
            return this.makeNode(
                Parser.NODE_MAKE_ARRAY,
                token[TK_LINENO],
                token[TK_VALUE].map((function (e) {
                    return this.makeNode(
                        Parser.NODE_STRING,
                        token[TK_LINENO],
                        e
                    );
                }).bind(this))
            );
        default:
            return;
        }
    };
    Parser.prototype.parseLambda = function () {
        var token = this.getToken(); // ->
        var params;
        while (1) {
            var variable = this.parseIdentifier();
            if (!variable) { break; }
            if (!params) { params = []; }
            params.push(variable);
            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_COMMA) {
                break;
            }
            this.getToken();
        }
        var block = this.parseBlock();
        if (!block) {
            throw "Missing block after -> at line " + token[TK_LINENO];
        }
        return this.makeNode(
            Parser.NODE_LAMBDA,
            token[TK_LINENO],
            [ params, block ]
        );
    };
    Parser.prototype.parseHashCreation = function () {
        this.trace("Parsing hash creation");
        var mark = this.getMark();
        var token  = this.getToken();
        // hash creation
        var body = [];
        while (1) {
            var lhs = this.parsePrimary();
            if (!lhs) { break; }
            body.push(lhs);
            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_COLON) {
                this.trace("Not a colon: " + this.lookToken()[TK_TAG]);
                this.restoreMark(mark);
                return;
            }
            var colon = this.getToken();
            var rhs = this.parseAssignExpression();
            if (!rhs) {
                throw "Missing expression after colon at line " + colon[TK_LINENO];
            }
            body.push(rhs);
            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_COMMA) {
                break;
            }
            this.getToken();
        }
        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_RBRACE) {
            this.trace("Not a right brace in hash: " + this.lookToken()[TK_TAG]);
            this.restoreMark(mark);
            return;
        }
        this.getToken();
        this.trace("Got a hash");
        return this.makeNode(
            Parser.NODE_MAKE_HASH,
            token[TK_LINENO],
            body
        );
    };
    Parser.prototype.parseArray = function () {
        var mark = this.getMark();
        var token = this.getToken(); // [
        // array creation like [1,2,3]
        var body = [];
        while (1) {
            var part = this.parseAssignExpression();
            if (!part) { break; }
            body.push(part);
            if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_COMMA) {
                break;
            }
            this.getToken();
        }
        if (this.lookToken()[TK_TAG] !== Scanner.TOKEN_RBRACKET) {
            this.restoreMark(mark);
            return;
        }
        this.getToken();
        return this.makeNode(
            Parser.NODE_MAKE_ARRAY,
            token[TK_LINENO],
            body
        );
    };
    /*
        } elsif ($token_id == TOKEN_STRING_Q_START) { # q{
        TODO
            return _sq_string(substr($c, $used), _closechar(substr($c, $used-1, 1)));
        } elsif ($token_id == TOKEN_STRING_QQ_START) { # qq{
        TODO
            return _dq_string(substr($c, $used), _closechar(substr($c, $used-1, 1)));
        } elsif ($token_id == TOKEN_DIV) { # /
        TODO
            return _regexp(substr($c, $used), q{/});
        } elsif ($token_id ==TOKEN_HEREDOC_SQ_START) { # <<'
            $c = substr($c, $used);
        TODO
            $c =~ s/^([^, \t\n']+)//
                or die "Parsing failed on heredoc LINE $LINENO";
            my $marker = $1;
            ($c) = match($c, q{'})
                or die "Parsing failed on heredoc LINE $LINENO";
            my $buf = '';
            push @HEREDOC_BUFS, \$buf;
            push @HEREDOC_MARKERS, $marker;
            return ($c, _node2(NODE_HEREDOC, $START, \$buf));
        } elsif ($token_id ==TOKEN_BYTES_SQ) { # b'
            return _bytes_sq(substr($c, $used), 0);
        } elsif ($token_id ==TOKEN_BYTES_DQ) { # b"
            return _bytes_dq(substr($c, $used), 0);
        } elsif ($token_id == TOKEN_SELF) {
        TODO
            $c = substr($c, $used);
            return ($c, _node(NODE_SELF, $LINENO));
            */

    global.Kuma.Parser = Parser;

})(this.exports || this);
