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
exports.Lexer = void 0;
const fs = __importStar(require("fs"));
const for_reg = /{%[ ]*for\([ \s]*let[ \s]+[\w_\*]+[ \s]+of[ \s]+[\w_\*]+\)[ \s]+%}/;
const end_for_reg = /{% end_for %}/;
const empty_reg = /{% empty %}/;
const dynamic_data_reg = /{{[ \s]*[ \s\w_\.\,\-\[\]\)\(\|_\&\$'"\+\?\=\:\;]+[ \s]*}}/;
const if_reg = /{%[ ]*if[ \s]*\([ \s]*[\w_\*=>< \s"'\|\&\[\]\.\!]+[ \s]*\)[ \s]*%}/;
const end_if_reg = /{% end_if %}/;
const open_tag_start_reg = /<[\w-.,%$#@+-=]+/;
const close_tag_reg = /<\/[\w-.,% $#@+-=]+>/;
const attr_reg = /[\w-_\*]+="[ \/\w=\+\.\{\}\[\]_\)\(\?><\:\;\\,~`!\@\#\$\%\^\&\*-]*"/;
const attr_reg_2 = /[\w-_\*]+='[\w=\+\._\)\(\?><\:\;,~`!@#$%^&\*-]*'/;
const text_reg = /[ \w"'=\(\)!&\^%\$#@\-_+\\\|/\;\:,\.?\[\]>]+/;
const doc_type_reg = "<!DOCTYPE html>";
const self_close_reg = /(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|<command|<keygen|<menuitem)/;
const includes_reg = /{% include[ \s]*\([ \s]*"[ \w\-\_\=\/\+\.\<\>\$\#\@]+"[ \s]*\) %}/;
class Lexer {
    constructor(src) {
        this.src = src;
        this.tokens = [];
        this.cursor = 0;
        this.error = [];
        this.line = 1;
        this.col = 0;
        this.token = null;
        this.eat = (token) => {
            this.cursor += token.length;
            this.col += token.length;
            this.src = this.src.substr(token.length);
        };
        this.skipLine = () => {
            this.cursor += "\n".length;
            this.line++;
            this.col = 0;
            this.src = this.src.substr("\n".length);
        };
        this.is = (query) => { var _a; return this.has(query) && ((_a = this.src.match(query)) === null || _a === void 0 ? void 0 : _a.index) === 0; };
        this.skipWhiteSpace = () => {
            const whiteS = this.src.match(/[ \s]+/);
            const val = whiteS && whiteS[0] || "";
            this.eat(val);
        };
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
                case this.openTagEnd:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.endLine:
                    {
                        this.skipLine();
                    }
                    break;
                case this.whiteSpace:
                    {
                        this.skipWhiteSpace();
                    }
                    break;
                case this.attribute:
                case this.text:
                case this.docType:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.includes:
                    {
                        this.handleIncludes();
                    }
                    break;
                default:
                    {
                        const msg = `[Lexer] Unexpected character, ${this.src[0]}, at line ${this.line}, col ${this.col}...src: ${this.src.slice(0, 50)}`;
                        this.error.push(msg);
                    }
                    break;
            }
        }
        // console.log(this.tokens)
    }
    get includes() {
        return this.is(includes_reg);
    }
    handleIncludes() {
        const match = this.src.match(includes_reg);
        const val = match && match[0] || "";
        const file = val.slice(val.indexOf('"') + 1, val.lastIndexOf('"')).trim();
        const code = fs.readFileSync(file, { encoding: "utf8" });
        const lex = new Lexer(code);
        this.error = this.error.concat(lex.error);
        this.tokens = this.tokens.concat(lex.tokens);
        this.eat(val);
    }
    tokenPush() {
        if (!this.token) {
            let msg = `[tokenPush] Expected a token but got null, 
                ${this.src[0]}, at line ${this.line}, col ${this.col}`;
            this.error.push(msg);
            return;
        }
        this.tokens.push(this.token);
        this.eat(this.token.val);
    }
    correctCol() {
        if (this.token)
            this.col = this.token.val.slice(this.token.val.lastIndexOf("\n") + 1).length;
    }
    has(str) {
        return this.src.search(str) !== -1;
    }
    get forStatenemt() {
        if (!this.is(for_reg))
            return false;
        const match = this.src.match(for_reg);
        const val = match && match[0] || "";
        this.createToken("ForStatement", val);
        return true;
    }
    get dynamicData() {
        if (!this.is(dynamic_data_reg))
            return false;
        const match = this.src.match(dynamic_data_reg);
        const val = match && match[0] || "";
        this.createToken("DynamicData", val);
        return true;
    }
    get endFor() {
        if (!this.is(end_for_reg))
            return false;
        const match = this.src.match(end_for_reg);
        const val = match && match[0] || "";
        this.createToken("EndFor", val);
        return true;
    }
    get ifStatement() {
        if (!this.is(if_reg))
            return false;
        const match = this.src.match(if_reg);
        const val = match && match[0] || "";
        this.createToken("IfStatement", val);
        return true;
    }
    get openTagStart() {
        if (!this.is(open_tag_start_reg))
            return false;
        const match = this.src.match(open_tag_start_reg);
        const val = match && match[0] || "";
        this.createToken("OpenTagStart", val);
        return true;
    }
    get selfClose() {
        if (!this.is(self_close_reg))
            return false;
        const match = this.src.match(self_close_reg);
        const val = match && match[0] || "";
        this.createToken("SelfClose", val);
        return true;
    }
    get empty() {
        if (!this.is(empty_reg))
            return false;
        const match = this.src.match(empty_reg);
        const val = match && match[0] || "";
        this.createToken("Empty", val);
        return true;
    }
    get docType() {
        if (!this.is(doc_type_reg))
            return false;
        const match = this.src.match(doc_type_reg);
        const val = match && match[0] || "";
        this.createToken("DocType", val);
        return true;
    }
    get openTagEnd() {
        if (!this.is(">"))
            return false;
        const match = this.src.match(">");
        const val = match && match[0] || "";
        this.createToken("OpenTagEnd", val);
        return true;
    }
    get closeTag() {
        if (!this.is(close_tag_reg))
            return false;
        const match = this.src.match(close_tag_reg);
        const val = match && match[0] || "";
        this.createToken("CloseTag", val);
        return true;
    }
    get endIf() {
        if (!this.is(end_if_reg))
            return false;
        const match = this.src.match(end_if_reg);
        const val = match && match[0] || "";
        this.createToken("EndIf", val);
        return true;
    }
    get text() {
        if (!this.is(text_reg))
            return false;
        const match = this.src.match(text_reg);
        const val = match && match[0] || "";
        this.createToken("Text", val);
        return true;
    }
    get attribute() {
        // console.log(this.src.match(attr_reg))
        if (this.is(attr_reg)) {
            const match = this.src.match(attr_reg);
            const val = match && match[0] || "";
            this.createToken("Attribute", val);
            return true;
        }
        else if (this.is(attr_reg_2)) {
            const match = this.src.match(attr_reg_2);
            const val = match && match[0] || "";
            this.createToken("Attribute", val);
            return true;
        }
        return false;
    }
    get script() {
        if (!this.is("<script"))
            return false;
        const val = this.src.slice(0, this.src.indexOf("</script>") + "</script>".length);
        this.createToken("Script", val);
        if (val.search("\n") !== -1) {
            this.line += val.split("\n").length - 1;
        }
        return true;
    }
    get whiteSpace() {
        return this.is(/[ \s]+/);
    }
    get endLine() {
        var _a;
        if (!this.has("\n"))
            return false;
        if (((_a = this.src.match("\n")) === null || _a === void 0 ? void 0 : _a.index) !== 0)
            return false;
        return true;
    }
    createToken(type, val) {
        this.token = {
            type: type,
            line: this.line,
            col: this.col,
            val
        };
    }
    get eof() {
        return this.src[0] === undefined;
    }
}
exports.Lexer = Lexer;
