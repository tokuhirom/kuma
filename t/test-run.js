"use strict";

var tap = require('tap'),
Translator = require("../src/translator.js").Kuma.Translator,
Parser = require("../src/parser.js").Kuma.Parser;

tap.test('if', function (t) {
    try {
        t.equivalent(testit("if 1 { 3 }"), 3);
        t.equivalent(testit("if 1 { 3 } else { 8 }"), 3);
        t.equivalent(testit("if 0 { 3 } else { 8 }"), 8);
        t.equivalent(testit("if 1 { 3 } elsif 1 { 8 }"), 3);
        t.equivalent(testit("if 0 { 3 } elsif 1 { 8 }"), 8);
        t.equivalent(testit("if 0 { 3 } elsif 0 { 8 } else { 9 }"), 9);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('ok', function (t) {
    t.equivalent(testit("2**10"), 1024);
    t.end();
});

tap.test('literals', function (t) {
    try {
        t.equivalent(testit("true"), true);
        t.equivalent(testit("false"), false);
        t.equivalent(testit("undef"), undefined);
    } catch (e) {
        t.fail(e);
    }
    t.end();
});

tap.test('unary ops', function (t) {
    try {
        t.equivalent(testit("~4"), -5);
        t.equivalent(testit("!4"), false);
        t.equivalent(testit("!!4"), true);
        t.equivalent(testit("+4"), +4);
        t.equivalent(testit("-4"), -4);
    } catch (e) {
        t.fail(e);
    }
    t.end();
});

tap.test('binary ops', function (t) {
    try {
        t.equivalent(testit("3*2"), 6);
        t.equivalent(testit("10/2"), 5);
        t.equivalent(testit("10%3"), 1);
        t.equivalent(testit("3+2"), 5);
        t.equivalent(testit("3-2"), 1);
        t.equivalent(testit("3<<2"), 12, "3<<2");
        t.equivalent(testit("24>>2"), 6);
        t.equivalent(testit("24>2"), true);
        t.equivalent(testit("24>=2"), true);
        t.equivalent(testit("24<2"), false);
        t.equivalent(testit("24<=2"), false);
    } catch (e) {
        t.fail(e);
    }
    t.end();
});

function testit(src) {
    var parser = new Parser(src);
    var ast = parser.parse();
    var tra = new Translator();
    var jssrc = tra.translate(ast);
    // console.log(jssrc);
    var ret = eval(jssrc);
    return ret;
}

