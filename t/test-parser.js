var tap = require('tap'),
Parser = require("../src/parser.js").Kuma.Parser;

tap.test('ok', function (t) {
    var parser = new Parser("say()");
    parser.TRACE_ON = true;
    var ast = parser.parse();
    t.equivalent(ast, 
        [
            1,
            1,
            [2,"say",1], // function object
            [] // args
        ]
    );

    t.end();
});

