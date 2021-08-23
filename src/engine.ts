import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Generator } from "./generator"
import * as fs from "fs"

let template: Function

function render(srcCode: string, data: {}) {
    if (template && process.env.NODE_ENV === "production") return template("", data)

    console.log("compiled")
    const lexer = new Lexer(srcCode)
    let tokens = lexer.tokens

    const parser = new Parser(tokens)
    let ast = parser.ast

    const gen = new Generator(ast, data)
    let output = gen.output

    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        console.log(lexer.error)
        console.log(parser.errors)
        console.log(gen.errors)
    }

    template = new Function("template", "data", output)
    return template("", data)
}

export function engine(
    filePath: string,
    data: {},
    callback: (arg: any, arg2?: any) => string
) {
    fs.readFile(filePath, { encoding: "utf8" }, (err, content) => {
        if (err) return callback(err);
        let res = render(content, data);
        return callback(null, res);
    });
}
