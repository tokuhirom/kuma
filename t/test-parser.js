/*jslint node: true, es5: true */
"use strict";

var tap = require('tap'),
Parser = require("../src/parser.js").Kuma.Parser,
Scanner = require("../src/scanner.js").Kuma.Scanner,
vm = require('vm');

tap.test('if', function (t) {
    try {
        t.equivalent(parse("if 8 { }"), [
                     Parser.NODE_IF,
                     1,
                     [
                     [Parser.NODE_INTEGER,1,8],
                     [Parser.NODE_BLOCK, 1, [Parser.NODE_STMTS, 1, []]],
                     undefined
                     ]
                     ]);
        t.equivalent(parse("if 8 { } else { }"), [
                     Parser.NODE_IF,
                     1,
                     [
                     [Parser.NODE_INTEGER,1,8],
                     [Parser.NODE_BLOCK, 1, [Parser.NODE_STMTS, 1, []]],
                     [Parser.NODE_ELSE, 1,
                         [Parser.NODE_BLOCK, 1,
                              [Parser.NODE_STMTS, 1, []]]],
                     ]
                     ]);
        t.equivalent(parse("if 8 { } elsif 9 { }"), [
                     Parser.NODE_IF,
                     1,
                     [
                     [Parser.NODE_INTEGER,1,8],
                     [Parser.NODE_BLOCK, 1, [Parser.NODE_STMTS, 1, []]],
                     [Parser.NODE_ELSIF, 1,
                         [
                                      [Parser.NODE_INTEGER,1,9],
                                        [Parser.NODE_BLOCK, 1,[Parser.NODE_STMTS, 1, []]],
                                        undefined
                            ],
                                ],
                     ]
                     ]);
        t.equivalent(parse("if 8 { } elsif 9 { } else { }"), [
                     Parser.NODE_IF,
                     1,
                     [
                     [Parser.NODE_INTEGER,1,8],
                     [Parser.NODE_BLOCK, 1, [Parser.NODE_STMTS, 1, []]],
                     [Parser.NODE_ELSIF, 1,
                         [
                                      [Parser.NODE_INTEGER,1,9],
                                        [Parser.NODE_BLOCK, 1,[Parser.NODE_STMTS, 1, []]],
                                        [Parser.NODE_ELSE, 1, [Parser.NODE_BLOCK,1,[Parser.NODE_STMTS,1,[]]]]
                            ],
                                ],
                     ]
                     ]);
    }catch (e) { t.fail(e); }
    t.end();
});


