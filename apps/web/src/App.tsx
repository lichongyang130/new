import { useRef, useState } from "react";
import "./styles.css";

type IconProps = { name: string; size?: number };

const iconPaths: Record<string, string> = {
  panel: "M4 5h16M4 19h16M7 5v14",
  search: "m20 20-4.2-4.2M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  filter: "M4 5h16l-6.2 7.1v5.2l-3.6 1.8v-7Z",
  spark: "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z",
  plus: "M12 5v14M5 12h14",
  assistant: "M12 3 5.5 6v5.5c0 4.5 2.6 7.8 6.5 9.5 3.9-1.7 6.5-5 6.5-9.5V6L12 3ZM9 11l2 2 4-4",
  folder: "M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z",
  settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19.4 13.5l1.1.9-1.7 3-1.4-.5a7.8 7.8 0 0 1-1.6.9l-.3 1.5h-3.5l-.3-1.5a7.8 7.8 0 0 1-1.6-.9l-1.4.5-1.7-3 1.1-.9a7 7 0 0 1 0-1.9L7 10.7l1.7-3 1.4.5a7.8 7.8 0 0 1 1.6-.9l.3-1.5h3.5l.3 1.5a7.8 7.8 0 0 1 1.6.9l1.4-.5 1.7 3-1.1.9a7 7 0 0 1 0 1.9Z",
  expert: "M12 3 4.5 7v5c0 4.3 2.8 7.4 7.5 9 4.7-1.6 7.5-4.7 7.5-9V7L12 3ZM9 12l2 2 4-4",
  clock: "M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22ZM4 5.5v14A2.5 2.5 0 0 1 6.5 17H20",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  message: "M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.3-.7L4 20l1.2-4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z",
  file: "M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 13h8M8 17h6",
  chart: "M4 19V5M4 19h17M8 15l3-4 3 2 5-7",
  briefcase: "M3 8h18v11H3zM8 8V5h8v3M3 12h18M10 12v2h4v-2",
  layout: "M4 4h16v16H4zM4 9h16M10 9v11",
  code: "m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
  palette: "M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 1.3-4.6 1.5 1.5 0 0 1 .8-2.8H18a3 3 0 0 0 3-3c0-4.2-4-7.6-9-7.6ZM7.5 11h.1M10 7.5h.1M15 7.5h.1M17 11h.1",
  presentation: "M3 4h18v12H3zM12 16v5M8 21h8M7 8h4M7 12h8",
  chevron: "m9 18 6-6-6-6",
  down: "m7 10 5 5 5-5",
  mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3ZM5 11a7 7 0 0 0 14 0M12 18v4M9 22h6",
  send: "m22 2-7 20-4-9-9-4ZM22 2 11 13",
  shield: "M12 3 4.5 6v5c0 4.3 2.8 7.4 7.5 10 4.7-2.6 7.5-5.7 7.5-10V6Z",
  bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
  device: "M3 5h13v10H3zM7 19h5M18 9h3v11h-8v-4"
};

