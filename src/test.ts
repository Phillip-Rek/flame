import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Generator } from "./generator"


// const src = `
// {% for(let post of posts) %}
// <div class="post">
//     <img loading="lazy" width="300px" alt="nothing">
//     <div class="post-details">
//         <a>
//             <b>{{ post.title }}</b>
//         </a>
//         <p>{{ post.description }}</p>
//         <span>{{ post.date }}</span>
//         <form action="\${domainName}/posts/\${post.slug}" method="get">
//             <button class="special-button">Read More</button>
//         </form>
//     </div>
// </div>
// {% end_for %}
// `

const src = `
{% if(age !== 18 && 5 === 5 || 10 < 11) %}
    <h1>You are {{ age }} years old</h1>
{% end_if %}
`

const posts = [
    {
        title: "Post 1",
        description: "post 1 desc",
        date: "1 jan 2021",
        slug: "post-1"
    },
    {
        title: "Post 2",
        description: "post 2 desc",
        date: "20 jan 2021",
        slug: "post-2"
    }
]

let lexer = new Lexer(src)

let parser = new Parser(lexer.tokens)

let gen = new Generator(parser.ast, { age: 19 })

console.log(gen.output)
