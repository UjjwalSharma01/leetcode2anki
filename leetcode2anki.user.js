// ==UserScript==
// @name            LeetCode2Anki
// @namespace       LeetCode2Anki - Add solved problem to Anki
// @version         1.0.0
// @description     Add solved problem to Anki for reviewing later
// @homepageURL     https://github.com/krmanik/leetcode2anki
// @supportURL      https://github.com/krmanik/leetcode2anki
// @author          https://github.com/krmanik
// @match           https://leetcode.com/problems/*
// @grant           GM.xmlHttpRequest
// @connect         127.0.0.1
// @license         GPL-2.0
// ==/UserScript==

(function () {
    'use strict';

    const deckName = 'LeetCode';
    const modelName = 'Basic - LeetCode2Anki';
    const language = 'Python';                  // ['C++', 'Java', 'Python', 'Python3', 'C', 'C#', 'JavaScript', 'TypeScript', 'PHP', 'Swift', 'Kotlin', 'Go', 'Ruby', 'Scala', 'Rust']
    const langShortName = 'py';                 // for syntax highlightling, view https://speed-highlight.github.io/core/examples/

    function addButton() {
        const button = document.createElement('button');
        button.innerText = 'Save to Anki';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.right = '10px';
        button.style.zIndex = '1000';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#007BFF';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', handleButtonClick);
        document.body.appendChild(button);
    }

    function getParams() {
        const scriptTag = document.querySelector('script#__NEXT_DATA__');
        let jsonData;
        if (scriptTag) {
            try {
                jsonData = JSON.parse(scriptTag.textContent);
            } catch (error) {
                alert('Error parsing JSON:', error);
                return;
            }
        } else {
            alert('Script tag not found');
            return;
        }

        const question = jsonData.props.pageProps.dehydratedState.queries[1].state.data.question;
        const id = question.questionId;
        const title = question.title
        const titleSlug = question.titleSlug;
        const topicTags = question.topicTags;
        const difficulty = question.difficulty;
        const description = question.content;
        const qCodeSnippets = question.codeSnippets
        let codeSnippets = "";
        for (const c of qCodeSnippets) {
            if (c.lang == language) {
                codeSnippets = c.code;
            }
        }

        const code = monaco.editor.getEditors()[0].getValue();
        const tags = [];
        let tagsData = {};
        for (const tag of topicTags) {
            tags.push(tag.slug);
            tagsData[tag.slug] = tag.name;
        }
        tagsData = JSON.stringify(tagsData);

        let solved = false;

        // console.log({id, title, titleSlug, difficulty, description, codeSnippets, code, tags});
        const svgElement = document.querySelector('svg.text-message-success');
        if (svgElement) {
            solved = true;
        }

        const element = document.querySelector('[data-e2e-locator="console-result"]');
        if (element && element.innerText == "Accepted") {
            solved = true;
        }

        if (question.status) {
            solved = true;
        }

        if (!solved) {
            return null;
        }

        let params = {
            "note": {
                "deckName": deckName,
                "modelName": modelName,
                "fields": {
                    'Id': id,
                    'Title': title,
                    'TitleSlug': titleSlug,
                    'TopicTags': tagsData,
                    'Difficulty': difficulty,
                    'Description': description,
                    'Notes': "",
                    'CodeSnippets': codeSnippets,
                    'Code': code
                },
                "options": {
                    "allowDuplicate": false,
                    "duplicateScope": "deck",
                    "duplicateScopeOptions": {
                        "deckName": "LeetCode",
                        "checkChildren": false,
                        "checkAllModels": false
                    }
                },
                "tags": tags,
                "audio": [],
                "video": [],
                "picture": []
            }
        }

        return params;
    }

    async function ensureLeetCodeModelExists() {
        try {
            const modelResult = await invoke('modelNames', 6);
            if (!modelResult.includes(modelName)) {
                const params = {
                    modelName: modelName,
                    inOrderFields: ['Id', 'Title', 'TitleSlug', 'TopicTags', 'Difficulty', 'Description', 'Notes', 'CodeSnippets', 'Code'],
                    css: styling,
                    isCloze: false,
                    cardTemplates: [
                        {
                            Name: 'Card 1',
                            Front: frontSide,
                            Back: backSide
                        }
                    ]
                };

                await invoke('createModel', 6, params);
            }
        } catch (error) {
            console.log(error);
            alert('Error:', error);
        }
    }

    async function ensureLeetCodeDeckExists() {
        try {
            const result = await invoke('deckNames', 6);
            if (!result.includes(deckName)) {
                await invoke('createDeck', 6, { deck: deckName });
            }
        } catch (error) {
            alert(`Error: ${error}`);
        }
    }

    async function handleButtonClick() {
        try {
            await ensureLeetCodeDeckExists();
            await ensureLeetCodeModelExists();

            const params = getParams();
            if (!params) {
                alert("Please solve this problem before adding to Anki");
                return;
            }
            const result = await invoke('addNote', 6, params);
            if (result) {
                showToast('Note added to Anki');
            }
        } catch (error) {
            console.log(error);
            alert(`Error: ${error}`);
            
        }
    }

    function invoke(action, version, params = {}) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'http://127.0.0.1:8765',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ action, version, params }),
                onload: (response) => {
                    try {
                        const jsonResponse = JSON.parse(response.responseText);
                        if (Object.getOwnPropertyNames(jsonResponse).length !== 2) {
                            throw 'Response has an unexpected number of fields';
                        }
                        if (!jsonResponse.hasOwnProperty('error')) {
                            throw 'Response is missing required error field';
                        }
                        if (!jsonResponse.hasOwnProperty('result')) {
                            throw 'Response is missing required result field';
                        }
                        if (jsonResponse.error) {
                            throw jsonResponse.error;
                        }
                        resolve(jsonResponse.result);
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: () => reject('Failed to issue request'),
            });
        });
    }

    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.innerText = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = '#43A047';
        toast.style.color = '#ffffff';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
        toast.style.fontSize = '16px';
        toast.style.fontFamily = 'Arial, sans-serif';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
    
        document.body.appendChild(toast);
    
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    addButton();

    // https://github.com/speed-highlight/core
    const scriptData = '\nvar Xt=Object.defineProperty;var w=t=>e=>{var s=t[e];if(s)return s();throw new Error("Module not found in bundle: "+e)};var a=(t,e)=>()=>(t&&(e=t(t=0)),e);var p=(t,e)=>{for(var s in e)Xt(t,s,{get:e[s],enumerable:!0})};var P={};p(P,{default:()=>Wt});var Wt,F=a(()=>{Wt=[{type:"cmnt",match:/(;|#).*/gm},{expand:"str"},{expand:"num"},{type:"num",match:/\\$[\\da-fA-F]*\\b/g},{type:"kwd",match:/^[a-z]+\\s+[a-z.]+\\b/gm,sub:[{type:"func",match:/^[a-z]+/g}]},{type:"kwd",match:/^\\t*[a-z][a-z\\d]*\\b/gm},{match:/%|\\$/g,type:"oper"}]});var $={};p($,{default:()=>T});var M,T,f=a(()=>{M={type:"var",match:/\\$\\w+|\\${[^}]*}|\\$\\([^)]*\\)/g},T=[{sub:"todo",match:/#.*/g},{type:"str",match:/(["\'])((?!\\1)[^\\r\\n\\\\]|\\\\[^])*\\1?/g,sub:[M]},{type:"oper",match:/(?<=\\s|^)\\.*\\/[a-z/_.-]+/gi},{type:"kwd",match:/\\s-[a-zA-Z]+|$<|[&|;]+|\\b(unset|readonly|shift|export|if|fi|else|elif|while|do|done|for|until|case|esac|break|continue|exit|return|trap|wait|eval|exec|then|declare|enable|local|select|typeset|time|add|remove|install|update|delete)(?=\\s|$)/g},{expand:"num"},{type:"func",match:/(?<=(^|\\||\\&\\&|\\;)\\s*)[a-z_.-]+(?=\\s|$)/gmi},{type:"bool",match:/(?<=\\s|^)(true|false)(?=\\s|$)/g},{type:"oper",match:/[=(){}<>!]+/g},{type:"var",match:/(?<=\\s|^)[\\w_]+(?=\\s*=)/g},M]});var v={};p(v,{default:()=>jt});var jt,B=a(()=>{jt=[{match:/[^\\[\\->+.<\\]\\s].*/g,sub:"todo"},{type:"func",match:/\\.+/g},{type:"kwd",match:/[<>]+/g},{type:"oper",match:/[+-]+/g}]});var G={};p(G,{default:()=>Kt});var Kt,H=a(()=>{Kt=[{match:/\\/\\/.*\\n?|\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{expand:"num"},{type:"kwd",match:/#\\s*include (<.*>|".*")/g,sub:[{type:"str",match:/(<|").*/g}]},{match:/asm\\s*{[^}]*}/g,sub:[{type:"kwd",match:/^asm/g},{match:/[^{}]*(?=}$)/g,sub:"asm"}]},{type:"kwd",match:/\\*|&|#[a-z]+\\b|\\b(asm|auto|double|int|struct|break|else|long|switch|case|enum|register|typedef|char|extern|return|union|const|float|short|unsigned|continue|for|signed|void|default|goto|sizeof|volatile|do|if|static|while)\\b/g},{type:"oper",match:/[/*+:?&|%^~=!,<>.^-]+/g},{type:"func",match:/[a-zA-Z_][\\w_]*(?=\\s*\\()/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g}]});var k={};p(k,{default:()=>Vt});var Vt,_=a(()=>{Vt=[{match:/\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{type:"kwd",match:/@\\w+\\b|\\b(and|not|only|or)\\b|\\b[a-z-]+(?=[^{}]*{)/g},{type:"var",match:/\\b[\\w-]+(?=\\s*:)|(::?|\\.)[\\w-]+(?=[^{}]*{)/g},{type:"func",match:/#[\\w-]+(?=[^{}]*{)/g},{type:"num",match:/#[\\da-f]{3,8}/g},{type:"num",match:/\\d+(\\.\\d+)?(cm|mm|in|px|pt|pc|em|ex|ch|rem|vm|vh|vmin|vmax|%)?/g,sub:[{type:"var",match:/[a-z]+|%/g}]},{match:/url\\([^)]*\\)/g,sub:[{type:"func",match:/url(?=\\()/g},{type:"str",match:/[^()]+/g}]},{type:"func",match:/\\b[a-zA-Z]\\w*(?=\\s*\\()/g},{type:"num",match:/\\b[a-z-]+\\b/g}]});var z={};p(z,{default:()=>qt});var qt,Y=a(()=>{qt=[{expand:"strDouble"},{type:"oper",match:/,/g}]});var Z={};p(Z,{default:()=>I});var I,N=a(()=>{I=[{type:"deleted",match:/^[-<].*/gm},{type:"insert",match:/^[+>].*/gm},{type:"kwd",match:/!.*/gm},{type:"section",match:/^@@.*@@$|^\\d.*|^([*-+])\\1\\1.*/gm}]});var X={};p(X,{default:()=>Qt});var Qt,W=a(()=>{f();Qt=[{type:"kwd",match:/^(FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\\b/gmi},...T]});var j={};p(j,{default:()=>Jt});var Jt,K=a(()=>{N();Jt=[{match:/^#.*/gm,sub:"todo"},{expand:"str"},...I,{type:"func",match:/^(\\$ )?git(\\s.*)?$/gm},{type:"kwd",match:/^commit \\w+$/gm}]});var V={};p(V,{default:()=>te});var te,q=a(()=>{te=[{match:/\\/\\/.*\\n?|\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{expand:"num"},{type:"kwd",match:/\\*|&|\\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\\b/g},{type:"func",match:/[a-zA-Z_][\\w_]*(?=\\s*\\()/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g},{type:"oper",match:/[+\\-*\\/%&|^~=!<>.^-]+/g}]});var J={};p(J,{default:()=>A,name:()=>E,properties:()=>l,xmlElement:()=>o});var Q,ee,E,l,o,A,R=a(()=>{Q=":A-Z_a-z\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD",ee=Q+"\\\\-\\\\.0-9\\xB7\\u0300-\\u036F\\u203F-\\u2040",E=`[${Q}][${ee}]*`,l=`\\\\s*(\\\\s+${E}\\\\s*(=\\\\s*([^"\']\\\\S*|("|\')(\\\\\\\\[^]|(?!\\\\4)[^])*\\\\4?)?)?\\\\s*)*`,o={match:RegExp(`<[/!?]?${E}${l}[/!?]?>`,"g"),sub:[{type:"var",match:RegExp(`^<[/!?]?${E}`,"g"),sub:[{type:"oper",match:/^<[\\/!?]?/g}]},{type:"str",match:/=\\s*([^"\']\\S*|("|\')(\\\\[^]|(?!\\2)[^])*\\2?)/g,sub:[{type:"oper",match:/^=/g}]},{type:"oper",match:/[\\/!?]?>/g},{type:"class",match:RegExp(E,"g")}]},A=[{match:/\x3C!--((?!-->)[^])*-->/g,sub:"todo"},{type:"class",match:/<!\\[CDATA\\[[\\s\\S]*?\\]\\]>/gi},o,{type:"str",match:RegExp(`<\\\\?${E}([^?]|\\\\?[^?>])*\\\\?+>`,"g"),sub:[{type:"var",match:RegExp(`^<\\\\?${E}`,"g"),sub:[{type:"oper",match:/^<\\?/g}]},{type:"oper",match:/\\?+>$/g}]},{type:"var",match:/&(#x?)?[\\da-z]{1,8};/gi}]});var tt={};p(tt,{default:()=>ae});var ae,et=a(()=>{R();ae=[{type:"class",match:/<!DOCTYPE("[^"]*"|\'[^\']*\'|[^"\'>])*>/gi,sub:[{type:"str",match:/"[^"]*"|\'[^\']*\'/g},{type:"oper",match:/^<!|>$/g},{type:"var",match:/DOCTYPE/gi}]},{match:RegExp(`<style${l}>((?!</style>)[^])*</style\\\\s*>`,"g"),sub:[{match:RegExp(`^<style${l}>`,"g"),sub:o.sub},{match:RegExp(`${o.match}|[^]*(?=</style\\\\s*>$)`,"g"),sub:"css"},o]},{match:RegExp(`\x3Cscript${l}>((?!<\\/script>)[^])*<\\/script\\\\s*>`,"g"),sub:[{match:RegExp(`^\x3Cscript${l}>`,"g"),sub:o.sub},{match:RegExp(`${o.match}|[^]*(?=<\\/script\\\\s*>$)`,"g"),sub:"js"},o]},...A]});var pe,u,d=a(()=>{pe=[["bash",[/#!(\\/usr)?\\/bin\\/bash/g,500],[/\\b(if|elif|then|fi|echo)\\b|\\$/g,10]],["html",[/<\\/?[a-z-]+[^\\n>]*>/g,10],[/^\\s+<!DOCTYPE\\s+html/g,500]],["http",[/^(GET|HEAD|POST|PUT|DELETE|PATCH|HTTP)\\b/g,500]],["js",[/\\b(console|await|async|function|export|import|this|class|for|let|const|map|join|require)\\b/g,10]],["ts",[/\\b(console|await|async|function|export|import|this|class|for|let|const|map|join|require|implements|interface|namespace)\\b/g,10]],["py",[/\\b(def|print|class|and|or|lambda)\\b/g,10]],["sql",[/\\b(SELECT|INSERT|FROM)\\b/g,50]],["pl",[/#!(\\/usr)?\\/bin\\/perl/g,500],[/\\b(use|print)\\b|\\$/g,10]],["lua",[/#!(\\/usr)?\\/bin\\/lua/g,500]],["make",[/\\b(ifneq|endif|if|elif|then|fi|echo|.PHONY|^[a-z]+ ?:$)\\b|\\$/gm,10]],["uri",[/https?:|mailto:|tel:|ftp:/g,30]],["css",[/^(@import|@page|@media|(\\.|#)[a-z]+)/gm,20]],["diff",[/^[+><-]/gm,10],[/^@@ ?[-+,0-9 ]+ ?@@/gm,25]],["md",[/^(>|\\t\\*|\\t\\d+.)/gm,10],[/\\[.*\\](.*)/g,10]],["docker",[/^(FROM|ENTRYPOINT|RUN)/gm,500]],["xml",[/<\\/?[a-z-]+[^\\n>]*>/g,10],[/^<\\?xml/g,500]],["c",[/#include\\b|\\bprintf\\s+\\(/g,100]],["rs",[/^\\s+(use|fn|mut|match)\\b/gm,100]],["go",[/\\b(func|fmt|package)\\b/g,100]],["java",[/^import\\s+java/gm,500]],["asm",[/^(section|global main|extern|\\t(call|mov|ret))/gm,100]],["css",[/^(@import|@page|@media|(\\.|#)[a-z]+)/gm,20]],["json",[/\\b(true|false|null|\\{})\\b|\\"[^"]+\\":/g,10]],["yaml",[/^(\\s+)?[a-z][a-z0-9]*:/gmi,10]]],u=t=>pe.map(([e,...s])=>[e,s.reduce((c,[m,n])=>c+[...t.matchAll(m)].length*n,0)]).filter(([e,s])=>s>20).sort((e,s)=>s[1]-e[1])[0]?.[0]||"plain"});var at={};p(at,{default:()=>se});var se,pt=a(()=>{d();se=[{type:"kwd",match:/^(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH|PRI|SEARCH)\\b/gm},{expand:"str"},{type:"section",match:/\\bHTTP\\/[\\d.]+\\b/g},{expand:"num"},{type:"oper",match:/[,;:=]/g},{type:"var",match:/[a-zA-Z][\\w-]*(?=:)/g},{match:/\\n\\n[^]*/g,sub:u}]});var st={};p(st,{default:()=>ce});var ce,ct=a(()=>{ce=[{match:/(^[ \\f\\t\\v]*)[#;].*/gm,sub:"todo"},{type:"str",match:/.*/g},{type:"var",match:/.*(?==)/g},{type:"section",match:/^\\s*\\[.+\\]\\s*$/gm},{type:"oper",match:/=/g}]});var nt={};p(nt,{default:()=>ne});var ne,mt=a(()=>{ne=[{match:/\\/\\/.*\\n?|\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{expand:"num"},{type:"kwd",match:/\\b(abstract|assert|boolean|break|byte|case|catch|char|class|continue|const|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|package|private|protected|public|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while)\\b/g},{type:"oper",match:/[/*+:?&|%^~=!,<>.^-]+/g},{type:"func",match:/[a-zA-Z_][\\w_]*(?=\\s*\\()/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g}]});var rt={};p(rt,{default:()=>O});var O,L=a(()=>{O=[{match:/\\/\\*\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"jsdoc"},{match:/\\/\\/.*\\n?|\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{match:/`((?!`)[^]|\\\\[^])*`?/g,sub:"js_template_literals"},{type:"kwd",match:/=>|\\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\\b/g},{match:/\\/((?!\\/)[^\\r\\n\\\\]|\\\\.)+\\/[dgimsuy]*/g,sub:"regex"},{expand:"num"},{type:"num",match:/\\b(NaN|null|undefined|[A-Z][A-Z_]*)\\b/g},{type:"bool",match:/\\b(true|false)\\b/g},{type:"oper",match:/[/*+:?&|%^~=!,<>.^-]+/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g},{type:"func",match:/[a-zA-Z$_][\\w$_]*(?=\\s*((\\?\\.)?\\s*\\(|=\\s*(\\(?[\\w,{}\\[\\])]+\\)? =>|function\\b)))/g}]});var ot={};p(ot,{default:()=>me,type:()=>re});var me,re,Et=a(()=>{me=[{match:new class{exec(t){let e=this.lastIndex,s,c=m=>{for(;++e<t.length-2;)if(t[e]=="{")c();else if(t[e]=="}")return};for(;e<t.length;++e)if(t[e-1]!="\\\\"&&t[e]=="$"&&t[e+1]=="{")return s=e++,c(e),this.lastIndex=e+1,{index:s,0:t.slice(s,e+1)};return null}},sub:[{type:"kwd",match:/^\\${|}$/g},{match:/(?!^\\$|{)[^]+(?=}$)/g,sub:"js"}]}],re="str"});var lt={};p(lt,{default:()=>x,type:()=>oe});var x,oe,S=a(()=>{x=[{type:"err",match:/\\b(TODO|FIXME|DEBUG|OPTIMIZE|WARNING|XXX|BUG)\\b/g},{type:"class",match:/\\bIDEA\\b/g},{type:"insert",match:/\\b(CHANGED|FIX|CHANGE)\\b/g},{type:"oper",match:/\\bQUESTION\\b/g}],oe="cmnt"});var ut={};p(ut,{default:()=>Ee,type:()=>le});var Ee,le,ht=a(()=>{S();Ee=[{type:"kwd",match:/@\\w+/g},{type:"class",match:/{[\\w\\s|<>,.@\\[\\]]+}/g},{type:"var",match:/\\[[\\w\\s="\']+\\]/g},...x],le="cmnt"});var it={};p(it,{default:()=>ue});var ue,gt=a(()=>{ue=[{type:"var",match:/("|\')?[a-zA-Z]\\w*\\1(?=\\s*:)/g},{expand:"str"},{expand:"num"},{type:"num",match:/\\bnull\\b/g},{type:"bool",match:/\\b(true|false)\\b/g}]});var dt={};p(dt,{default:()=>C});var C,D=a(()=>{d();C=[{type:"cmnt",match:/^>.*|(=|-)\\1+/gm},{type:"class",match:/\\*\\*((?!\\*\\*).)*\\*\\*/g},{match:/```((?!```)[^])*\\n```/g,sub:t=>({type:"kwd",sub:[{match:/\\n[^]*(?=```)/g,sub:t.split(`\n`)[0].slice(3)||u(t)}]})},{type:"str",match:/`[^`]*`/g},{type:"var",match:/~~((?!~~).)*~~/g},{type:"kwd",match:/_[^_]*_|\\*[^*]*\\*/g},{type:"kwd",match:/^\\s*(\\*|\\d+\\.)\\s/gm},{type:"oper",match:/\\[[^\\]]*]/g},{type:"func",match:/\\([^)]*\\)/g}]});var bt={};p(bt,{default:()=>he});var he,yt=a(()=>{D();d();he=[{type:"insert",match:/(leanpub-start-insert)((?!leanpub-end-insert)[^])*(leanpub-end-insert)?/g,sub:[{type:"insert",match:/leanpub-(start|end)-insert/g},{match:/(?!leanpub-start-insert)((?!leanpub-end-insert)[^])*/g,sub:u}]},{type:"deleted",match:/(leanpub-start-delete)((?!leanpub-end-delete)[^])*(leanpub-end-delete)?/g,sub:[{type:"deleted",match:/leanpub-(start|end)-delete/g},{match:/(?!leanpub-start-delete)((?!leanpub-end-delete)[^])*/g,sub:u}]},...C]});var Tt={};p(Tt,{default:()=>ie});var ie,ft=a(()=>{ie=[{type:"cmnt",match:/^#.*/gm},{expand:"strDouble"},{expand:"num"},{type:"err",match:/\\b(err(or)?|[a-z_-]*exception|warn|warning|failed|ko|invalid|not ?found|alert|fatal)\\b/gi},{type:"num",match:/\\b(null|undefined)\\b/gi},{type:"bool",match:/\\b(false|true|yes|no)\\b/gi},{type:"oper",match:/\\.|,/g}]});var It={};p(It,{default:()=>ge});var ge,Nt=a(()=>{ge=[{match:/^#!.*|--(\\[(=*)\\[((?!--\\]\\2\\])[^])*--\\]\\2\\]|.*)/g,sub:"todo"},{expand:"str"},{type:"kwd",match:/\\b(and|break|do|else|elseif|end|for|function|if|in|local|not|or|repeat|return|then|until|while)\\b/g},{type:"bool",match:/\\b(true|false|nil)\\b/g},{type:"oper",match:/[+*/%^#=~<>:,.-]+/g},{expand:"num"},{type:"func",match:/[a-z_]+(?=\\s*[({])/g}]});var At={};p(At,{default:()=>de});var de,Rt=a(()=>{de=[{match:/^\\s*#.*/gm,sub:"todo"},{expand:"str"},{type:"oper",match:/[${}()]+/g},{type:"class",match:/.PHONY:/gm},{type:"section",match:/^[\\w.]+:/gm},{type:"kwd",match:/\\b(ifneq|endif)\\b/g},{expand:"num"},{type:"var",match:/[A-Z_]+(?=\\s*=)/g},{match:/^.*$/gm,sub:"bash"}]});var Ot={};p(Ot,{default:()=>be});var be,Lt=a(()=>{be=[{match:/#.*/g,sub:"todo"},{type:"str",match:/(["\'])(\\\\[^]|(?!\\1)[^])*\\1?/g},{expand:"num"},{type:"kwd",match:/\\b(any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|return|say|state|sub|switch|undef|unless|until|use|when|while|not|and|or|xor)\\b/g},{type:"oper",match:/[-+*/%~!&<>|=?,]+/g},{type:"func",match:/[a-z_]+(?=\\s*\\()/g}]});var xt={};p(xt,{default:()=>ye});var ye,St=a(()=>{ye=[{expand:"strDouble"}]});var Ct={};p(Ct,{default:()=>Te});var Te,Dt=a(()=>{Te=[{match:/#.*/g,sub:"todo"},{match:/("""|\'\'\')(\\\\[^]|(?!\\1)[^])*\\1?/g,sub:"todo"},{type:"str",match:/f("|\')(\\\\[^]|(?!\\1).)*\\1?|f((["\'])\\4\\4)(\\\\[^]|(?!\\3)[^])*\\3?/gi,sub:[{type:"var",match:/{[^{}]*}/g,sub:[{match:/(?!^{)[^]*(?=}$)/g,sub:"py"}]}]},{expand:"str"},{type:"kwd",match:/\\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\\b/g},{type:"bool",match:/\\b(False|True|None)\\b/g},{expand:"num"},{type:"func",match:/[a-z_]+(?=\\s*\\()/g},{type:"oper",match:/[-/*+<>,=!&|^%]+/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g}]});var wt={};p(wt,{default:()=>fe,type:()=>Ie});var fe,Ie,Ut=a(()=>{fe=[{match:/^(?!\\/).*/gm,sub:"todo"},{type:"num",match:/\\[((?!\\])[^\\\\]|\\\\.)*\\]/g},{type:"kwd",match:/\\||\\^|\\$|\\\\.|\\w+($|\\r|\\n)/g},{type:"var",match:/\\*|\\+|\\{\\d+,\\d+\\}/g}],Ie="oper"});var Pt={};p(Pt,{default:()=>Ne});var Ne,Ft=a(()=>{Ne=[{match:/\\/\\/.*\\n?|\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{expand:"num"},{type:"kwd",match:/\\b(as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn|abstract|become|box|do|final|macro|override|priv|typeof|unsized|virtual|yield|try)\\b/g},{type:"oper",match:/[/*+:?&|%^~=!,<>.^-]+/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g},{type:"func",match:/[a-zA-Z_][\\w_]*(?=\\s*!?\\s*\\()/g}]});var Mt={};p(Mt,{default:()=>Ae});var Ae,$t=a(()=>{Ae=[{match:/--.*\\n?|\\/\\*((?!\\*\\/)[^])*(\\*\\/)?/g,sub:"todo"},{expand:"str"},{type:"func",match:/\\b(AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\\s*\\()/g},{type:"kwd",match:/\\b(ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|kwdS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:S|ING)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\\b/g},{type:"num",match:/\\.?\\d[\\d.oxa-fA-F-]*|\\bNULL\\b/g},{type:"bool",match:/\\b(TRUE|FALSE)\\b/g},{type:"oper",match:/[-+*\\/=%^~]|&&?|\\|\\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\\b(?:AND|BETWEEN|DIV|IN|ILIKE|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\\b/g},{type:"var",match:/@\\S+/g}]});var vt={};p(vt,{default:()=>Re});var Re,Bt=a(()=>{Re=[{match:/#.*/g,sub:"todo"},{type:"str",match:/("""|\'\'\')((?!\\1)[^]|\\\\[^])*\\1?/g},{expand:"str"},{type:"section",match:/^\\[.+\\]\\s*$/gm},{type:"num",match:/\\b(inf|nan)\\b|\\d[\\d:ZT.-]*/g},{expand:"num"},{type:"bool",match:/\\b(true|false)\\b/g},{type:"oper",match:/[+,.=-]/g},{type:"var",match:/\\w+(?= \\=)/g}]});var Gt={};p(Gt,{default:()=>Oe});var Oe,Ht=a(()=>{L();Oe=[{type:"type",match:/:\\s*(any|void|number|boolean|string|object|never|enum)\\b/g},{type:"kwd",match:/\\b(type|namespace|typedef|interface|public|private|protected|implements|declare|abstract|readonly)\\b/g},...O]});var kt={};p(kt,{default:()=>Le});var Le,_t=a(()=>{Le=[{match:/^#.*/gm,sub:"todo"},{type:"class",match:/^\\w+(?=:?)/gm},{type:"num",match:/:\\d+/g},{type:"oper",match:/[:/&?]|\\w+=/g},{type:"func",match:/[.\\w]+@|#[\\w]+$/gm},{type:"var",match:/\\w+\\.\\w+(\\.\\w+)*/g}]});var zt={};p(zt,{default:()=>xe});var xe,Yt=a(()=>{xe=[{match:/#.*/g,sub:"todo"},{expand:"str"},{type:"str",match:/(>|\\|)\\r?\\n((\\s[^\\n]*)?(\\r?\\n|$))*/g},{type:"type",match:/!![a-z]+/g},{type:"bool",match:/\\b(Yes|No)\\b/g},{type:"oper",match:/[+:-]/g},{expand:"num"},{type:"var",match:/[a-zA-Z]\\w*(?=:)/g}]});var U={num:{type:"num",match:/(\\.e?|\\b)\\d(e-|[\\d.oxa-fA-F_])*(\\.|\\b)/g},str:{type:"str",match:/(["\'])(\\\\[^]|(?!\\1)[^\\r\\n\\\\])*\\1?/g},strDouble:{type:"str",match:/"((?!")[^\\r\\n\\\\]|\\\\[^])*"?/g}};var Se=w({"./languages/asm.js":()=>Promise.resolve().then(()=>(F(),P)),"./languages/bash.js":()=>Promise.resolve().then(()=>(f(),$)),"./languages/bf.js":()=>Promise.resolve().then(()=>(B(),v)),"./languages/c.js":()=>Promise.resolve().then(()=>(H(),G)),"./languages/css.js":()=>Promise.resolve().then(()=>(_(),k)),"./languages/csv.js":()=>Promise.resolve().then(()=>(Y(),z)),"./languages/diff.js":()=>Promise.resolve().then(()=>(N(),Z)),"./languages/docker.js":()=>Promise.resolve().then(()=>(W(),X)),"./languages/git.js":()=>Promise.resolve().then(()=>(K(),j)),"./languages/go.js":()=>Promise.resolve().then(()=>(q(),V)),"./languages/html.js":()=>Promise.resolve().then(()=>(et(),tt)),"./languages/http.js":()=>Promise.resolve().then(()=>(pt(),at)),"./languages/ini.js":()=>Promise.resolve().then(()=>(ct(),st)),"./languages/java.js":()=>Promise.resolve().then(()=>(mt(),nt)),"./languages/js.js":()=>Promise.resolve().then(()=>(L(),rt)),"./languages/js_template_literals.js":()=>Promise.resolve().then(()=>(Et(),ot)),"./languages/jsdoc.js":()=>Promise.resolve().then(()=>(ht(),ut)),"./languages/json.js":()=>Promise.resolve().then(()=>(gt(),it)),"./languages/leanpub-md.js":()=>Promise.resolve().then(()=>(yt(),bt)),"./languages/log.js":()=>Promise.resolve().then(()=>(ft(),Tt)),"./languages/lua.js":()=>Promise.resolve().then(()=>(Nt(),It)),"./languages/make.js":()=>Promise.resolve().then(()=>(Rt(),At)),"./languages/md.js":()=>Promise.resolve().then(()=>(D(),dt)),"./languages/pl.js":()=>Promise.resolve().then(()=>(Lt(),Ot)),"./languages/plain.js":()=>Promise.resolve().then(()=>(St(),xt)),"./languages/py.js":()=>Promise.resolve().then(()=>(Dt(),Ct)),"./languages/regex.js":()=>Promise.resolve().then(()=>(Ut(),wt)),"./languages/rs.js":()=>Promise.resolve().then(()=>(Ft(),Pt)),"./languages/sql.js":()=>Promise.resolve().then(()=>($t(),Mt)),"./languages/todo.js":()=>Promise.resolve().then(()=>(S(),lt)),"./languages/toml.js":()=>Promise.resolve().then(()=>(Bt(),vt)),"./languages/ts.js":()=>Promise.resolve().then(()=>(Ht(),Gt)),"./languages/uri.js":()=>Promise.resolve().then(()=>(_t(),kt)),"./languages/xml.js":()=>Promise.resolve().then(()=>(R(),J)),"./languages/yaml.js":()=>Promise.resolve().then(()=>(Yt(),zt))});var b={},Ce=(t="")=>t.replaceAll("&","&#38;").replaceAll?.("<","&lt;").replaceAll?.(">","&gt;"),De=(t,e)=>e?`<span class="shj-syn-${e}">${t}</span>`:t;async function Zt(t,e,s){try{let c,m,n={},i,r=[],h=0,y=typeof e=="string"?await(b[e]??(b[e]=Se(`./languages/${e}.js`))):e,g=[...typeof e=="string"?y.default:e.sub];for(;h<t.length;){for(n.index=null,c=g.length;c-- >0;){if(m=g[c].expand?U[g[c].expand]:g[c],r[c]===void 0||r[c].match.index<h){if(m.match.lastIndex=h,i=m.match.exec(t),i===null){g.splice(c,1),r.splice(c,1);continue}r[c]={match:i,lastIndex:m.match.lastIndex}}r[c].match[0]&&(r[c].match.index<=n.index||n.index===null)&&(n={part:m,index:r[c].match.index,match:r[c].match[0],end:r[c].lastIndex})}if(n.index===null)break;s(t.slice(h,n.index),y.type),h=n.end,n.part.sub?await Zt(n.match,typeof n.part.sub=="string"?n.part.sub:typeof n.part.sub=="function"?n.part.sub(n.match):n.part,s):s(n.match,n.part.type)}s(t.slice(h,t.length),y.type)}catch{s(t)}}async function we(t,e,s=!0,c={}){let m="";return await Zt(t,e,(n,i)=>m+=De(Ce(n),i)),s?`<div><div class="shj-numbers">${"<div></div>".repeat(!c.hideLineNumbers&&t.split(`\n`).length)}</div><div>${m}</div></div>`:m}async function Ue(t,e=t.className.match(/shj-lang-([\\w-]+)/)?.[1],s,c){let m=t.textContent;s??(s=`${t.tagName=="CODE"?"in":m.split(`\n`).length<2?"one":"multi"}line`),t.dataset.lang=e,t.className=`${[...t.classList].filter(n=>!n.startsWith("shj-")).join(" ")} shj-lang-${e} shj-${s}`,t.innerHTML=await we(m,e,s=="multiline",c)}var Ke=async t=>Promise.all(Array.from(document.querySelectorAll(\'[class*="shj-lang-"]\')).map(e=>Ue(e,void 0,void 0,t))),Ve=(t,e)=>{b[t]=e};\nvar t=[{match:/#.*/g,sub:"todo"},{match:/("""|\'\'\')(\\\\[^]|(?!\\1)[^])*\\1?/g,sub:"todo"},{type:"str",match:/f("|\')(\\\\[^]|(?!\\1).)*\\1?|f((["\'])\\4\\4)(\\\\[^]|(?!\\3)[^])*\\3?/gi,sub:[{type:"var",match:/{[^{}]*}/g,sub:[{match:/(?!^{)[^]*(?=}$)/g,sub:"py"}]}]},{expand:"str"},{type:"kwd",match:/\\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\\b/g},{type:"bool",match:/\\b(False|True|None)\\b/g},{expand:"num"},{type:"func",match:/[a-z_]+(?=\\s*\\()/g},{type:"oper",match:/[-/*+<>,=!&|^%]+/g},{type:"class",match:/\\b[A-Z][\\w_]*\\b/g}];\n// export{Ke as highlightAll,Ue as highlightElement,we as highlightText,Ve as loadLanguage,Zt as tokenize};\nKe();\n';

    const frontSide = `<script>
    function expandTags() {
        document.getElementById('hidden-tags').style.display = 'none';
        const tagData = JSON.parse(JSON.stringify({{ TopicTags }}));
    const tagSlugs = Object.keys(tagData);
    const tags = Object.values(tagData);

    const N = tags.length;
    for (let i = 0; i < N; i++) {
        const tag = document.createElement('a');
        tag.setAttribute('class', 'btn tag-btn');
        tag.setAttribute('href', 'https://leetcode.com/tag/' + tagSlugs[i] + '/');
        tag.innerHTML = tags[i];
        document.getElementById('tags').appendChild(tag);
    }
    }
</script>

<!--Problem Title-->
<section class="RankEditor"
    style="margin: 0px auto; text-align: center; width: 100%; opacity: 1; transform: rotateZ(0deg);" data-width="100%"
    data-opacity="1" data-rotate="0">
    <section
        style="color: rgb(228, 130, 16); padding: 3px 10px; margin-bottom: -1em; vertical-align: bottom; font-size: 1.2em;">
        <p class="brush active" style="color: rgb(228, 130, 16); font-size: 19px; min-width: 1px;">
            <a href="https://leetcode.com/problems/{{TitleSlug}}"
                style="text-decoration:none;color:rgb(228, 130, 16);">
                {{Id}}. {{Title}}
            </a>
        </p>
    </section>
    <section style="width: 100%; display: inline-block; vertical-align: top;">
        <section
            style="border-top: 1px solid rgb(228, 130, 16); border-right-color: rgb(228, 130, 16); border-bottom-color: rgb(228, 130, 16); border-left-color: rgb(228, 130, 16); width: 100%;">
        </section>
        <section
            style="width: 6px; height: 6px; margin-top: -3px; background-color: rgb(228, 130, 16); border-radius: 100%;">
        </section>
        <section
            style="width: 6px; height: 6px; margin-top: -6px; float: right; background-color: rgb(228, 130, 16); border-radius: 100%;">
        </section>
    </section>
</section>

{{#Tags}}
<div id="tags"></div>
<a class="btn tag-btn" href="#" onclick="expandTags()" id="hidden-tags">Tags</a>
{{/Tags}}

{{Description}}

<!--Code Snippets-->
<div id="codeSnippets">
    <section class="RankEditor"
         style="margin: 0px auto; text-align: center; width: 100%; opacity: 1; transform: rotateZ(0deg);"
         data-width="100%" data-opacity="1" data-rotate="0">
    <section
            style="color: rgb(228, 130, 16); padding: 3px 10px; margin-bottom: -1em; vertical-align: bottom; font-size: 1.2em;">
        <p class="brush active" style="color: rgb(228, 130, 16); font-size: 19px; min-width: 1px;">
            Code Snippets
        </p>
    </section>
    <section style="width: 100%; display: inline-block; vertical-align: top;">
        <section
                style="border-top: 1px solid rgb(228, 130, 16); border-right-color: rgb(228, 130, 16); border-bottom-color: rgb(228, 130, 16); border-left-color: rgb(228, 130, 16); width: 100%;"></section>
        <section
                style="width: 6px; height: 6px; margin-top: -3px; background-color: rgb(228, 130, 16); border-radius: 100%;"></section>
        <section
                style="width: 6px; height: 6px; margin-top: -6px; float: right; background-color: rgb(228, 130, 16); border-radius: 100%;"></section>
    </section>
    </section>
    <div class='shj-lang-${langShortName}'>{{CodeSnippets}}</div>
</div>

<script>
// https://github.com/speed-highlight/core
${scriptData}
</script>`;

