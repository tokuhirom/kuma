/*jslint node: true, es5: true, evil: true */
"use strict";

var Parser = require("./parser.js").Kuma.Parser,
    Scanner = require("./scanner.js").Kuma.Scanner,
    Translator = require("./translator.js").Kuma.Translator,
    Builtins = require("./runtime.js").Kuma.Builtins,
    Runtime = require("./runtime.js").Kuma.Runtime,
    Module = require('module'),
    fs = require('fs'),
    Kuma = {
        "Builtins": Builtins,
        "Runtime":Runtime
    };

function Runner() {
}
Runner.prototype.compile = function (src) {
    var parser = new Parser(src);
    if (this.dump_token) {
        for (var i=0, l=parser.tokens.length; i<l; ++i) {
            console.log([
                Scanner.id2name[parser.tokens[i][0]],
                parser.tokens[i][1],
                parser.tokens[i][2]
            ]);
        }
    }
    var ast = parser.parse();
    if (this.dump_ast) {
        console.log(JSON.stringify(ast));
    }
    var translator = new Translator();
    var js = translator.translate(ast);
    if (this.dump_js) {
        console.log(js);
    }
    Kuma.Runtime.initialize();
    return js;
};
Runner.prototype.runString = function (src) {
    var js = this.compile(src);
    return eval(js);
};
Runner.prototype.runFile = function (fname) {
    var src = fs.readFileSync(fname, 'utf-8');

    // replace require. It makes base point for require is .tra file.
    var sandbox_module = new Module(fname);
    var require = function (path) {
        return Module._load(path, sandbox_module, true);
    };
    var js = this.compile(src);
    return eval(js);
};

module.exports = Runner;
