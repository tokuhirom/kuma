var tap = require('tap'),
Scanner = require("../src/scanner.js").Kuma.Scanner;

tap.test("empty", function (t) {
    var s = new Scanner("");
    t.ok(s);
    t.equivalent(s.get(), [Scanner.TOKEN_EOF, undefined, 1]);
    t.equal(Scanner.TOKEN_EOF, -1);
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
    };
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

function scanIt(src) {
    var s = new Scanner(src);
    var ret = [];
    while (1) {
        var token = s.get();
        ret.push(token);
        if (token[0] == Scanner.TOKEN_EOF) {
            return ret;
        }
    }
}
