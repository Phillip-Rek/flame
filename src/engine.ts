import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Generator } from "./generator"
import * as fs from "fs"


const templates: Map<string, Function> = new Map()

// let template: Function

function render(filePath: string, srcCode: string, data: {}) {
    if (templates.get(filePath) && process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "Development") {
        //@ts-ignore
        return templates.get(filePath)("", data)
    }

    console.log("compiled " + filePath)

    const lexer = new Lexer(srcCode)
    let tokens = lexer.tokens

    const parser = new Parser(tokens)
    let ast = parser.ast

    const gen = new Generator(ast, data)
    let output = gen.output

    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        console.error(lexer.error)
        console.error(parser.errors)
        console.error(gen.errors)
    }

    templates.set(filePath, new Function("template", "data", output))
    //@ts-ignore
    return templates.get(filePath)("", data)
}

export function engine(
    filePath: string,
    data: {},
    callback: (arg: any, arg2?: any) => string
) {
    fs.readFile(filePath, { encoding: "utf8" }, (err, content) => {
        if (err) return callback(err);
        let res = render(filePath, content, data);
        return callback(null, res);
    });
}


export function compiler(srcCode: string, data: {}) {
    const lexer = new Lexer(srcCode)
    let tokens = lexer.tokens

    const parser = new Parser(tokens)
    let ast = parser.ast

    const gen = new Generator(ast, data)
    let output = gen.output

    let template = new Function("template", "data", output)
    return template("", data)
}