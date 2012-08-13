var tap = require('tap'),
Parser = require("../src/parser.js").Kuma.Parser;

tap.test('ok', function (t) {
    var parser = new Parser("say()");
    parser.TRACE_ON = true;
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
    parser.TRACE_ON = true;
    var ast = parser.parse();
    t.equivalent(ast, 
        [
            Parser.NODE_BUILTIN_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"say"], // function object
                [
                    [Parser.NODE_NUMBER,1,3]
                ] // args
            ]
        ]
    );

    t.end();
});

tap.test('incdec', function (t) {
    t.equivalent(parse("++i"), [
        Parser.NODE_PRE_INC,
        1,
        [
            [Parser.NODE_IDENT,1,"say"], // function object
            [
                [Parser.NODE_NUMBER,1,3]
            ] // args
        ]
    ]);
    t.equivalent(parse("i++"), [
        Parser.NODE_BUILTIN_FUNCALL,
        1,
        [
            [Parser.NODE_IDENT,1,"say"], // function object
            [
                [Parser.NODE_NUMBER,1,3]
            ] // args
        ]
    ]);

    t.end();
});

function parse(src) {
    var parser = new Parser(src);
    parser.TRACE_ON = true;
    var ast = parser.parse();
    return ast;
}

