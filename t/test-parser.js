"use strict";

var tap = require('tap'),
Parser = require("../src/parser.js").Kuma.Parser;

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

tap.test('ops', function (t) {
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

function parse(src) {
    console.log("Start:: " + src);
    var parser = new Parser(src);
    // parser.TRACE_ON = true;
    var ast = parser.parse();
    return ast;
}