tap.test('last', function (t) {
    try {
        t.equivalent(parse("last"), [
                     Parser.NODE_LAST,
                     1,
                     undefined
                     ]);
        t.equivalent(parse("next"), [
                     Parser.NODE_NEXT,
                     1,
                     undefined
                     ]);
        t.equivalent(parse("return 3"), [
                     Parser.NODE_RETURN,
                     1,
                        [Parser.NODE_INTEGER,1,3]
                     ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('and/or/xor', function (t) {
    try {
        t.equivalent(parse("4 and 8"), [
                Parser.NODE_LOGICAL_AND,
                1,
                [
                [Parser.NODE_INTEGER,1,4],
                [Parser.NODE_INTEGER,1,8]
                ]
            ]);
        t.equivalent(parse("4 or 8"), [
                Parser.NODE_LOGICAL_OR,
                1,
                [
                [Parser.NODE_INTEGER,1,4],
                [Parser.NODE_INTEGER,1,8]
                ]
            ]);
        t.equivalent(parse("4 xor 8"), [
                Parser.NODE_LOGICAL_XOR,
                1,
                [
                [Parser.NODE_INTEGER,1,4],
                [Parser.NODE_INTEGER,1,8]
                ]
            ]);
    } catch (e) { t.fail(e); }
    t.end();
});
tap.test('!', function (t) {
    try {
        t.equivalent(parse("!4"), [
                Parser.NODE_UNARY_NOT,
                1,
                [Parser.NODE_INTEGER,1,4]
            ]);
        t.equivalent(parse("!!4"), [
                Parser.NODE_UNARY_NOT,
                1,
                [Parser.NODE_UNARY_NOT, 1, [Parser.NODE_INTEGER,1,4]]
            ]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('comma', function (t) {
    try {
        t.equivalent(parse("4,5"), [
                Parser.NODE_COMMA,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,5]
                ]
            ]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('three', function (t) {
    try {
        t.equivalent(parse("4?8:5"), [
                Parser.NODE_THREE,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8],
                    [Parser.NODE_INTEGER,1,5]
                ]
            ]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('binop', function (t) {
    try {
        t.equivalent(parse("4==8"), [
                Parser.NODE_EQ,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]);
        t.equivalent(parse("4==8")[0], Parser.NODE_EQ, "EQ");
        t.equivalent(parse("4!=8")[0], Parser.NODE_NE);
        t.equivalent(parse("4<=>8")[0], Parser.NODE_CMP);
        t.equivalent(parse("4&8")[0], Parser.NODE_BITAND, "BITAND");
        t.equivalent(parse("4|8")[0], Parser.NODE_BITOR);
        t.equivalent(parse("4^8")[0], Parser.NODE_BITXOR);
        t.equivalent(parse("4&&8")[0], Parser.NODE_LOGICAL_AND, "LOGICAL AND");
        t.equivalent(parse("4||8")[0], Parser.NODE_LOGICAL_OR);
        t.equivalent(parse("4..8")[0], Parser.NODE_RANGE, "DOTDOT");
        t.equivalent(parse("...")[0], Parser.NODE_DOTDOTDOT, 'DOTDOTDOT');
        console.log(parse("..."));
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('shift', function (t) {
    try {
        t.equivalent(parse('4<<8'),
            [
                Parser.NODE_LSHIFT,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ],
            '4<<8'
        );
        t.equivalent(parse('4>>8'),
            [
                Parser.NODE_RSHIFT,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ],
            '4<<8'
        );
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('binop', function (t) {
    try {
        t.ok(Parser.NODE_LSHIFT);
        t.equivalent(parse('4<8'),
            [
                Parser.NODE_LT,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
        t.equivalent(parse('4>8'),
            [
                Parser.NODE_GT,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
        t.equivalent(parse('4>=8'),
            [
                Parser.NODE_GE,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
        t.equivalent(parse('4<=8'),
            [
                Parser.NODE_LE,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
    } catch (e) {
        t.fail(e);
    }

    t.end();
});

tap.test('additive', function (t) {
    try {
        t.equivalent(parse('4+8'),
            [
                Parser.NODE_ADD,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
        t.equivalent(parse('4-8'),
            [
                Parser.NODE_SUBTRACT,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
    } catch (e) {
        t.fail(e);
    }

    t.end();
});

tap.test('term', function (t) {
    try {
        t.equivalent(parse('4*8'),
            [
                Parser.NODE_MUL,
                1,
                [
                    [Parser.NODE_INTEGER,1,4],
                    [Parser.NODE_INTEGER,1,8]
                ]
            ]
        );
    } catch (e) {
        t.fail(e);
    }

    t.end();
});

tap.test('literals', function (t) {
    try {
        t.equivalent(parse('true'),
            [
                Parser.NODE_TRUE,
                1,
                undefined
            ]
        );
        t.equivalent(parse('false'),
            [
                Parser.NODE_FALSE,
                1,
                undefined
            ]
        );
    } catch (e) {
        console.log(e);
    }

    t.end();
});

tap.test('unary ops', function (t) {
    try {
        t.equivalent(parse('!4'),
            [
                Parser.NODE_UNARY_NOT,
                1,
                [Parser.NODE_INTEGER,1,4],
            ]
        );
        t.equivalent(parse('~4'),
            [
                Parser.NODE_UNARY_TILDE,
                1,
                [Parser.NODE_INTEGER,1,4]
            ]
        );
        t.equivalent(parse('+4'),
            [
                Parser.NODE_UNARY_PLUS,
                1,
                [Parser.NODE_INTEGER,1,4]
            ]
        );
        t.equivalent(parse('-4'),
            [
                Parser.NODE_UNARY_MINUS,
                1,
                [Parser.NODE_INTEGER,1,4]
            ]
        );
    } catch (e) {
        t.fail(e);
    }

    t.end();
});

tap.test('pow', function (t) {
    t.equivalent(parse('2**10'),
        [
            Parser.NODE_POW,
            1,
            [
                [Parser.NODE_INTEGER,1,2],
                [Parser.NODE_INTEGER,1,10]
            ]
        ]
    );

    t.end();
});
tap.test('pow', function (t) {
    t.equivalent(parse("8**16"), [
        Parser.NODE_POW,
        1,
        [
            [Parser.NODE_INTEGER,1,8],
            [Parser.NODE_INTEGER,1,16]
        ]
    ]);
    t.end();
});

tap.test('incdec', function (t) {
    try {
        t.equivalent(parse("i++"), [
            Parser.NODE_POST_INC,
            1,
            [Parser.NODE_IDENT,1,"i"]
        ]);
        t.equivalent(parse("++i"), [
            Parser.NODE_PRE_INC,
            1,
            [Parser.NODE_IDENT,1,"i"]
        ]);
        t.equivalent(parse("--i"), [
            Parser.NODE_PRE_DEC,
            1,
            [Parser.NODE_IDENT,1,"i"]
        ]);
        t.equivalent(parse("i--"), [
            Parser.NODE_POST_DEC,
            1,
            [Parser.NODE_IDENT,1,"i"]
        ]);
    } catch (e) { t.fail(e); }

    t.end();
});

tap.test('ok', function (t) {
    var parser = new Parser("say()");
    var ast = parser.parse();
    t.equivalent(ast[2][0], 

        [
            Parser.NODE_BUILTIN_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"say"], // function object
                [] // args
            ]
        ]
    );

    t.end();
});

tap.test('say(3)', function (t) {
    t.equivalent(parse("say(3)"), [
            Parser.NODE_BUILTIN_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"say"], // function object
                [
                    [Parser.NODE_INTEGER,1,3]
                ] // args
            ]
                 ]);

    t.end();
});

tap.test('funcall', function (t) {
    try {
        t.equivalent(parse("x()"), [
            Parser.NODE_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"x"],
                []
            ]
        ]);
        t.equivalent(parse("say()"), [
            Parser.NODE_BUILTIN_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"say"],
                []
            ]
        ]);
    } catch (e) { t.fail(e); }

    t.end();
});

tap.test('hash', function (t) {
    try {
        t.equivalent(parse('{}'), [
            Parser.NODE_MAKE_HASH,
            1,
            []
        ]);
        t.equivalent(parse('{2:4}'), [
            Parser.NODE_MAKE_HASH,
            1,
            [
                [Parser.NODE_INTEGER,1,2],
                [Parser.NODE_INTEGER,1,4],
            ]
        ], 'trailing comma');
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('array', function (t) {
    try {
        t.equivalent(parse('[]'), [
            Parser.NODE_MAKE_ARRAY,
            1,
            [ ]
        ]);
        t.equivalent(parse('[1,2,3]'), [
            Parser.NODE_MAKE_ARRAY,
            1,
            [
                [Parser.NODE_INTEGER,1,1],
                [Parser.NODE_INTEGER,1,2],
                [Parser.NODE_INTEGER,1,3],
            ]
        ]);
        t.equivalent(parse('[1,2,3,]'), [
            Parser.NODE_MAKE_ARRAY,
            1,
            [
                [Parser.NODE_INTEGER,1,1],
                [Parser.NODE_INTEGER,1,2],
                [Parser.NODE_INTEGER,1,3],
            ]
        ], 'trailing comma');
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('parse', function (t) {
    try {
        t.equivalent(parse('1.bar'), [
            Parser.NODE_GET_METHOD,
            1,
            [
                [Parser.NODE_INTEGER,1,1],
                [Parser.NODE_IDENT,1,"bar"]
            ]
        ]);
        t.equivalent(parse('1.bar.baz'), [
            Parser.NODE_GET_METHOD,
            1,
            [
                [Parser.NODE_GET_METHOD, 1,
                    [
                        [Parser.NODE_INTEGER,1,1],
                        [Parser.NODE_IDENT,1,"bar"]
                    ]
                ],
                [Parser.NODE_IDENT,1,"baz"]
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('foreach', function (t) {
    try {
        t.equivalent(parse('for [] -> { }'), [
            Parser.NODE_FOREACH,
            1,
            [
                [Parser.NODE_MAKE_ARRAY,1,[]],
                undefined,
                [Parser.NODE_BLOCK,1,[
                    Parser.NODE_STMTS,
                    1,
                    []
                ]]
            ]
        ]);
        t.equivalent(parse('for [] -> x { }'), [
            Parser.NODE_FOREACH,
            1,
            [
                [Parser.NODE_MAKE_ARRAY,1,[]],
                [
                    [Parser.NODE_IDENT, 1, 'x']
                ],
                [Parser.NODE_BLOCK,1,[
                    Parser.NODE_STMTS,
                    1,
                    []
                ]]
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('qw', function (t) {
    try {
        t.equivalent(parse('qw!a b c!'), [
            Parser.NODE_MAKE_ARRAY,
            1,
            [
                [Parser.NODE_STRING, 1, 'a'],
                [Parser.NODE_STRING, 1, 'b'],
                [Parser.NODE_STRING, 1, 'c']
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('do', function (t) {
    try {
        t.equivalent(parse('do { 1; }'), [
            Parser.NODE_DO,
            1,
            [
                Parser.NODE_BLOCK,
                1,
                [Parser.NODE_STMTS, 1, [
                    [Parser.NODE_INTEGER, 1, 1]
                ]]
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('class', function (t) {
    try {
        t.equivalent(parse('class Foo { }'), [
            Parser.NODE_CLASS,
            1,
            [
                [Parser.NODE_IDENT, 1, 'Foo'],
                undefined,
                [
                    Parser.NODE_BLOCK,
                    1,
                    [Parser.NODE_STMTS, 1, [ ]]
                ]
            ]
        ]);
        t.equivalent(parse('class Foo is Bar { }'), [
            Parser.NODE_CLASS,
            1,
            [
                [Parser.NODE_IDENT, 1, 'Foo'],
                [Parser.NODE_IDENT, 1, 'Bar'],
                [
                    Parser.NODE_BLOCK,
                    1,
                    [Parser.NODE_STMTS, 1, [ ]]
                ]
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('regexp', function (t) {
    try {
        t.equivalent(parse('qr/a/'), [
            Parser.NODE_REGEXP,
            1,
            ['a', undefined]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('LF/;', function (t) {
    try {
        t.equivalent(parse2('1;2'), [
            [
                Parser.NODE_INTEGER,
                1,
                1
            ],
            [
                Parser.NODE_INTEGER,
                1,
                2
            ]
        ]);
        t.equivalent(parse2('1\n2'), [
            [
                Parser.NODE_INTEGER,
                1,
                1
            ],
            [
                Parser.NODE_INTEGER,
                2,
                2
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('LF/;', function (t) {
    try {
        var TK_TAG = 0;
        var parser = new Parser("1\n2");
        t.equivalent(parser.lookToken()[TK_TAG], Scanner.TOKEN_INTEGER);
        t.equivalent(parser.getToken()[TK_TAG], Scanner.TOKEN_INTEGER);
        t.equivalent(parser.lookToken(true)[TK_TAG], Scanner.TOKEN_LF);
        t.equivalent(parser.lookToken()[TK_TAG], Scanner.TOKEN_INTEGER);
        t.equivalent(parser.getToken()[TK_TAG], Scanner.TOKEN_INTEGER);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('postfix if', function (t) {
    try {
        t.equivalent(parse2("1 if 3"), [[
            Parser.NODE_IF,
            1,
            [
                [
                    Parser.NODE_INTEGER,
                    1,
                    3
                ],
                [
                    Parser.NODE_INTEGER,
                    1,
                    1
                ],
                undefined
            ]
        ]]);
        t.equivalent(parse2("1\nif 3 { }"), [
            [
                Parser.NODE_INTEGER,
                1,
                1
            ],
            [
                Parser.NODE_IF,
                2,
                [
                    [
                        Parser.NODE_INTEGER,
                        2,
                        3
                    ],
                    [Parser.NODE_BLOCK,2, [Parser.NODE_STMTS, 2, []]],
                    undefined
                ]
            ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('c-style for', function (t) {
    try {
        t.equivalent(parse2("for (;;) { }"), [[
            Parser.NODE_FOR,
            1,
            [
                undefined,
                undefined,
                undefined,
                [Parser.NODE_BLOCK,1, [Parser.NODE_STMTS, 1, []]]
            ]
        ]]);
        t.equivalent(parse2("for (6;4;3) { }"), [[
            Parser.NODE_FOR,
            1,
            [
                [ Parser.NODE_INTEGER, 1, 6 ],
                [ Parser.NODE_INTEGER, 1, 4 ],
                [ Parser.NODE_INTEGER, 1, 3 ],
                [Parser.NODE_BLOCK,1, [Parser.NODE_STMTS, 1, []]]
            ]
        ]]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('regexp match', function (t) {
    try {
        t.equivalent(parse("s =~ qr//"), [
            Parser.NODE_REGEXP_MATCH, 1, [ [ Parser.NODE_IDENT, 1, 's' ], [ Parser.NODE_REGEXP, 1, ['', undefined] ] ]
        ]);
        t.equivalent(parse("s !~ qr//"), [
            Parser.NODE_REGEXP_NOT_MATCH, 1, [ [ Parser.NODE_IDENT, 1, 's' ], [ Parser.NODE_REGEXP, 1, ['', undefined] ] ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('array item', function (t) {
    try {
        t.equivalent(parse("sss[bababa]"), [
            Parser.NODE_ITEM, 1, [ [ Parser.NODE_IDENT, 1, 'sss' ], [ Parser.NODE_IDENT, 1, 'bababa' ] ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

tap.test('{}', function (t) {
    try {
        t.equivalent(parse("{}.foo"), [
            Parser.NODE_GET_METHOD, 1, [ [ Parser.NODE_MAKE_HASH, 1, [] ], [ Parser.NODE_IDENT, 1, 'foo' ] ]
        ]);
    }catch (e) { t.fail(e); }
    t.end();
});

function parse(src) {
    console.log("Start:: " + src);
    var parser = new Parser(src);
    parser.TRACE_ON = true;
    var ast = parser.parse();
    return ast[2][0];
}

function parse2(src) {
    console.log("Start:: " + src);
    var parser = new Parser(src);
    parser.TRACE_ON = true;
    var ast = parser.parse();
    return ast[2];
}
