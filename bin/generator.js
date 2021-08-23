"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = void 0;
class Generator {
    constructor(ast, data) {
        this.ast = ast;
        this.data = data;
        this.errors = [];
        this.output = ``;
        this.initGlobals = () => {
            let globals = Object.entries(this.data);
            for (let i = 0; i < globals.length; i++) {
                const key = globals[i][0];
                const val = globals[i][1];
                this.output += `let ${key} = data.${key}\n`;
            }
        };
        this.genChildren = (node) => {
            if (node === undefined)
                return;
            //@ts-ignore
            for (const child of node.children) {
                //@ts-ignore
                if (this[`gen${child.name}`]) {
                    //@ts-ignore
                    this[`gen${child.name}`](child);
                }
            }
        };
        this.genHTMLElement = (element) => {
            this.output += `template += \`<${element.tagName}\`\n`;
            if (element.attributes.length !== 0)
                this.genAttributes(element);
            else
                this.output += `template += ">"\n`;
            if (element.name === "SelfClose")
                return;
            this.genChildren(element);
            this.output += `template += \`</${element.tagName}>\`\n`;
        };
        this.genAttributes = (element) => {
            this.output += `template += \` ${element.attributes.join(" ")}>\`\n`;
        };
        this.genText = (node) => {
            this.output += `template += \`${node.val}\`\n`;
        };
        this.genDynamicData = (node) => {
            let data = node.val.slice(2, -2).trim();
            this.output += `template += ${data};\n`;
        };
        this.genForStatement = (node) => {
            let predicate = node.predicate.slice(2, -2).trim();
            this.output += "\n" + predicate + "{\n";
            this.genChildren(node);
            this.output += "\n}\n";
        };
        this.genIfStatement = (node) => {
            let predicate = node.predicate.slice(2, -2).trim();
            this.output += "\n" + predicate + "{\n";
            this.genChildren(node);
            this.output += "\n}\n";
        };
        this.genSelfClose = (node) => {
            this.genHTMLElement(node);
        };
        this.initGlobals();
        if (ast.name === "Program")
            this.init();
        else
            this.raise("[Generator] AST is corrupted");
    }
    init(node) {
        node || (node = this.ast);
        for (const child of node.children) {
            //@ts-ignore
            if (this[`gen${child.name}`]) {
                //@ts-ignore
                this[`gen${child.name}`](child);
            }
        }
        this.output += "return template;\n";
    }
    raise(msg) {
        this.errors.push(msg);
    }
}
exports.Generator = Generator;
