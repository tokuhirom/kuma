"use strict";

var tap = require('tap'),
Translator = require("../src/translator.js").Kuma.Translator,
Parser = require("../src/parser.js").Kuma.Parser;

tap.test('ok', function (t) {
    var src = "2**10";

    var parser = new Parser(src);
    var ast = parser.parse();
    var tra = new Translator();
    var jssrc = tra.translate(ast);
    var ret = eval(jssrc);
    t.equivalent(ret, 1024);
    t.end();
});

