"use strict";

var tap = require('tap'),
Parser = require("../src/parser.js").Kuma.Parser;

/*
    left_op2(\&oror_expression, +{ TOKEN_DOTDOT() => NODE_DOTDOT, TOKEN_DOTDOTDOT() => NODE_DOTDOTDOT})
]);

rule('oror_expression', [
    left_op2(\&andand_expression, +{ TOKEN_OROR() => NODE_LOGICAL_OR })
]);

rule('andand_expression', [
    left_op2(\&or_expression, {TOKEN_ANDAND() => NODE_LOGICAL_AND})
]);

rule('or_expression', [
    left_op2(\&and_expression, +{TOKEN_OR() => NODE_BITOR, TOKEN_XOR() => NODE_BITXOR})
]);

rule('and_expression', [
    left_op2(\&equality_expression, {TOKEN_AND() => NODE_BITAND})
]);

rule('equality_expression', [
    nonassoc_op(\&cmp_expression, {TOKEN_EQUAL_EQUAL() => NODE_EQ, TOKEN_NOT_EQUAL() => NODE_NE, TOKEN_CMP() => NODE_CMP})
*/
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
        t.equivalent(parse("4..8")[0], Parser.NODE_DOTDOT, "DOTDOT");
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
    } catch (e) { t.fail(e) }
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
                [Parser.NODE_INTEGER,1,4],
            ]
        );
        t.equivalent(parse('+4'),
            [
                Parser.NODE_UNARY_PLUS,
                1,
                [Parser.NODE_INTEGER,1,4],
            ]
        );
        t.equivalent(parse('-4'),
            [
                Parser.NODE_UNARY_MINUS,
                1,
                [Parser.NODE_INTEGER,1,4],
            ]
        );
    } catch (e) {
        console.log(e);
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

    t.end();
});

tap.test('ok', function (t) {
    var parser = new Parser("say()");
    var ast = parser.parse();
    t.equivalent(ast, 
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
    var parser = new Parser("say(3)");
    var ast = parser.parse();
    t.equivalent(ast, 
        [
            Parser.NODE_BUILTIN_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"say"], // function object
                [
                    [Parser.NODE_INTEGER,1,3]
                ] // args
            ]
        ]
    );

    t.end();
});

function parse(src) {
    console.log("Start:: " + src);
    var parser = new Parser(src);
    // parser.TRACE_ON = true;
    var ast = parser.parse();
    return ast;
}

