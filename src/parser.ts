import { Token } from "./lexer"
import * as fs from "fs"

export declare type HTMLElement = {
    name: string,
    tagName: string,
    attributes: Array<string>,
    children: Array<HTMLElement | TextNode | Statement>,
    line: number,
    col: number,
}

export declare type Statement =
    Partial<HTMLElement> & {
        predicate: string
    }

export declare type TextNode = {
    name: string,
    val: string,
    line: number,
    col: number,
}

export class Parser {
    private token: Token | null = null;

    ast = {
        name: "Program",
        tagName: "",
        attributes: [],
        children: [],
        line: -1,
        col: -1,
    }

    private openedTagsStack: Array<HTMLElement | Statement> = [this.ast]

    status: ("html" | "attr") = "html"

    errors: Array<string> = []

    private get currentElement(): (HTMLElement | Statement) {
        return this.openedTagsStack[this.openedTagsStack.length - 1]
    }

    constructor(private tokens: Array<Token>) {
        for (let i = 0; i < this.tokens.length; i++) {
            this.token = tokens[i];
            //@ts-ignore
            if (this[`parse${this.token.type}`]) {
                //@ts-ignore
                this[`parse${this.token.type}`]()
            }
            else {
                this.raise("[Parser] Cannot parse token: " + this.token.type)
            }
        }
    }

    raise(msg: string) {
        this.errors.push(msg)
    }

    private parseOpenTagStart = (name: string) => {
        if (!this.token) return

        this.status = "attr"

        let element: HTMLElement = {
            name: name || "HTMLElement",
            tagName: this.token.val.slice(1),
            line: this.token.line,
            col: this.token.col,
            attributes: [],
            children: []
        }

        if (this.currentElement?.name === "SelfClose")
            this.openedTagsStack.pop()
        this.currentElement?.children?.push(element)
        this.openedTagsStack.push(element)
    }

    private parseOpenTagEnd = () => {
        this.status = "html"
    }

    private parseCloseTag = () => {
        if (!this.token) { return }

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.token.val === `</${this.currentElement.tagName}>`) {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseCloseTag] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`
            this.raise(msg)
        }
    }

    private parseSelfClose = () => {
        this.parseOpenTagStart("SelfClose")
    }

    private parseAttribute = () => {
        if (!this.token) return

        //there might exist text that looks like 
        //an attribute in the innerHTML
        if (this.status === "html") {
            this.currentElement?.children?.push({
                name: "Text",
                val: this.token.val,
                line: this.token.line,
                col: this.token.col
            })
        }
        else if (this.currentElement.attributes) {
            this.currentElement.attributes.push(this.token.val)
        }

    }

    private parseScript = () => {
        this.parseText()
    }

    private parseText = (name?: string) => {
        if (!this.token) return

        let astNode: TextNode = {
            name: name || "Text",
            val: this.token?.val,
            line: this.token?.line,
            col: this.token?.col
        }

        if (this.currentElement?.name === "SelfClose")
            this.openedTagsStack.pop()

        this.currentElement?.children?.push(astNode)
    }

    parseForStatement = () => {
        this.parseStatement("ForStatement")
    }

    parseIfStatement = () => {
        this.parseStatement("IfStatement")
    }

    parseStatement = (name: string) => {
        if (!this.token) return

        let astNode: Statement = {
            name: name,
            predicate: this.token?.val,
            line: this.token?.line,
            col: this.token?.col,
            children: []
        }

        this.currentElement?.children?.push(astNode)

        this.openedTagsStack.push(astNode)
    }

    parseEndFor = () => {
        if (!this.token) return

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.currentElement.name === "ForStatement") {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseEndFor] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`
            this.raise(msg)
        }
    }

    parseEndIf = () => {
        if (!this.token) return

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.currentElement.name === "IfStatement") {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseEndIf] 
            Close tag, ${this.token.val} does not match an open tag,  
            ${this.currentElement.tagName}, 
            at line ${this.token.line}, 
            col ${this.token.col}`
            this.raise(msg)
        }
    }

    parseDocType = () => {
        this.parseText()
    }

    parseDynamicData = () => {
        this.parseText("DynamicData")
    }

}