const backSide = `{{FrontSide}}

{{#Notes}}
<!--Notes-->
<section class="RankEditor"
         style="margin: 0px auto; text-align: center; width: 100%; opacity: 1; transform: rotateZ(0deg);"
         data-width="100%" data-opacity="1" data-rotate="0">
    <section
            style="color: rgb(228, 130, 16); padding: 3px 10px; margin-bottom: -1em; vertical-align: bottom; font-size: 1.2em;">
        <p class="brush active" style="color: rgb(228, 130, 16); font-size: 19px; min-width: 1px;">
            Notes
        </p>
    </section>
    <section style="width: 100%; display: inline-block; vertical-align: top;">
        <section
                style="border-top: 1px solid rgb(228, 130, 16); border-right-color: rgb(228, 130, 16); border-bottom-color: rgb(228, 130, 16); border-left-color: rgb(228, 130, 16); width: 100%;"></section>
        <section
                style="width: 6px; height: 6px; margin-top: -3px; background-color: rgb(228, 130, 16); border-radius: 100%;"></section>
        <section
                style="width: 6px; height: 6px; margin-top: -6px; float: right; background-color: rgb(228, 130, 16); border-radius: 100%;"></section>
    </section>
</section>
{{Notes}}
{{/Notes}}

<div style="display: flex">
	<a href="https://leetcode.com/problems/{{TitleSlug}}/description/"><button>Description</button></a>
	<a href="https://leetcode.com/problems/{{TitleSlug}}/editorial/"><button>Editorial</button></a>
	<a href="https://leetcode.com/problems/{{TitleSlug}}/solutions/"><button>Solution</button></a>
	<a href="https://leetcode.com/problems/{{TitleSlug}}/submissions/"><button>Submissions</button></a>
</div>

<!--Code-->
<section class="RankEditor"
         style="margin: 0px auto; text-align: center; width: 100%; opacity: 1; transform: rotateZ(0deg);"
         data-width="100%" data-opacity="1" data-rotate="0">
    <section
            style="color: rgb(228, 130, 16); padding: 3px 10px; margin-bottom: -1em; vertical-align: bottom; font-size: 1.2em;">
        <p class="brush active" style="color: rgb(228, 130, 16); font-size: 19px; min-width: 1px;">
            Code
        </p>
    </section>
    <section style="width: 100%; display: inline-block; vertical-align: top;">
        <section
                style="border-top: 1px solid rgb(228, 130, 16); border-right-color: rgb(228, 130, 16); border-bottom-color: rgb(228, 130, 16); border-left-color: rgb(228, 130, 16); width: 100%;"></section>
        <section
                style="width: 6px; height: 6px; margin-top: -3px; background-color: rgb(228, 130, 16); border-radius: 100%;"></section>
        <section
                style="width: 6px; height: 6px; margin-top: -6px; float: right; background-color: rgb(228, 130, 16); border-radius: 100%;"></section>
    </section>
</section>
<div class='shj-lang-${langShortName}'>{{Code}}</div>
<script>
	document.getElementById("codeSnippets").style.display = "none";
</script>
`;

    const styling = `.card {
    font-size: 14px;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", "Noto Sans", sans-serif;
    color: black;
    background-color: white;
    text-align: left;
}

.card.night_mode {
    background-color: rgba(33, 33, 33, 1);
    color: white;
}

.tag-btn {
    padding: 1px 5px;
    color: #5a5a5a;
    font-size: 13px;
    font-weight: 500;
    margin-right: 3px;
    border: 1px solid #ddd;
}

.Easy {
    background-color: #5cb85c;
}

.Medium {
    background-color: #f0ad4e;
}

.Hard {
    background-color: #d9534f;
}

pre {
    padding: 6px 13px;
    font-size: 13px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', 'Source Code Pro', monospace;
    overflow: auto;
    tab-size: 4;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.night_mode pre {
    background-color: #333333;
    color: white;
}

table {
    font-family: verdana, arial, sans-serif;
    font-size: 11px;
    color: #333333;
    border-width: 1px;
    border-color: #666666;
    border-collapse: collapse;
}

table th {
    border-width: 1px;
    padding: 8px;
    border-style: solid;
    border-color: #666666;
    background-color: #dedede;
}

table td {
    border-width: 1px;
    padding: 8px;
    border-style: solid;
    border-color: #666666;
    background-color: #ffffff;
}

/* https://github.com/speed-highlight/core */
[class*=shj-lang-] {
    white-space: pre;
    color: #112;
    text-shadow: none;
    box-sizing: border-box;
    background: #fff;
    border-radius: 10px;
    max-width: min(100%, 100vw);
    margin: 10px 0;
    font: 18px/24px Consolas, Courier New, Monaco, Andale Mono, Ubuntu Mono, monospace;
    box-shadow: 0 0 5px #0001
}

.shj-inline {
    border-radius: 5px;
    margin: 0;
    padding: 2px 5px;
    display: inline-block
}

[class*=shj-lang-]::selection {
    background: #bdf5
}

[class*=shj-lang-] ::selection {
    background: #bdf5
}

[class*=shj-lang-]>div {
    display: flex;
    overflow: auto;
    padding: 20px 20px 20px 10px;
}

[class*=shj-lang-]>div :last-child {
    outline: none;
    flex: 1
}

.shj-numbers {
    counter-reset: line;
    padding-left: 5px
}

.shj-numbers div {
    padding-right: 5px
}

.shj-numbers div:before {
    color: #999;
    content: counter(line);
    opacity: .5;
    text-align: right;
    counter-increment: line;
    margin-right: 5px;
    display: block
}

.shj-syn-cmnt {
    font-style: italic
}

.shj-syn-err,
.shj-syn-kwd {
    color: #e16
}

.shj-syn-num,
.shj-syn-class {
    color: #f60
}

.shj-syn-insert,
.shj-syn-str {
    color: #7d8
}

.shj-syn-bool {
    color: #3bf
}

.shj-syn-type,
.shj-syn-oper {
    color: #5af
}

.shj-syn-section,
.shj-syn-func {
    color: #84f
}

.shj-syn-deleted,
.shj-syn-var {
    color: #f44
}

.shj-oneline {
    padding: 12px 10px
}

.shj-lang-http.shj-oneline .shj-syn-kwd {
    color: #fff;
    background: #25f;
    border-radius: 5px;
    padding: 5px 7px
}

[class*=shj-lang-] {
    color: #c9d1d9;
    background: #161b22
}

[class*=shj-lang-]:before {
    color: #6f9aff
}

.shj-syn-insert {
    color: #98c379
}

.shj-syn-deleted,
.shj-syn-err,
.shj-syn-kwd {
    color: #ff7b72
}

.shj-syn-class {
    color: #ffa657
}

.shj-numbers,
.shj-syn-cmnt {
    color: #8b949e
}

.shj-syn-type,
.shj-syn-oper,
.shj-syn-num,
.shj-syn-section,
.shj-syn-var,
.shj-syn-bool {
    color: #79c0ff
}

.shj-syn-str {
    color: #a5d6ff
}

.shj-syn-func {
    color: #d2a8ff
}`;

})();
