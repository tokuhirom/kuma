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
    var s = new Scanner("say(3)");
    t.equivalent(s.get(), [Scanner.TOKEN_IDENT, "say", 1]);
    t.equivalent(s.get(), [Scanner.TOKEN_LPAREN, undefined, 1]);
    t.equivalent(s.get(), [Scanner.TOKEN_NUMBER, 3, 1]);
    t.equivalent(s.get(), [Scanner.TOKEN_RPAREN, undefined, 1]);
    t.equivalent(s.get(), [Scanner.TOKEN_EOF,    undefined, 1]);
    t.end();
});

