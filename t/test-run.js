/*jslint node: true, es5: true, evil: true */
"use strict";

var tap = require('tap'),
Translator = require("../src/translator.js").Kuma.Translator,
Parser = require("../src/parser.js").Kuma.Parser,
Core = require("../src/runtime.js").Kuma.Core,
Runner = require("../src/runner.js"),
vm = require('vm');

tap.test('__LINE__', function (t) {
    try {
        t.equivalent(testit("__LINE__"), 1);
        t.equivalent(testit("\n\n__LINE__"), 3);
        t.equivalent(testit("__FILE__"), '<eval>');
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('unless', function (t) {
    try {
        t.equivalent(testit("8;unless 1 { 3 }"), undefined);
        t.equivalent(testit("unless 0 { 3 }"), 3);
    } catch (e) { t.fail(e); }
    t.end();
});

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
        t.equivalent(testit('5_000'), 5000);
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

tap.test('assign', function (t) {
    try {
        t.equivalent(testit("my $i=8; $i"), 8);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('func', function (t) {
    try {
        t.equivalent(testit("my $x = sub { return 3; }; $x()"), 3);
        t.equivalent(testit("sub y { return 8; }; y()"), 8);
        t.equivalent(testit("sub y() { return 8; }; y()"), 8);
        t.equivalent(testit("sub y($n) { return $n*8; }; y(3)"), 24);
        t.equivalent(testit("sub y($n) { return $n**8; }; y(3)"), 6561);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('assignment', function (t) {
    try {
        t.equivalent(testit("my $x = 5; $x += 3; $x"), 8);
        t.equivalent(testit("my $x = 5; $x *= 3; $x"), 15);
        t.equivalent(testit("my $x = 4; $x /= 2; $x"), 2);
        t.equivalent(testit("my $x = 4; $x -= 2; $x"), 2);
        t.equivalent(testit("my $x = 4; $x %= 2; $x"), 0);
        t.equivalent(testit("my $x = 4; $x <<= 2; $x"), 16);
        t.equivalent(testit("my $x = 4; $x >>= 1; $x"), 2);
        t.equivalent(testit("my $x = 255; $x &= 3; $x"), 3);
        t.equivalent(testit("my $x = 1; $x |= 8; $x"), 9);
        t.equivalent(testit("my $x = 1; $x ^= 8; $x"), 9);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('kuma', function (t) {
    try {
    t.equivalent(testit("my $i=0; my $n= 0;while $i<10 { $n+=$i; $i++; }; $n"), 45);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('make array', function (t) {
    try {
        t.equivalent(testit("[1,2,3]"), [1,2,3]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('make hash', function (t) {
    try {
        t.equivalent(testit("my $x = {1:2}; $x"), {1:2});
        t.equivalent(testit("my $x = {}; $x"), {});
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('range', function (t) {
    try {
        t.equivalent(testit("1..10"), [1,2,3,4,5,6,7,8,9,10]);
        t.equivalent(testit("8..10"), [8,9,10]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('lambda', function (t) {
    try {
        t.equivalent(typeof(testit("-> { }")), 'function');
        t.equivalent(testit("(1..3).map(-> $x { return $x * 3 })"), [3,6,9]);
        t.equivalent(testit("(1..3).map(-> { return $_ * 3 })"), [3,6,9]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('...', function (t) {
    var ok = 0;
    try {
        testit("...");
    } catch (e) {
        t.equivalent(e, 'Unimplemented');
        ok++;
    }
    t.ok(ok);
    t.end();
});

tap.test('string', function (t) {
    try {
        t.equivalent(testit("'hoge'"), 'hoge');
        t.equivalent(testit('"hoge"'), 'hoge');
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('?:', function (t) {
    try {
        t.equivalent(testit('1?2:3'), 2);
        t.equivalent(testit('0?2:3'), 3);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('bit ops', function (t) {
    try {
        t.equivalent(testit('1^3'), 2);
        t.equivalent(testit('1|3'), 3);
        t.equivalent(testit('1&3'), 1);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('qw', function (t) {
    try {
        t.equivalent(testit('qw/1 2 3/'), ['1','2','3']);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('--/++', function (t) {
    try {
        t.equivalent(testit('my $i=0; $i++'), 0);
        t.equivalent(testit('my $i=0; $i++; $i'), 1);
        t.equivalent(testit('my $i=0; ++$i'), 1);
        t.equivalent(testit('my $i=0; ++$i; $i'), 1);

        t.equivalent(testit('my $i=0; $i--'), 0);
        t.equivalent(testit('my $i=0; $i--; $i'), -1);
        t.equivalent(testit('my $i=0; --$i'), -1);
        t.equivalent(testit('my $i=0; --$i; $i'), -1);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('for', function (t) {
    try {
        t.equivalent(testit('my $n=0; for (my $i=0; $i<=10; $i++) { $n += $i } $n'), 55);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('square', function (t) {
    try {
        t.equivalent(testit("sub square($x) { return $x**2 }; square(5)"), 25);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('euler', function (t) {
    try {
        t.equivalent(testit("(1..999).grep(-> { return !($_ % 3 && $_ % 5) }).sum()"), 233168);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('postfix if/unless', function (t) {
    try {
        t.equivalent(testit("my $i=0; $i++ unless 1; $i"), 0);
        t.equivalent(testit("my $i=0; $i++ unless 0; $i"), 1);
        t.equivalent(testit("my $i=0; $i++ if 1; $i"), 1);
        t.equivalent(testit("my $i=0; $i++ if 0; $i"), 0);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('postfix while', function (t) {
    try {
        t.equivalent(testit("my $i=10; $i-- while $i>0; $i"), 0);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('postfix for', function (t) {
    try {
        t.equivalent(testit("my $i=0; $i += $_ for 1..10; $i"), 55);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('foreach', function (t) {
    try {
        t.equivalent(testit("my $i=0; for 1..10 -> $_ { $i+= $_ } $i"), 55);
        t.equivalent(testit("(1..10).sum()"), 55);
        t.equivalent(testit("my $r=[]; for {a:1, b:2} -> $k, $v { $r.push($k) } $r"), ['a', 'b']);
        t.equivalent(testit("my $r=[]; for {a:1, b:2} -> $k, $v { $r.push($v) } $r"), [1, 2]);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('last/next', function (t) {
    try {
        t.equivalent(testit("my $i=0; for 1..10 -> $_ { $i += $_; last if $_>5 } $i"), 21);
        t.equivalent(testit("my $i=0; for 1..10 -> $_ { next if $_ % 2; $i+= $_ } $i"), 30);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('regexp match', function (t) {
    try {
        t.equivalent(testit("!!('hoge' =~ qr/o/)"), true);
        t.equivalent(testit("!!('hoge' !~ qr/o/)"), false);
        t.equivalent(testit("!!('hoge' =~ qr/O/)"), false);
        t.equivalent(testit("!!('hoge' =~ qr/O/i)"), true);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('sprintf', function (t) {
    try {
        t.equivalent(testit("sprintf('%03d', 5)"), '005');
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('int', function (t) {
    try {
        t.equivalent(testit("int('3')"), 3);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('Class', function (t) {
    try {
        t.equivalent(testit("class Foo { }; typeof(Foo)"), 'function');
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('use', function (t) {
    try {
        t.equivalent(testit("use fs; fs"), require('fs'));
        t.equivalent(testit("use fs qw/realpath/; realpath"), require('fs').realpath);
        t.equivalent(testit("use fs {'watch': 'look'}; look"), require('fs').watch);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('oct', function (t) {
    try {
        t.equivalent(testit('oct("777")'), 511);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('hex', function (t) {
    try {
        t.equivalent(testit('0xdeadbeef'), 3735928559);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('labeled', function (t) {
    try {
        t.equivalent(testit('LOOP: while (1) { while (1) { last LOOP; } }; 4649'), 4649);
        t.equivalent(testit('LOOP: for 1..1000 -> $i { for 1..1000 -> { last LOOP; } }; 5963'), 5963);
        t.equivalent(testit('LOOP: for (my $i=0; $i<10; $i++) { for (my $j=0; $j<100000000000; $j++) { last LOOP; } }; 5963'), 5963);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('sub', function (t) {
    try {
        t.equivalent(testit('"hoge".substr(1,2)'), 'og');
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('cmp', function (t) {
    try {
        t.equivalent(testit('1 <=> 0'), 1);
        t.equivalent(testit('0 <=> 0'), 0);
        t.equivalent(testit('0 <=> 1'), -1);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('parsing', function (t) {
    try {
        t.equivalent(testit('my $foo=1\n+2\n$foo'), 3);
        t.equivalent(testit('my $foo="foo".toUpperCase()\n.toLowerCase()\n$foo'), 'foo');
    } catch (e) { t.fail(e); }
    t.end();
});

// same behaviour between perl
tap.test('int', function (t) {
    try {
        t.equivalent(testit('int(0)'), 0);
        t.equivalent(testit('int(0.1)'), 0);
        t.equivalent(testit('int(0.9)'), 0);
        t.equivalent(testit('int(1)'), 1);
        t.equivalent(testit('int(-0.1)'), 0);
        t.equivalent(testit('int(-0.9)'), 0);
        t.equivalent(testit('int(-1)'), -1);
        t.equivalent(testit('int(-1.1)'), -1);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('default arguments', function (t) {
    try {
        t.equivalent(testit('sub foo($n=3) { $n }; foo()'), 3);
        t.equivalent(testit('sub foo($n=3) { $n }; foo(5)'), 5);
        t.equivalent(testit('sub foo($n=3,$v=7) { $v }; foo()'), 7);
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('heredoc', function (t) {
    try {
        t.equivalent(testit("<<'...';\nhogehoge\nfugafuga\n..."), "hogehoge\nfugafuga\n");
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('$1', function (t) {
    try {
        t.equivalent(testit("'hoge' =~ /h(.)/; $1"), "o");
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('class new', function (t) {
    try {
        t.equivalent(testit("class Foo { static sub new() { self.bless({}) } sub yay() { 'YAY' } } Foo.new().yay()"), "YAY");
    } catch (e) { t.fail(e); }
    t.end();
});

tap.test('inheritance', function (t) {
    try {
        t.equivalent(testit("class Bar { static sub new () { self.bless({}) } sub yo() { 'YO!' } } class Foo is Bar { static sub new() { self.bless({}) } sub yay() { 'YAY' } } Foo.new().yo()"), "YO!");
    } catch (e) { t.fail(e); }
    t.end();
});

function testit(src) {
    var runner = new Runner();
    return runner.runString(src);
}

