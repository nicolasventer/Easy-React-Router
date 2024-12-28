import{A as r,w as i,z as c}from"../index.chunk-3gg1x40h.js";var t=i(c(),1),n=i(r(),1),a=(u,o)=>{let e;return(...d)=>{if(e!==void 0)clearTimeout(e);e=setTimeout(()=>u(...d),o)}},T=()=>{let[u,o]=t.useState(""),e=t.useMemo(()=>a(o,500),[]);return n.jsxDEV("div",{children:[n.jsxDEV("input",{type:"text",onInput:(d)=>e(d.currentTarget.value)},void 0,!1,void 0,this),n.jsxDEV("div",{children:["Debounced value: ",u]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};export{T as DebounceTextInput};

//# debugId=C8C8E6E1EF8FA9FD64756E2164756E21
//# sourceMappingURL=DebounceTextInput.chunk-h4f02ag9.js.map
