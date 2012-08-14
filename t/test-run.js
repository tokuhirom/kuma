"use strict";

var tap = require('tap'),
Translator = require("../src/translator.js").Kuma.Translator,
Parser = require("../src/parser.js").Kuma.Parser;

tap.test('ok', function (t) {
    t.equivalent(testit("2**10"), 1024);
    t.end();
});

tap.test('unary ops', function (t) {
    try {
        t.equivalent(testit("~4"), -5);
        t.equivalent(testit("!4"), false);
        t.equivalent(testit("+4"), +4);
        t.equivalent(testit("-4"), -4);
    } catch (e) {
        console.log(e);
    }
    t.end();
});

function testit(src) {
    var parser = new Parser(src);
    var ast = parser.parse();
    var tra = new Translator();
    var jssrc = tra.translate(ast);
    var ret = eval(jssrc);
    return ret;
}

