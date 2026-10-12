import Sidebar from "./components/Sidebar";
import PromptBox from "./components/PromptBox";
import PreviewPanel from "./features/preview/PreviewPanel";
import type { PreviewFile } from "./features/preview/usePreviewSession";
import "./styles.css";

/**
 * Lightweight starter files make the preview workflow discoverable in the
 * workspace. Replace this array with GeneratedProject.files when the app
 * builder pipeline is connected to PromptBox.
 */
const starterPreviewFiles: PreviewFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "designbuddy-preview-starter",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite --host 0.0.0.0",
        build: "vite build",
        start: "vite preview --host 0.0.0.0"
      },
      dependencies: {
        "@vitejs/plugin-react": "latest",
        vite: "latest",
        react: "latest",
        "react-dom": "latest"
      },
      devDependencies: {}
    }, null, 2)
  },
  {
    path: "index.html",
    content: '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>DesignBuddy Preview</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>'
  },
  {
    path: "src/main.jsx",
    content: `import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="demo-shell">
      <nav className="demo-nav">
        <span className="demo-logo">D</span>
        <strong>designbuddy</strong>
        <span className="demo-nav-spacer" />
        <span className="demo-nav-link">Features</span>
        <span className="demo-nav-link">Resources</span>
        <button className="demo-nav-button">Get started</button>
      </nav>
      <section className="demo-hero">
        <span className="demo-pill">✦ AI-powered design workspace</span>
        <h1>Turn your ideas<br /><em>into something real.</em></h1>
        <p>From a first prompt to a polished experience. Design, build, and iterate in one collaborative workspace.</p>
        <div className="demo-actions">
          <button className="demo-primary">Start creating ↗</button>
          <button className="demo-secondary">Explore workspace</button>
        </div>
        <div className="demo-preview-card">
          <div className="demo-card-top"><span></span><span></span><span></span><small>Untitled project · Live preview</small></div>
          <div className="demo-card-content">
            <div><small>YOUR NEXT BIG IDEA</small><h2>A better way<br />to bring ideas<br />to life.</h2><p>One space for your team's best work.</p></div>
            <div className="demo-shapes"><span></span><span></span><span></span></div>
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);`
  },
  {
    path: "src/styles.css",
    content: `* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #202026; background: #f6f5f2; }
button { font: inherit; cursor: pointer; border: 0; }
.demo-shell { min-height: 100vh; overflow: hidden; background: #f6f5f2; }
.demo-nav { display: flex; align-items: center; gap: 12px; padding: 18px 6%; border-bottom: 1px solid #e9e7e2; }
.demo-logo { display: grid; place-items: center; width: 31px; height: 31px; border-radius: 9px; color: white; background: #6555df; font-weight: 800; }
.demo-nav-spacer { flex: 1; }
.demo-nav-link { color: #73717b; font-size: 12px; margin: 0 8px; }
.demo-nav-button, .demo-primary { background: #6555df; color: white; border-radius: 9px; padding: 10px 15px; font-size: 12px; }
.demo-hero { max-width: 860px; text-align: center; margin: 0 auto; padding: 46px 24px 70px; }
.demo-pill { display: inline-block; border: 1px solid #e4e0f9; color: #5a4aca; background: #eeebff; border-radius: 99px; padding: 7px 12px; font-size: 11px; }
.demo-hero h1 { margin: 21px 0 14px; letter-spacing: -.055em; font-size: clamp(36px, 5vw, 62px); line-height: 1.03; }
.demo-hero h1 em { color: #6555df; font-style: normal; }
.demo-hero p { max-width: 470px; margin: 0 auto; color: #75727b; line-height: 1.7; font-size: 13px; }
.demo-actions { display: flex; justify-content: center; gap: 10px; margin-top: 23px; }
.demo-primary, .demo-secondary { padding: 12px 16px; font-size: 12px; }
.demo-secondary { background: white; color: #393642; border: 1px solid #e7e4df; border-radius: 9px; }
.demo-preview-card { margin: 38px auto 0; overflow: hidden; max-width: 690px; border: 1px solid #e6e2dc; border-radius: 16px; box-shadow: 0 18px 55px #28203d12; background: white; text-align: left; }
.demo-card-top { display: flex; align-items: center; gap: 5px; border-bottom: 1px solid #eee; padding: 12px 15px; }
.demo-card-top span { width: 7px; height: 7px; border-radius: 50%; background: #dedbe6; }
.demo-card-top small { margin-left: 10px; color: #92909a; font-size: 10px; }
.demo-card-content { display: flex; align-items: center; justify-content: space-between; min-height: 220px; padding: 28px 8%; }
.demo-card-content small { color: #77718d; font-size: 9px; letter-spacing: .12em; }
.demo-card-content h2 { font-size: 30px; line-height: 1.06; letter-spacing: -.04em; margin: 10px 0; }
.demo-card-content p { margin: 0; font-size: 11px; }
.demo-shapes { position: relative; width: 180px; height: 160px; }
.demo-shapes span { position: absolute; display: block; border-radius: 18px; }
.demo-shapes span:nth-child(1) { width: 115px; height: 135px; right: 15px; top: 8px; background: linear-gradient(145deg,#c7c2ff,#7567e9); transform: rotate(8deg); }
.demo-shapes span:nth-child(2) { width: 90px; height: 95px; right: 75px; top: 48px; background: linear-gradient(145deg,#ffd6be,#ffad91); transform: rotate(-12deg); opacity: .95; }
.demo-shapes span:nth-child(3) { width: 54px; height: 54px; right: 0; top: 0; border-radius: 50%; background: #ece9ff; }
@media (max-width: 520px) { .demo-nav-link { display: none; } .demo-hero { padding: 38px 18px 45px; } .demo-card-content { padding: 22px 7%; } .demo-shapes { transform: scale(.72); transform-origin: right center; margin-left: -35px; } }
`
  },
  {
    path: "vite.config.js",
    content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n'
  }
];

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="workspace">
        <header className="workspace-heading">
          <div>
            <p className="workspace-eyebrow">AI DESIGN WORKSPACE</p>
            <h1>DesignBuddy AI</h1>
            <p className="workspace-subtitle">从一句想法开始，生成设计并即时预览。</p>
          </div>
        </header>
        <section className="workspace-prompt">
          <PromptBox />
        </section>
        <PreviewPanel
          projectId="designbuddy-starter"
          framework="react-vite"
          files={starterPreviewFiles}
        />
      </main>
    </div>
  );
}
