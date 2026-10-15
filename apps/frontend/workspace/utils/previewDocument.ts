import type { ProjectFile } from "../models/project";

/**
 * Inlines a project's stylesheet and entry script into a single standalone HTML
 * document so it can be rendered inside a sandboxed iframe without a server.
 *
 * The generated app never receives an origin of its own: callers must mount the
 * result with a restrictive `sandbox` attribute.
 */
export function buildPreviewDocument(files: ProjectFile[], inspect = true): string {
  const htmlFile = files.find((file) => file.path === "index.html");
  const css = files.find((file) => file.path === "src/styles.css")?.content ?? "";
  const js = files.find((file) => file.path === "src/main.js")?.content ?? "";
  let html = htmlFile?.content ?? "<!doctype html><html><body><h1>新建页面</h1></body></html>";
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  html = html.replace(/<link[^>]+href=["']\.\/src\/styles\.css["'][^>]*>/i, `<style>${safeCss}</style>`);
  html = html.replace(/<script[^>]+src=["']\.\/src\/main\.js["'][^>]*><\/script>/i, `<script>${safeJs}<\/script>`);
  const editorBridge = `<style>[data-db-selected]{outline:2px solid #7458ed!important;outline-offset:2px!important;cursor:crosshair!important}</style><script>(function(){let selected='';function path(el){const parts=[];while(el&&el!==document.body){let part=el.tagName.toLowerCase();if(el.id){part+='#'+CSS.escape(el.id);parts.unshift(part);break}const siblings=el.parentElement?[...el.parentElement.children].filter(x=>x.tagName===el.tagName):[];if(siblings.length>1)part+=':nth-of-type('+(siblings.indexOf(el)+1)+')';parts.unshift(part);el=el.parentElement}return parts.join(' > ')}document.addEventListener('click',function(e){const a=e.target.closest('a');if(a&&a.getAttribute('href')?.startsWith('#'))e.preventDefault();const el=e.target.closest('body *');if(!el)return;e.preventDefault();e.stopPropagation();selected=path(el);document.querySelectorAll('[data-db-selected]').forEach(x=>x.removeAttribute('data-db-selected'));el.setAttribute('data-db-selected','');parent.postMessage({type:'db-select',selector:selected,tag:el.tagName.toLowerCase(),text:(el.innerText||'').slice(0,100)},'*')},true);addEventListener('message',function(e){if(e.data?.type==='db-style'&&selected){const el=document.querySelector(selected);if(el)el.style.setProperty(e.data.property,e.data.value)}});})();<\/script>`;
  if (inspect) html = html.replace(/<\/body>/i, `${editorBridge}</body>`);
  return html;
}