function Icon({ name, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={iconPaths[name] ?? iconPaths.spark} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { label: "新建任务", icon: "plus", prominent: true },
  { label: "助理", icon: "assistant", beta: true },
  { label: "专家·技能·连接器", icon: "expert" },
  { label: "定时任务", icon: "clock" },
  { label: "资料库", icon: "book" },
  { label: "更多", icon: "grid", hint: "灵感" }
];

const modes = [
  { label: "日常办公", icon: "briefcase" },
  { label: "代码开发", icon: "code" },
  { label: "设计创意", icon: "palette" }
];

const quickActions = [
  { label: "文档处理", icon: "file" },
  { label: "金融服务", icon: "briefcase" },
  { label: "数据分析及可视化", icon: "chart" },
  { label: "个人工作台", icon: "layout" },
  { label: "幻灯片", icon: "presentation" },
  { label: "代码助手", icon: "code" },
  { label: "创意设计", icon: "palette" }
];

export default function App() {
  const [activeNav, setActiveNav] = useState("新建任务");
  const [activeMode, setActiveMode] = useState("日常办公");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("Step-5-Preview");
  const [workspace, setWorkspace] = useState("选择工作空间");
  const [permission, setPermission] = useState("默认权限");
  const [notice, setNotice] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);

  const submitPrompt = () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;
    setNotice("需求已准备就绪。连接任务执行服务后，即可在这里启动 AI 助理。");
  };

  return (
    <div className="workbuddy-app">
      <aside className="app-sidebar">
        <div className="sidebar-windowbar">
          <div className="window-dots" aria-label="窗口控制">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
          </div>
          <div className="sidebar-utilities">
            <button type="button" aria-label="收起侧边栏"><Icon name="panel" size={17} /></button>
            <button type="button" aria-label="搜索"><Icon name="search" size={17} /></button>
            <button type="button" aria-label="筛选"><Icon name="filter" size={17} /></button>
          </div>
        </div>

        <div className="brand-row">
          <div className="brand-lockup">
            <strong>WorkBuddy</strong>
            <span>5.7.7</span>
          </div>
          <button type="button" className="discover-button" onClick={() => setNotice("应用中心入口已选中。")}>
            <Icon name="spark" size={13} />
            <span>发现应用</span>
            <Icon name="down" size={12} />
          </button>
        </div>

        <nav className="sidebar-navigation" aria-label="主导航">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`sidebar-nav-item ${activeNav === item.label ? "is-active" : ""} ${item.prominent ? "is-prominent" : ""}`}
              onClick={() => {
                setActiveNav(item.label);
                setNotice(item.label === "新建任务" ? "" : `已切换到「${item.label}」入口。当前展示的是首页模板。`);
              }}
            >
              <Icon name={item.icon} size={17} />
              <span className="sidebar-nav-label">{item.label}</span>
              {item.beta && <span className="beta-label">BETA</span>}
              {item.hint && <span className="nav-hint">{item.hint}</span>}
              {item.label === "助理" && (
                <span className="nav-trailing-actions">
                  <span onClick={(event) => event.stopPropagation()}><Icon name="folder" size={16} /></span>
                  <span onClick={(event) => event.stopPropagation()}><Icon name="settings" size={16} /></span>
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-lists">
          <button type="button" onClick={() => setNotice("任务列表入口已选中。")}>任务 <span>(3)</span></button>
          <button type="button" onClick={() => setNotice("空间列表入口已选中。")}>空间 <span>(2)</span></button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar"><Icon name="spark" size={20} /></div>
          <strong>19932101651</strong>
          <button type="button" aria-label="通知" onClick={() => setNotice("暂时没有新的通知。")}><Icon name="bell" size={17} /></button>
          <button type="button" aria-label="设备" onClick={() => setNotice("桌面端工作空间")}><Icon name="device" size={17} /></button>
        </div>
      </aside>

      <main className="main-workspace">
        <button type="button" className="top-promo" onClick={() => setNotice("做任务赢积分活动入口已选中。")}>
          <span className="promo-mark"><Icon name="assistant" size={13} /></span>
          <span>做任务赢积分好礼</span>
          <Icon name="chevron" size={14} />
        </button>

        <section className="home-content" aria-label="新建任务">
          <header className="welcome-header">
            <h1>WorkBuddy, 我帮你</h1>
            <div className="mode-switch" role="tablist" aria-label="任务模式">
              {modes.map((mode) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMode === mode.label}
                  className={activeMode === mode.label ? "mode-tab is-selected" : "mode-tab"}
                  key={mode.label}
                  onClick={() => setActiveMode(mode.label)}
                >
                  <Icon name={mode.icon} size={15} />
                  {mode.label}
                </button>
              ))}
            </div>
          </header>

          <div className="quick-actions-row">
            <div className="quick-actions-list" ref={quickActionsRef}>
              {quickActions.map((action) => (
                <button
                  type="button"
                  className="quick-action-chip"
                  key={action.label}
                  onClick={() => {
                    setPrompt((current) => current ? `${current}，请使用「${action.label}」能力完成。 ` : `请帮我完成一项「${action.label}」任务：`);
                    setNotice("");
                  }}
                >
                  <Icon name={action.icon} size={15} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="quick-scroll-button"
              aria-label="查看更多能力"
              onClick={() => quickActionsRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
            >
              <Icon name="chevron" size={16} />
            </button>
            <div className="buddy-mascot" aria-label="WorkBuddy 助手形象">
              <span className="mascot-status"><Icon name="spark" size={10} /></span>
              <div className="mascot-antenna" />
              <div className="mascot-head">
                <span className="mascot-ear mascot-ear--left" />
                <span className="mascot-ear mascot-ear--right" />
                <div className="mascot-face"><i /><i /><b /></div>
              </div>
              <div className="mascot-body" />
            </div>
          </div>

          <form
            className="composer-shell"
            onSubmit={(event) => {
              event.preventDefault();
              submitPrompt();
            }}
          >
            <div className="composer-main">
              <textarea
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setNotice("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitPrompt();
                  }
                }}
                aria-label="描述任务"
                placeholder="今天帮你做些什么？ @ 添加上下文，/ 调用技能与指令"
                rows={3}
              />
              {attachedFiles.length > 0 && (
                <div className="attachment-list">
                  {attachedFiles.map((file) => <span className="attachment-chip" key={file}><Icon name="file" size={12} />{file}</span>)}
                </div>
              )}
              <div className="composer-controls">
                <button type="button" className="attach-button" aria-label="添加文件" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="plus" size={21} />
                </button>
                <input
                  ref={fileInputRef}
                  className="visually-hidden-input"
                  type="file"
                  multiple
                  onChange={(event) => {
                    const names = Array.from(event.target.files ?? []).map((file) => file.name);
                    setAttachedFiles((current) => [...current, ...names].slice(0, 5));
                    setNotice("");
                    event.currentTarget.value = "";
                  }}
                />
                <div className="composer-actions-right">
                  <label className="model-picker" aria-label="选择模型">
                    <span className="model-spark">▰</span>
                    <select value={model} onChange={(event) => setModel(event.target.value)}>
                      <option>Step-5-Preview</option>
                      <option>Auto</option>
                      <option>DeepSeek</option>
                      <option>Claude</option>
                    </select>
                    <Icon name="down" size={12} />
                  </label>
                  <button type="button" className="microphone-button" aria-label="语音输入" onClick={() => setNotice("语音输入功能尚未连接。")}><Icon name="mic" size={17} /></button>
                  <button type="submit" className="send-button" aria-label="发送任务" disabled={!prompt.trim() && attachedFiles.length === 0}>
                    <Icon name="send" size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="composer-footer">
              <label className="footer-select">
                <Icon name="folder" size={16} />
                <select value={workspace} onChange={(event) => setWorkspace(event.target.value)} aria-label="工作空间">
                  <option>选择工作空间</option>
                  <option>个人空间</option>
                  <option>默认工作空间</option>
                  <option>新建工作空间</option>
                </select>
                <Icon name="down" size={12} />
              </label>
              <label className="footer-select">
                <Icon name="shield" size={16} />
                <select value={permission} onChange={(event) => setPermission(event.target.value)} aria-label="权限设置">
                  <option>默认权限</option>
                  <option>每次操作前确认</option>
                  <option>允许安全操作</option>
                </select>
                <Icon name="down" size={12} />
              </label>
            </div>
          </form>

          {notice && <div className="home-notice" role="status"><Icon name="spark" size={15} /><span>{notice}</span><button type="button" aria-label="关闭提示" onClick={() => setNotice("")}>×</button></div>}
        </section>
      </main>
    </div>
  );
}
