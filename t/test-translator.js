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

