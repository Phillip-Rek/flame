"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.engine = void 0;
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const generator_1 = require("./generator");
const fs = __importStar(require("fs"));
let template;
function render(srcCode, data) {
    if (template && process.env.NODE_ENV === "production")
        return template("", data);
    console.log("compiled");
    const lexer = new lexer_1.Lexer(srcCode);
    let tokens = lexer.tokens;
    const parser = new parser_1.Parser(tokens);
    let ast = parser.ast;
    const gen = new generator_1.Generator(ast, data);
    let output = gen.output;
    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        console.log(lexer.error);
        console.log(parser.errors);
        console.log(gen.errors);
    }
    template = new Function("template", "data", output);
    return template("", data);
}
function engine(filePath, data, callback) {
    fs.readFile(filePath, { encoding: "utf8" }, (err, content) => {
        if (err)
            return callback(err);
        let res = render(content, data);
        return callback(null, res);
    });
}
exports.engine = engine;
