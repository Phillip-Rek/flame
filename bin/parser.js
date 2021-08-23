"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.token = null;
        this.ast = {
            name: "Program",
            tagName: "",
            attributes: [],
            children: [],
            line: -1,
            col: -1,
        };
        this.openedTagsStack = [this.ast];
        this.status = "html";
        this.errors = [];
        this.parseOpenTagStart = (name) => {
            var _a, _b, _c;
            if (!this.token)
                return;
            this.status = "attr";
            let element = {
                name: name || "HTMLElement",
                tagName: this.token.val.slice(1),
                line: this.token.line,
                col: this.token.col,
                attributes: [],
                children: []
            };
            if (((_a = this.currentElement) === null || _a === void 0 ? void 0 : _a.name) === "SelfClose")
                this.openedTagsStack.pop();
            (_c = (_b = this.currentElement) === null || _b === void 0 ? void 0 : _b.children) === null || _c === void 0 ? void 0 : _c.push(element);
            this.openedTagsStack.push(element);
        };
        this.parseOpenTagEnd = () => {
            this.status = "html";
        };
        this.parseCloseTag = () => {
            if (!this.token) {
                return;
            }
            if (this.currentElement.name === "SelfClose") {
                this.openedTagsStack.pop();
            }
            if (this.token.val === `</${this.currentElement.tagName}>`) {
                this.openedTagsStack.pop();
            }
            else {
                let msg = `[parseCloseTag] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`;
                this.raise(msg);
            }
        };
        this.parseSelfClose = () => {
            this.parseOpenTagStart("SelfClose");
        };
        this.parseAttribute = () => {
            var _a, _b;
            if (!this.token)
                return;
            //there might exist text that looks like 
            //an attribute in the innerHTML
            if (this.status === "html") {
                (_b = (_a = this.currentElement) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.push({
                    name: "Text",
                    val: this.token.val,
                    line: this.token.line,
                    col: this.token.col
                });
            }
            else if (this.currentElement.attributes) {
                this.currentElement.attributes.push(this.token.val);
            }
        };
        this.parseScript = () => {
            this.parseText();
        };
        this.parseText = (name) => {
            var _a, _b, _c, _d, _e, _f;
            if (!this.token)
                return;
            let astNode = {
                name: name || "Text",
                val: (_a = this.token) === null || _a === void 0 ? void 0 : _a.val,
                line: (_b = this.token) === null || _b === void 0 ? void 0 : _b.line,
                col: (_c = this.token) === null || _c === void 0 ? void 0 : _c.col
            };
            if (((_d = this.currentElement) === null || _d === void 0 ? void 0 : _d.name) === "SelfClose")
                this.openedTagsStack.pop();
            (_f = (_e = this.currentElement) === null || _e === void 0 ? void 0 : _e.children) === null || _f === void 0 ? void 0 : _f.push(astNode);
        };
        this.parseForStatement = () => {
            this.parseStatement("ForStatement");
        };
        this.parseIfStatement = () => {
            this.parseStatement("IfStatement");
        };
        this.parseStatement = (name) => {
            var _a, _b, _c, _d, _e;
            if (!this.token)
                return;
            let astNode = {
                name: name,
                predicate: (_a = this.token) === null || _a === void 0 ? void 0 : _a.val,
                line: (_b = this.token) === null || _b === void 0 ? void 0 : _b.line,
                col: (_c = this.token) === null || _c === void 0 ? void 0 : _c.col,
                children: []
            };
            (_e = (_d = this.currentElement) === null || _d === void 0 ? void 0 : _d.children) === null || _e === void 0 ? void 0 : _e.push(astNode);
            this.openedTagsStack.push(astNode);
        };
        this.parseEndFor = () => {
            if (!this.token)
                return;
            if (this.currentElement.name === "SelfClose") {
                this.openedTagsStack.pop();
            }
            if (this.currentElement.name === "ForStatement") {
                this.openedTagsStack.pop();
            }
            else {
                let msg = `[parseEndFor] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`;
                this.raise(msg);
            }
        };
        this.parseEndIf = () => {
            if (!this.token)
                return;
            if (this.currentElement.name === "SelfClose") {
                this.openedTagsStack.pop();
            }
            if (this.currentElement.name === "IfStatement") {
                this.openedTagsStack.pop();
            }
            else {
                let msg = `[parseEndIf] 
            Close tag, ${this.token.val} does not match an open tag,  
            ${this.currentElement.tagName}, 
            at line ${this.token.line}, 
            col ${this.token.col}`;
                this.raise(msg);
            }
        };
        this.parseDocType = () => {
            this.parseText();
        };
        this.parseDynamicData = () => {
            this.parseText("DynamicData");
        };
        for (let i = 0; i < this.tokens.length; i++) {
            this.token = tokens[i];
            //@ts-ignore
            if (this[`parse${this.token.type}`]) {
                //@ts-ignore
                this[`parse${this.token.type}`]();
            }
            else {
                this.raise("[Parser] Cannot parse token: " + this.token.type);
            }
        }
    }
    get currentElement() {
        return this.openedTagsStack[this.openedTagsStack.length - 1];
    }
    raise(msg) {
        this.errors.push(msg);
    }
}
exports.Parser = Parser;
