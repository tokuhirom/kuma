/*jslint node: true, es5: true */
"use strict";

var tap = require('tap'),
Scanner = require("../src/scanner.js").Kuma.Scanner;

tap.test("...", function (t) {
    t.equivalent(scanIt('...'), [
        [Scanner.TOKEN_DOTDOTDOT, undefined, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("shift operators", function (t) {
    t.equivalent(scanIt('2>>10'), [
        [Scanner.TOKEN_INTEGER, 2, 1],
        [Scanner.TOKEN_RSHIFT, undefined, 1],
        [Scanner.TOKEN_INTEGER, 10, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('2<<10'), [
        [Scanner.TOKEN_INTEGER, 2, 1],
        [Scanner.TOKEN_LSHIFT, undefined, 1],
        [Scanner.TOKEN_INTEGER, 10, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("empty", function (t) {
    var s = new Scanner("");
    t.ok(s);
    t.equivalent(s.get(), [Scanner.TOKEN_EOF, undefined, 1]);
    t.end();
});

tap.test("say(3)", function (t) {
    try {
        var s = new Scanner("say(3)");
        t.equivalent(s.get(), [Scanner.TOKEN_IDENT, "say", 1]);
        t.equivalent(s.get(), [Scanner.TOKEN_LPAREN, undefined, 1]);
        t.equivalent(s.get(), [Scanner.TOKEN_INTEGER, 3, 1]);
        t.equivalent(s.get(), [Scanner.TOKEN_RPAREN, undefined, 1]);
        t.equivalent(s.get(), [Scanner.TOKEN_EOF,    undefined, 1]);
    } catch (e) {
        console.log(e);
        t.fail(''+e);
    }
    t.end();
});

tap.test("literal", function (t) {
    t.equivalent(scanIt('0x4649'), [
        [Scanner.TOKEN_INTEGER, 0x4649, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('0'), [
        [Scanner.TOKEN_INTEGER, 0, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('3.14'), [
        [Scanner.TOKEN_DOUBLE, 3.14, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('"Hello"'), [
        [Scanner.TOKEN_STRING, "Hello",   1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt("\"Hello\nWorld\""), [
        [Scanner.TOKEN_STRING, "Hello\nWorld", 1],
        [Scanner.TOKEN_EOF,    undefined, 2]
    ], 'string contains new line');
    t.end();
});

tap.test("keywords", function (t) {
    t.equivalent(scanIt('class'), [
        [Scanner.TOKEN_CLASS, undefined, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('if'), [
        [Scanner.TOKEN_IF, undefined, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('__LINE__'), [
        [Scanner.TOKEN_LINE, undefined, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("**", function (t) {
    t.equivalent(scanIt('2**10'), [
        [Scanner.TOKEN_INTEGER, 2, 1],
        [Scanner.TOKEN_POW, undefined, 1],
        [Scanner.TOKEN_INTEGER, 10, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("[]", function (t) {
    t.equivalent(scanIt('[]'), [
        [Scanner.TOKEN_LBRACKET, undefined, 1],
        [Scanner.TOKEN_RBRACKET, undefined, 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("qw()", function (t) {
    t.equivalent(scanIt('qw()'), [
        [Scanner.TOKEN_QW, [], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qw(a b c)'), [
        [Scanner.TOKEN_QW, ['a', 'b', 'c'], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qw!a b c!'), [
        [Scanner.TOKEN_QW, ['a', 'b', 'c'], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qw/a b c/'), [
        [Scanner.TOKEN_QW, ['a', 'b', 'c'], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qw{a b c}'), [
        [Scanner.TOKEN_QW, ['a', 'b', 'c'], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("qr()", function (t) {
    t.equivalent(scanIt('qr()'), [
        [Scanner.TOKEN_REGEXP, ['', undefined], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qr{}'), [
        [Scanner.TOKEN_REGEXP, ['', undefined], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("qr()", function (t) {
    t.equivalent(scanIt('qr()'), [
        [Scanner.TOKEN_REGEXP, ['', undefined], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qr(^.)'), [
        [Scanner.TOKEN_REGEXP, ['^.', undefined], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qr/^./'), [
        [Scanner.TOKEN_REGEXP, ['^.', undefined], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.equivalent(scanIt('qr/^./i'), [
        [Scanner.TOKEN_REGEXP, ['^.', 'i'], 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("comment", function (t) {
    t.equivalent(scanIt('# foo\n...'), [
        [Scanner.TOKEN_LF, undefined, 1],
        [Scanner.TOKEN_DOTDOTDOT, undefined, 2],
        [Scanner.TOKEN_EOF,    undefined, 2]
    ]);
    t.equivalent(scanIt('  #foo\n...'), [
        [Scanner.TOKEN_LF, undefined, 1],
        [Scanner.TOKEN_DOTDOTDOT, undefined, 2],
        [Scanner.TOKEN_EOF,    undefined, 2]
    ]);
    t.end();
});

tap.test("q()", function (t) {
    t.equivalent(scanIt('q(hoge)'), [
        [Scanner.TOKEN_STRING, 'hoge', 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

tap.test("qq()", function (t) {
    t.equivalent(scanIt('qq(hoge)'), [
        [Scanner.TOKEN_STRING, 'hoge', 1],
        [Scanner.TOKEN_EOF,    undefined, 1]
    ]);
    t.end();
});

function scanIt(src) {
    var s = new Scanner(src);
    var ret = [];
    while (true) {
        var token = s.get();
        ret.push(token);
        if (token[0] == Scanner.TOKEN_EOF) {
            return ret;
        }
    }
}
