import { HTMLElement, Statement, TextNode } from "./parser"

export class Generator {
    errors: string[] = []
    output = ``;

    constructor(private ast: HTMLElement, private data: {}) {

        this.initGlobals()

        if (ast.name === "Program")
            this.init()
        else
            this.raise("[Generator] AST is corrupted")
    }

    private initGlobals = () => {
        let globals = Object.entries(this.data)

        for (let i = 0; i < globals.length; i++) {
            const key = globals[i][0];
            const val = globals[i][1]
            this.output += `let ${key} = data.${key}\n`
        }
    }

    private init(node?: HTMLElement) {
        node ||= this.ast

        for (const child of node.children) {
            //@ts-ignore
            if (this[`gen${child.name}`]) {
                //@ts-ignore
                this[`gen${child.name}`](child)
            }
        }

        this.output += "return template;\n"

    }

    private genChildren = (node: HTMLElement | Statement) => {
        if (node === undefined) return

        //@ts-ignore
        for (const child of node.children) {
            //@ts-ignore
            if (this[`gen${child.name}`]) {
                //@ts-ignore
                this[`gen${child.name}`](child)
            }
        }
    }

    private genHTMLElement = (element: HTMLElement) => {
        this.output += `template += \`<${element.tagName}\`\n`

        if (element.attributes.length !== 0)
            this.genAttributes(element)
        else this.output += `template += ">"\n`

        if (element.name === "SelfClose") return

        this.genChildren(element)

        this.output += `template += \`</${element.tagName}>\`\n`
    }

    private genAttributes = (element: HTMLElement) => {
        this.output += `template += \` ${element.attributes.join(" ")}>\`\n`
    }

    private genText = (node: TextNode) => {
        this.output += `template += \`${node.val}\`\n`
    }

    private genDynamicData = (node: TextNode) => {
        let data = node.val.slice(2, -2).trim()
        this.output += `template += ${data};\n`
    }

    private genForStatement = (node: Statement) => {
        let predicate = node.predicate.slice(2, -2).trim()

        this.output += "\n" + predicate + "{\n"
        this.genChildren(node)

        this.output += "\n}\n"
    }

    private genIfStatement = (node: Statement) => {
        let predicate = node.predicate.slice(2, -2).trim()

        this.output += "\n" + predicate + "{\n"
        this.genChildren(node)

        this.output += "\n}\n"
    }

    private genSelfClose = (node: HTMLElement) => {
        this.genHTMLElement(node)
    }

    private raise(msg: string) {
        this.errors.push(msg)
    }
}

