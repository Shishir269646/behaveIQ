(()=>{var e={};e.id=566,e.ids=[566],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},32615:e=>{"use strict";e.exports=require("http")},32694:e=>{"use strict";e.exports=require("http2")},35240:e=>{"use strict";e.exports=require("https")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},76162:e=>{"use strict";e.exports=require("stream")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},99524:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>i.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>c,routeModule:()=>m,tree:()=>d}),r(32019),r(35866),r(22831);var a=r(23191),s=r(88716),o=r(37922),i=r.n(o),n=r(95231),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(t,l);let d=["",{children:["(auth)",{children:["register",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,32019)),"C:\\MERN Project\\behaveiq-platform\\frontend\\app\\(auth)\\register\\page.tsx"]}]},{}]},{"not-found":[()=>Promise.resolve().then(r.t.bind(r,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,57481))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,22831)),"C:\\MERN Project\\behaveiq-platform\\frontend\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,57481))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["C:\\MERN Project\\behaveiq-platform\\frontend\\app\\(auth)\\register\\page.tsx"],u="/(auth)/register/page",p={require:r,loadChunk:()=>Promise.resolve()},m=new a.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/(auth)/register/page",pathname:"/register",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},31636:(e,t,r)=>{Promise.resolve().then(r.bind(r,80333))},80333:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>m});var a=r(10326),s=r(17577),o=r(90434),i=r(35047),n=r(90772),l=r(54432),d=r(45842),c=r(33071),u=r(95035),p=r(40381);function m(){(0,i.useRouter)();let{register:e,loading:t,error:r,success:m,clearSuccess:f}=(0,u.a)(),[g,x]=(0,s.useState)({email:"",password:"",fullName:"",companyName:""}),h=async t=>{if(t.preventDefault(),!g.email||!g.password||!g.fullName){p.Am.error("Please fill in all required fields");return}if(g.password.length<6){p.Am.error("Password must be at least 6 characters");return}await e(g)};return a.jsx("div",{className:"min-h-screen flex items-center justify-center bg-gray-50 px-4",children:(0,a.jsxs)(c.Zb,{className:"w-full max-w-md",children:[(0,a.jsxs)(c.Ol,{className:"space-y-1",children:[a.jsx(c.ll,{className:"text-2xl font-bold text-center",children:"Create Account"}),a.jsx(c.SZ,{className:"text-center",children:"Start understanding your visitors today"})]}),(0,a.jsxs)(c.aY,{children:[(0,a.jsxs)("form",{onSubmit:h,className:"space-y-4",children:[(0,a.jsxs)("div",{className:"space-y-2",children:[a.jsx(d._,{htmlFor:"fullName",children:"Full Name *"}),a.jsx(l.I,{id:"fullName",type:"text",placeholder:"John Doe",value:g.fullName,onChange:e=>x({...g,fullName:e.target.value}),required:!0})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[a.jsx(d._,{htmlFor:"email",children:"Email *"}),a.jsx(l.I,{id:"email",type:"email",placeholder:"you@example.com",value:g.email,onChange:e=>x({...g,email:e.target.value}),required:!0})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[a.jsx(d._,{htmlFor:"companyName",children:"Company Name"}),a.jsx(l.I,{id:"companyName",type:"text",placeholder:"Acme Inc",value:g.companyName,onChange:e=>x({...g,companyName:e.target.value})})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[a.jsx(d._,{htmlFor:"password",children:"Password *"}),a.jsx(l.I,{id:"password",type:"password",placeholder:"••••••••",value:g.password,onChange:e=>x({...g,password:e.target.value}),required:!0}),a.jsx("p",{className:"text-xs text-gray-500",children:"At least 6 characters"})]}),a.jsx(n.z,{type:"submit",className:"w-full",disabled:t,children:t?"Creating account...":"Create Account"})]}),(0,a.jsxs)("div",{className:"mt-4 text-center text-sm",children:["Already have an account?"," ",a.jsx(o.default,{href:"/login",className:"text-blue-600 hover:underline",children:"Sign in"})]})]})]})})}},90772:(e,t,r)=>{"use strict";r.d(t,{z:()=>d});var a=r(10326),s=r(17577),o=r(34214),i=r(79360),n=r(77863);let l=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),d=s.forwardRef(({className:e,variant:t,size:r,asChild:s=!1,...i},d)=>{let c=s?o.g7:"button";return a.jsx(c,{className:(0,n.cn)(l({variant:t,size:r,className:e})),ref:d,...i})});d.displayName="Button"},33071:(e,t,r)=>{"use strict";r.d(t,{Ol:()=>n,SZ:()=>d,Zb:()=>i,aY:()=>c,ll:()=>l});var a=r(10326),s=r(17577),o=r(77863);let i=s.forwardRef(({className:e,...t},r)=>a.jsx("div",{ref:r,className:(0,o.cn)("rounded-xl border bg-card text-card-foreground shadow",e),...t}));i.displayName="Card";let n=s.forwardRef(({className:e,...t},r)=>a.jsx("div",{ref:r,className:(0,o.cn)("flex flex-col space-y-1.5 p-6",e),...t}));n.displayName="CardHeader";let l=s.forwardRef(({className:e,...t},r)=>a.jsx("div",{ref:r,className:(0,o.cn)("font-semibold leading-none tracking-tight",e),...t}));l.displayName="CardTitle";let d=s.forwardRef(({className:e,...t},r)=>a.jsx("div",{ref:r,className:(0,o.cn)("text-sm text-muted-foreground",e),...t}));d.displayName="CardDescription";let c=s.forwardRef(({className:e,...t},r)=>a.jsx("div",{ref:r,className:(0,o.cn)("p-6 pt-0",e),...t}));c.displayName="CardContent",s.forwardRef(({className:e,...t},r)=>a.jsx("div",{ref:r,className:(0,o.cn)("flex items-center p-6 pt-0",e),...t})).displayName="CardFooter"},54432:(e,t,r)=>{"use strict";r.d(t,{I:()=>i});var a=r(10326),s=r(17577),o=r(77863);let i=s.forwardRef(({className:e,type:t,...r},s)=>a.jsx("input",{type:t,className:(0,o.cn)("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",e),ref:s,...r}));i.displayName="Input"},45842:(e,t,r)=>{"use strict";r.d(t,{_:()=>c});var a=r(10326),s=r(17577),o=r(45226),i=s.forwardRef((e,t)=>(0,a.jsx)(o.WV.label,{...e,ref:t,onMouseDown:t=>{t.target.closest("button, input, select, textarea")||(e.onMouseDown?.(t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));i.displayName="Label";var n=r(79360),l=r(77863);let d=(0,n.j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),c=s.forwardRef(({className:e,...t},r)=>a.jsx(i,{ref:r,className:(0,l.cn)(d(),e),...t}));c.displayName=i.displayName},95035:(e,t,r)=>{"use strict";r.d(t,{a:()=>s});var a=r(2640);let s=()=>{let e=(0,a.o)(e=>e.user),t=(0,a.o)(e=>e.token),r=(0,a.o)(e=>e.isAuthenticated),s=(0,a.o)(e=>e.loading),o=(0,a.o)(e=>e.error),i=(0,a.o)(e=>e.success),n=(0,a.o)(e=>e.register),l=(0,a.o)(e=>e.login);return{user:e,token:t,isAuthenticated:r,loading:s,error:o,success:i,register:n,login:l,logout:(0,a.o)(e=>e.logout),getMe:(0,a.o)(e=>e.getMe),clearSuccess:(0,a.o)(e=>e.clearSuccess)}}},77863:(e,t,r)=>{"use strict";r.d(t,{cn:()=>i,p6:()=>n,rl:()=>d,uf:()=>l,vQ:()=>u,z2:()=>c});var a=r(41135),s=r(31009),o=r(2453);function i(...e){return(0,s.m6)((0,a.W)(e))}function n(e){return(0,o.WU)(new Date(e),"MMM dd, yyyy")}function l(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toString()}function d(e){return e.toFixed(2)+"%"}function c(e){return({active:"bg-green-100 text-green-800",learning:"bg-blue-100 text-blue-800",paused:"bg-gray-100 text-gray-800",draft:"bg-gray-100 text-gray-800",completed:"bg-purple-100 text-purple-800"})[e]||"bg-gray-100 text-gray-800"}function u(e){navigator.clipboard.writeText(e)}},35047:(e,t,r)=>{"use strict";var a=r(77389);r.o(a,"usePathname")&&r.d(t,{usePathname:function(){return a.usePathname}}),r.o(a,"useRouter")&&r.d(t,{useRouter:function(){return a.useRouter}})},32019:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});let a=(0,r(68570).createProxy)(String.raw`C:\MERN Project\behaveiq-platform\frontend\app\(auth)\register\page.tsx#default`)},57481:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s});var a=r(66621);let s=e=>[{type:"image/x-icon",sizes:"16x16",url:(0,a.fillMetadataSegment)(".",e.params,"favicon.ico")+""}]},45226:(e,t,r)=>{"use strict";r.d(t,{WV:()=>i});var a=r(17577);r(60962);var s=r(34214),o=r(10326),i=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"].reduce((e,t)=>{let r=(0,s.Z8)(`Primitive.${t}`),i=a.forwardRef((e,a)=>{let{asChild:s,...i}=e,n=s?r:t;return"undefined"!=typeof window&&(window[Symbol.for("radix-ui")]=!0),(0,o.jsx)(n,{...i,ref:a})});return i.displayName=`Primitive.${t}`,{...e,[t]:i}},{})},40381:(e,t,r)=>{"use strict";r.d(t,{Am:()=>F});var a,s=r(17577);let o={data:""},i=e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||o},n=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,l=/\/\*[^]*?\*\/|  +/g,d=/\n+/g,c=(e,t)=>{let r="",a="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?r=o+" "+i+";":a+="f"==o[1]?c(i,o):o+"{"+c(i,"k"==o[1]?"":t)+"}":"object"==typeof i?a+=c(i,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=c.p?c.p(o,i):o+":"+i+";")}return r+(t&&s?t+"{"+s+"}":s)+a},u={},p=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+p(e[r]);return t}return e},m=(e,t,r,a,s)=>{let o=p(e),i=u[o]||(u[o]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(o));if(!u[i]){let t=o!==e?e:(e=>{let t,r,a=[{}];for(;t=n.exec(e.replace(l,""));)t[4]?a.shift():t[3]?(r=t[3].replace(d," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(d," ").trim();return a[0]})(e);u[i]=c(s?{["@keyframes "+i]:t}:t,r?"":"."+i)}let m=r&&u.g?u.g:null;return r&&(u.g=u[i]),((e,t,r,a)=>{a?t.data=t.data.replace(a,e):-1===t.data.indexOf(e)&&(t.data=r?e+t.data:t.data+e)})(u[i],t,a,m),i},f=(e,t,r)=>e.reduce((e,a,s)=>{let o=t[s];if(o&&o.call){let e=o(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":c(e,""):!1===e?"":e}return e+a+(null==o?"":o)},"");function g(e){let t=this||{},r=e.call?e(t.p):e;return m(r.unshift?r.raw?f(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,i(t.target),t.g,t.o,t.k)}g.bind({g:1});let x,h,b,v=g.bind({k:1});function y(e,t){let r=this||{};return function(){let a=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;r.p=Object.assign({theme:h&&h()},n),r.o=/ *go\d+/.test(l),n.className=g.apply(r,a)+(l?" "+l:""),t&&(n.ref=i);let d=e;return e[0]&&(d=n.as||e,delete n.as),b&&d[0]&&b(n),x(d,n)}return t?t(s):s}}var w=e=>"function"==typeof e,j=(e,t)=>w(e)?e(t):e,N=(()=>{let e=0;return()=>(++e).toString()})(),P=((()=>{let e;return()=>e})(),"default"),q=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return q(e,{type:e.toasts.find(e=>e.id===a.id)?1:0,toast:a});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(e=>e.id===s||void 0===s?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},_=[],C={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},A={},k=(e,t=P)=>{A[t]=q(A[t]||C,e),_.forEach(([e,r])=>{e===t&&r(A[t])})},R=e=>Object.keys(A).forEach(t=>k(e,t)),M=e=>Object.keys(A).find(t=>A[t].toasts.some(t=>t.id===e)),$=(e=P)=>t=>{k(t,e)},S={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},z=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||N()}),E=e=>(t,r)=>{let a=z(t,e,r);return $(a.toasterId||M(a.id))({type:2,toast:a}),a.id},F=(e,t)=>E("blank")(e,t);F.error=E("error"),F.success=E("success"),F.loading=E("loading"),F.custom=E("custom"),F.dismiss=(e,t)=>{let r={type:3,toastId:e};t?$(t)(r):R(r)},F.dismissAll=e=>F.dismiss(void 0,e),F.remove=(e,t)=>{let r={type:4,toastId:e};t?$(t)(r):R(r)},F.removeAll=e=>F.remove(void 0,e),F.promise=(e,t,r)=>{let a=F.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?j(t.success,e):void 0;return s?F.success(s,{id:a,...r,...null==r?void 0:r.success}):F.dismiss(a),e}).catch(e=>{let s=t.error?j(t.error,e):void 0;s?F.error(s,{id:a,...r,...null==r?void 0:r.error}):F.dismiss(a)}),e};var I=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,D=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,O=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,G=(y("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${I} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${D} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${O} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`),Z=(y("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${G} 1s linear infinite;
`,v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`),L=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,T=(y("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${L} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,y("div")`
  position: absolute;
`,y("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`);y("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${T} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,y("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,y("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,a=s.createElement,c.p=void 0,x=a,h=void 0,b=void 0,g`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948,169,185,195],()=>r(99524));module.exports=a})();