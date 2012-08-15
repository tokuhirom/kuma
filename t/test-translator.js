/*jslint node: true, es5: true */
"use strict";

var tap = require('tap'),
Translator = require("../src/translator.js").Kuma.Translator,
Parser = require("../src/parser.js").Kuma.Parser;

tap.test('ok', function (t) {
    var tra = new Translator();
    var src = tra.translate(
        [
            Parser.NODE_BUILTIN_FUNCALL,
            1,
            [
                [Parser.NODE_IDENT,1,"say"], // function object
                [] // args
            ]
        ]
    );
    t.equivalent(src, '"use strict";' + "\n" + 'Kuma.Core.say()');
    t.end();
});

tap.test('pow', function (t) {
    console.log(testit('2**10'));
    t.equivalent(testit('2**10'), '"use strict";' + "\n" + 'Math.pow((2), (10))');
    t.end();
});

tap.test('method call', function (t) {
    try {
        console.log(testit('[].map'));
        t.equivalent(testit('[].map'), '"use strict";' + "\n" + "([]\n).map");
        t.equivalent(testit('[].map.map'), '"use strict";' + "\n" + "(([]\n).map).map");
        t.equivalent(testit('[].map().map'), '"use strict";' + "\n" + "(([]\n).map()).map");
        t.equivalent(testit('[].foo(1,2,3).map'), '"use strict";' + "\n" + "(([]\n).foo(1,2,3)).map");
        t.equivalent(testit('-> { }'), '"use strict";' + "\n" + "(function () {\n}\n)\n");
    } catch (e) { t.fail(e); }
    t.end();
});

function testit(src) {
    var parser = new Parser(src);
    var ast = parser.parse();
    var tra = new Translator();
    return tra.translate(ast);
}
