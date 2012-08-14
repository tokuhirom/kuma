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
            if (token[0] === Scanner.TOKEN_EOF || token[0] === Scanner.TOKEN_END) {
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
    Parser.NODE_NOP = 45;
    Parser.NODE_BLOCK = 46;
    Parser.NODE_RETURN = 47;
    Parser.NODE_UNDEF = 47;
    Parser.NODE_BREAK = 48;
    Parser.NODE_CONTINUE = 49;
    Parser.NODE_SUB = 50;
    Parser.NODE_TRY = 51;
    Parser.NODE_THROW = 52;
    Parser.NODE_STMTS = 53;

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
        var ret = this.parseStatementList();
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
        }
        /*
        my ($src, $got_end) = skip_ws(shift);
        return if $got_end;

        my $ret = [];
        LOOP: while (1) {
            my ($tmp, $stmt) = statement($src)
                or do {
                    return ($src, _node2(NODE_STMTS, $START, $ret), $got_end)
                };
            $src = $tmp;
            push @$ret, $stmt;

            # skip spaces.
            $src =~ s/^[ \t\f]* //s;
            my $have_next_stmt;
            # read next statement if found ';' or '\n'
            $src =~ s/^;//s
                and $have_next_stmt++;
            $src =~ s/^\n//s
                and do {
                    ++$LINENO;
                    $have_next_stmt++;
                START:
                    if (defined(my $marker = shift @HEREDOC_MARKERS)) {
                        while ($src =~ s/^(([^\n]*)(\n|$))//) {
                            if ($2 eq $marker) {
                                shift @HEREDOC_BUFS;
                                goto START;
                            } else {
                                ${$HEREDOC_BUFS[0]} .= $1;
                            }
                        }
                    } else {
                        if ($src =~ s/\A__END__\n.+//s) {
                            $got_end++;
                            last LOOP;
                        }
                        next LOOP;
                    }
                };
            next if $have_next_stmt;
            # there is no more statements, just return!
            return ($src, _node(NODE_STMTS, $ret), $got_end);
        }
        return ($src, _node(NODE_STMTS, $ret), $got_end);
*/
    };

    Parser.prototype.parseStatement = function () {
        // class Name extends Parent { }
        var token = this.lookToken();
        if (token[TK_TAG] === Scanner.TOKEN_CLASS) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_USE) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_UNLESS) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_IF) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_WHILE) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_DO) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_LBRACE) {
            return this.parseBlock();
        } else if (token[TK_TAG] === Scanner.TOKEN_FOR) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_FOR) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_FOR) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_FOR) {
            // TODO
        } else if (token[TK_TAG] === Scanner.TOKEN_FOR) {
            // TODO
        } else {
            // normal statement
            var stmt = this.parseJumpStatement();
            // TODO: support postifx if, for, unless, while
            return stmt;
        }
        /*
rule('statement', [
    sub {
        my $c = shift;
        # class Name [isa Parent] {}
        my ($used, $token_id) = _token_op($c);
        if ($token_id == TOKEN_CLASS) {
            $c = substr($c, $used);
            ($c, my $name) = class_name($c)
                or die "class name expected after 'class' keyword";
            my $base;
            if ((my $c2) = match($c, 'is')) {
                $c = $c2;
                ($c, $base) = class_name($c)
                    or die "class name expected after 'is' keyword";
                $base->[0] = NODE_PRIMARY_IDENT;
            }
            ($c, my $block) = block($c)
                or _err "Expected block after 'class' but not matched";
            return ($c, _node2(NODE_CLASS, $START, $name, $base, $block));
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
        } elsif ($token_id == TOKEN_UNLESS) {
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or _err "expression is required after 'unless' keyword";
            ($c, my $block) = block($c)
                or _err "block is required after unless keyword.";
            return ($c, _node2(NODE_IF, $START, _node2(NODE_UNARY_NOT, $START, $expression), $block));
        } elsif ($token_id == TOKEN_IF) {
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or die "expression is required after 'if' keyword line $LINENO";
            ($c, my $block) = block($c)
                or die "block is required after if keyword line $LINENO.";
            my $else;
            if ((my $c2, $else) = else_clause($c)) { # optional
                $c = $c2;
            }
            return ($c, _node2(NODE_IF, $START, $expression, $block, $else));
        } elsif ($token_id == TOKEN_WHILE) {
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or die "expression is required after 'while' keyword";
            ($c, my $block) = block($c)
                or die "block is required after while keyword.";
            return ($c, _node2(NODE_WHILE, $START, $expression, $block));
        } elsif ($token_id == TOKEN_DO) {
            $c = substr($c, $used);
            ($c, my $block) = block($c)
                or die "block is required after 'do' keyword.";
            return ($c, _node2(NODE_DO, $START, $block));
        } elsif ($token_id == TOKEN_LBRACE) {
            return block($c);
        } elsif ($token_id == TOKEN_FOR) {
            any(
                substr($c, $used),
                sub { # foreach
                    my $c = shift;
                    ($c, my $expression) = expression($c)
                        or return;
                    (my $c2) = match($c, '->')
                        or _err "'->' missing after for keyword '" . substr($c, 0, 15) . "..'";
                    $c = $c2;
                    my @vars;
                    while (my ($c2, $var) = variable($c)) {
                        push @vars, $var;
                        $c = $c2;
                        (my $c3) = match($c, ',')
                            or last;
                        $c = $c3;
                    }
                    ($c, my $block) = block($c)
                        or die "block is required after 'for' keyword.";
                    return ($c, _node2(NODE_FOREACH, $START, $expression, \@vars, $block));
                },
                sub { # C style for
                    my $c = shift;
                    ($c) = match($c, '(')
                        or return;
                    my ($e1, $e2, $e3);
                    if ((my $c2, $e1) = expression($c)) { # optional
                        $c = $c2;
                    }
                    ($c) = match($c, ';')
                        or return;
                    if ((my $c2, $e2) = expression($c)) {
                        $c = $c2;
                    }
                    ($c) = match($c, ';')
                        or return;
                    if ((my $c2, $e3) = expression($c)) {
                        $c = $c2;
                    }
                    ($c) = match($c, ')')
                        or die "closing paren is required after 'for' keyword.";;
                    ($c, my $block) = block($c)
                        or die "block is required after 'for' keyword.";
                    return ($c, _node2(NODE_FOR, $START, $e1, $e2, $e3, $block));
                }
            );
        } else {
            return;
        }
    },
    sub {
        my $c = shift;
        ($c, my $block) = jump_statement($c)
            or return;
        if ($c =~ /^(\s*|[^\n]+#[^\n]+)\n/) {
            # say()
            # if 1 {
            # }
            return ($c, $block);
        }
        my ($used, $token_id) = _token_op($c);
        if ($token_id == TOKEN_IF) {
            # foo if bar
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or die "expression required after postfix-if statement";
            return ($c, _node2(NODE_IF, $START, $expression, _node(NODE_BLOCK, $block), undef));
        } elsif ($token_id == TOKEN_UNLESS) {
            # foo unless bar
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or die "expression required after postfix-unless statement";
            return ($c, _node2(NODE_IF, $START, _node(NODE_UNARY_NOT, $expression), _node(NODE_BLOCK, $block), undef));
        } elsif ($token_id == TOKEN_FOR) {
            # foo for bar
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or die "expression required after postfix-for statement";
            return ($c, _node2(NODE_FOREACH, $START, $expression, [], _node(NODE_BLOCK, $block)));
        } elsif ($token_id == TOKEN_WHILE) {
            # foo while bar
            $c = substr($c, $used);
            ($c, my $expression) = expression($c)
                or die "expression required after postfix-if statement";
            return ($c, _node2(NODE_WHILE, $START, $expression, _node(NODE_BLOCK, $block)));
        } else {
            return ($c, $block);
        }
    },
]);
*/
    };

    Parser.prototype.parseJumpStatement = function () {
        var token = this.lookToken();
        if (token[TK_TAG] === Scanner.TOKEN_RETURN) {
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
             // todo: test
        } else if (token[TK_TAG] === Scanner.TOKEN_TRY) {
             // todo: test
        } else if (token[TK_TAG] === Scanner.TOKEN_THROW) {
             // todo: test
        } else {
            return this.parseStrOrExpression();
        }
    };

    /*
rule('expression', [
    sub {
        my $c = shift;
        my ($used, $token_id) = _token_op($c);
        } elsif ($token_id == TOKEN_SUB) {
            $c = substr($c, $used);
            # name is optional thing.
            # you can use anon sub.
            my $name;
            if ((my $c2, $name) = identifier($c)) {
                $c = $c2;
            }

            my $params;
            if ((my $c2, $params) = parameters($c)) {
                # optional
                $c = $c2;
            }

            ($c, my $block) = block($c)
                or _err "expected block after sub" . ($name ? " in $name->[2]" : '');
            return ($c, _node2(NODE_SUB, $START, $name, $params, $block));
        } elsif ($token_id == TOKEN_TRY) {
            $c = substr($c, $used);
            ($c, my $block) = block($c)
                or _err "expected block after try keyword";
            return ($c, _node2(NODE_TRY, $START, $block));
        } elsif ($token_id == TOKEN_DIE) {
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
        var token = this.lookToken();
        if (this.lookToken()[TK_TAG] == Scanner.TOKEN_LBRACE) {
            this.getToken();
            var body = this.parseStatementList();
            var rbrace = this.getToken();
            if (rbrace[TK_TAG] !== Scanner.TOKEN_RBRACE) {
                throw "Missing right brace in block at line " + rbrace[TK_LINENO];
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
                var node_type = (
                                 (primary[0] == Parser.NODE_IDENT && primary[2] in BUILTIN_FUNCTIONS)
                                        ? Parser.NODE_FUNCALL
                                        : Parser.NODE_BUILTIN_FUNCALL);
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
