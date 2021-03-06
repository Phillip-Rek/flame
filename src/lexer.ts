import * as fs from "fs"

export declare type Token = {
    type: string,
    line: number,
    col: number,
    val: string
}

const for_reg: RegExp = /{%[ ]*for\([ \s]*let[ \s]+[\w_\*]+[ \s]+of[ \s]+[\w_\*]+\)[ \s]+%}/
const end_for_reg = /{% end_for %}/
const empty_reg = /{% empty %}/

const dynamic_data_reg = /{{[ \s]*[ \s\w_\.\,\-\[\]\)\(\|_\&\$'"\+\?\=\:\;]+[ \s]*}}/;
const if_reg = /{%[ ]*if[ \s]*\([ \s]*[\w_\*=>< \s"'\|\&\[\]\.\!]+[ \s]*\)[ \s]*%}/
const end_if_reg = /{% end_if %}/

const open_tag_start_reg = /<[\w-.,%$#@+-=]+/
const close_tag_reg = /<\/[\w-.,% $#@+-=]+>/
const attr_reg = /[\w-_\*]+="[ \/\w=\+\.\{\}\[\]_\)\(\?><\:\;\\,~`!\@\#\$\%\^\&\*-]*"/
const attr_reg_2 = /[\w-_\*]+='[\w=\+\._\)\(\?><\:\;,~`!@#$%^&\*-]*'/

const text_reg = /[ \w"'=\(\)!&\^%\$#@\-_+\\\|/\;\:,\.?\[\]>]+/

const doc_type_reg = "<!DOCTYPE html>";
const self_close_reg = /(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|<command|<keygen|<menuitem)/;

const includes_reg = /{% include[ \s]*\([ \s]*"[ \w\-\_\=\/\+\.\<\>\$\#\@]+"[ \s]*\) %}/

export class Lexer {
    tokens: Array<Token> = []
    private cursor: number = 0;
    error: Array<string> = []
    private line = 1
    private col = 0
    private token: Token | null = null;
    constructor(private src: string) {
        while (!this.error.length && !this.eof) {
            switch (true) {
                case this.forStatenemt:
                case this.endFor:
                case this.empty:
                case this.ifStatement:
                case this.endIf:
                case this.dynamicData:
                case this.script:
                case this.selfClose:
                case this.closeTag:
                case this.openTagStart:
                case this.openTagEnd: { this.tokenPush() } break;
                case this.endLine: { this.skipLine() } break;
                case this.whiteSpace: { this.skipWhiteSpace() } break;
                case this.attribute:
                case this.text:
                case this.docType: { this.tokenPush() } break;
                case this.includes: { this.handleIncludes() } break;
                default: {
                    const msg = `[Lexer] Unexpected character, ${this.src[0]}, at line ${this.line}, col ${this.col}...src: ${this.src.slice(0, 50)}`
                    this.error.push(msg)
                } break;
            }
        }

        // console.log(this.tokens)
    }

    private get includes() {
        return this.is(includes_reg);
    }

    private handleIncludes() {
        const match = this.src.match(includes_reg)
        const val = match && match[0] || ""
        const file = val.slice(val.indexOf('"') + 1, val.lastIndexOf('"')).trim()
        const code = fs.readFileSync(file, { encoding: "utf8" })
        const lex = new Lexer(code)
        this.error = this.error.concat(lex.error)
        this.tokens = this.tokens.concat(lex.tokens)
        this.eat(val)
    }

    private tokenPush() {
        if (!this.token) {
            let msg =
                `[tokenPush] Expected a token but got null, 
                ${this.src[0]}, at line ${this.line}, col ${this.col}`
            this.error.push(msg);
            return;
        }
        this.tokens.push(this.token)
        this.eat(this.token.val)
    }

    private correctCol() {
        if (this.token)
            this.col = this.token.val.slice(this.token.val.lastIndexOf("\n") + 1).length
    }

    private has(str: string | RegExp) {
        return this.src.search(str) !== -1;
    }

    private eat = (token: string) => {
        this.cursor += token.length;
        this.col += token.length;
        this.src = this.src.substr(token.length)
    }

    private skipLine = () => {
        this.cursor += "\n".length;
        this.line++;
        this.col = 0;
        this.src = this.src.substr("\n".length)
    }

    private is = (query: RegExp | string) =>
        this.has(query) && this.src.match(query)?.index === 0

    private get forStatenemt(): boolean {
        if (!this.is(for_reg)) return false;

        const match = this.src.match(for_reg)
        const val = match && match[0] || ""
        this.createToken("ForStatement", val)
        return true;
    }

    private get dynamicData() {
        if (!this.is(dynamic_data_reg)) return false;

        const match = this.src.match(dynamic_data_reg)
        const val = match && match[0] || ""
        this.createToken("DynamicData", val)
        return true;
    }

    private get endFor() {
        if (!this.is(end_for_reg)) return false

        const match = this.src.match(end_for_reg)
        const val = match && match[0] || ""
        this.createToken("EndFor", val)
        return true;
    }

    private get ifStatement() {
        if (!this.is(if_reg)) return false

        const match = this.src.match(if_reg)
        const val = match && match[0] || ""
        this.createToken("IfStatement", val)
        return true
    }

    private get openTagStart() {
        if (!this.is(open_tag_start_reg)) return false
        const match = this.src.match(open_tag_start_reg)
        const val = match && match[0] || ""
        this.createToken("OpenTagStart", val)
        return true
    }

    private get selfClose() {
        if (!this.is(self_close_reg)) return false

        const match = this.src.match(self_close_reg)
        const val = match && match[0] || ""
        this.createToken("SelfClose", val)
        return true
    }

    private get empty() {
        if (!this.is(empty_reg)) return false

        const match = this.src.match(empty_reg)
        const val = match && match[0] || ""
        this.createToken("Empty", val)
        return true
    }

    private get docType() {
        if (!this.is(doc_type_reg)) return false

        const match = this.src.match(doc_type_reg)
        const val = match && match[0] || ""
        this.createToken("DocType", val)
        return true
    }

    private get openTagEnd() {
        if (!this.is(">")) return false

        const match = this.src.match(">")
        const val = match && match[0] || ""
        this.createToken("OpenTagEnd", val)
        return true
    }

    private get closeTag() {
        if (!this.is(close_tag_reg)) return false

        const match = this.src.match(close_tag_reg)
        const val = match && match[0] || ""
        this.createToken("CloseTag", val)
        return true
    }

    private get endIf() {
        if (!this.is(end_if_reg)) return false

        const match = this.src.match(end_if_reg)
        const val = match && match[0] || ""
        this.createToken("EndIf", val)
        return true
    }

    private get text() {
        if (!this.is(text_reg)) return false

        const match = this.src.match(text_reg)
        const val = match && match[0] || ""
        this.createToken("Text", val)
        return true
    }

    private get attribute() {
        // console.log(this.src.match(attr_reg))
        if (this.is(attr_reg)) {
            const match = this.src.match(attr_reg)
            const val = match && match[0] || ""
            this.createToken("Attribute", val)
            return true
        }
        else if (this.is(attr_reg_2)) {
            const match = this.src.match(attr_reg_2)
            const val = match && match[0] || ""
            this.createToken("Attribute", val)
            return true
        }

        return false
    }

    private get script() {
        if (!this.is("<script")) return false
        const val = this.src.slice(0, this.src.indexOf("</script>") + "</script>".length)
        this.createToken("Script", val)

        if (val.search("\n") !== -1) {
            this.line += val.split("\n").length - 1
        }
        return true
    }

    private get whiteSpace() {
        return this.is(/[ \s]+/);
    }

    private skipWhiteSpace = () => {
        const whiteS = this.src.match(/[ \s]+/)
        const val = whiteS && whiteS[0] || ""
        this.eat(val);
    }

    private get endLine() {
        if (!this.has("\n"))
            return false
        if (this.src.match("\n")?.index !== 0)
            return false
        return true
    }

    private createToken(type: string, val: string) {
        this.token = {
            type: type,
            line: this.line,
            col: this.col,
            val
        }
    }

    private get eof() {
        return this.src[0] === undefined;
    }
}