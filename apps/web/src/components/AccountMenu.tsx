import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AIProviderSettings } from "../../../../frontend/workspace/AIProviderSettings";
import { HomeIcon, type HomeIconName } from "./HomeIcon";
import avatarImage from "../assets/home-avatar.png";
import "./account-menu.css";

const accountActions: { label: string; icon: HomeIconName; hint?: string; arrow?: boolean; fresh?: boolean; message: string }[] = [
  { label: "Buddy加油站", icon: "fuel", arrow: true, message: "Buddy 加油站尚未接入。当前没有可领取的积分，也不会改变积分余额。" },
  { label: "去邀约", icon: "invite", hint: "最高得 650 积分/人", arrow: true, message: "截图中的邀约奖励为参考展示。邀请服务尚未接入，暂不能生成邀请链接或领取积分。" },
  { label: "成长计划", icon: "growth", hint: "连登抽取 Buddy 周边", message: "成长计划尚未接入。此处仅保留参考入口，不会模拟签到、抽奖或发放奖品。" },
  { label: "设置", icon: "settings", hint: "⌘,", message: "当前为本地工作区，项目和对话保存在此浏览器。可在下方配置 AI 服务。" },
  { label: "外观", icon: "palette", hint: "外观上新", arrow: true, fresh: true, message: "当前使用截图中的浅色外观。主题切换尚未接入，当前不会更改系统或浏览器的外观设置。" },
  { label: "记忆与进化", icon: "bulb", message: "当前只保留此浏览器中的项目与对话历史，尚未接入跨对话长期记忆服务。AI 不会据此假设知道你的其他经历。" },
  { label: "意见反馈", icon: "help", message: "可在项目的问题页面提交反馈。请勿包含 API 密钥、私人对话或其他敏感信息。" },
  { label: "检查更新", icon: "update", message: "当前界面显示参考版本 5.7.7，尚未接入版本检查服务，无法确认是否为最新版本。" },
  { label: "退出登录", icon: "logout", message: "当前为本地工作区，账号登录服务尚未接入，没有可退出的账号会话。此操作不会删除本地项目、对话或 AI 服务配置。" },
];

/** Shared, non-modal account popover. Account/billing data is not fabricated. */
export function AccountMenu() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<{ label: string; message: string } | null>(null);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  function close(restoreFocus = false) {
    setOpen(false);
    setDetail(null);
    if (restoreFocus) trigger.current?.focus();
  }

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const popup = panel.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const x = viewport?.offsetLeft || 0;
      const y = viewport?.offsetTop || 0;
      const above = anchor.top - popup.height - 8;
      const top = above >= y + 8 ? above : Math.min(anchor.bottom + 8, y + height - popup.height - 8);
      setPosition({ left: Math.max(x + 8, Math.min(anchor.left - 8, x + width - popup.width - 8)), top: Math.max(y + 8, top) });
    };
    const outside = (event: Event) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) close();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(true); }
    };
    updatePosition();
    panel.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(updatePosition);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open) { panel.current?.focus({ preventScroll: true }); panel.current?.scrollTo(0, 0); }
  }, [detail, open]);

  function keyboardNavigation(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || (event.target instanceof HTMLElement && event.target.matches('input, select, textarea'))) return;
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || []);
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current <= 0 ? items.length : current) - 1;
    items[next]?.focus();
  }

  return <>
    <button ref={trigger} className="profile-trigger" title="账号菜单" aria-label="账号菜单：19932101651" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => open ? close() : setOpen(true)}>
      <img className="profile-avatar" src={avatarImage} alt="" width="33" height="33" />
      <strong>19932101651</strong>
    </button>
    {open && createPortal(<div ref={panel} id={id} role="dialog" aria-label="账号菜单" tabIndex={-1} className="account-popover" style={position} onKeyDown={keyboardNavigation}>
      {detail ? <section className="account-detail">
        <header><button aria-label="返回账号菜单" onClick={() => setDetail(null)}><HomeIcon name="chevron" /></button><h2>{detail.label}</h2><button aria-label="关闭账号菜单" onClick={() => close(true)}>×</button></header>
        <p>{detail.message}</p>
        {detail.label === "设置" && <AIProviderSettings />}
        {detail.label === "意见反馈" && <a href="https://github.com/lichongyang130/new/issues" target="_blank" rel="noopener noreferrer">打开项目反馈页面 <HomeIcon name="chevron" size={12} /></a>}
      </section> : <>
        <div className="account-identity" title="本地工作区展示身份，尚未连接账号"><img src={avatarImage} alt="" width="42" height="42" /><strong>199****1651</strong></div>
        <section className="account-plan" aria-label="套餐与积分">
          <div><span>套餐</span><strong title="本地体验界面，非实际订阅">体验版</strong><button className="account-upgrade" onClick={() => setDetail({ label: "升级套餐", message: "套餐与支付服务尚未接入，暂不支持升级或购买。当前不会产生费用。" })}>升级套餐</button></div>
          <div><span>积分余额</span><strong title="尚未接入积分服务" aria-label="积分余额：尚未接入">—</strong><button className="account-purchase" disabled title="积分购买尚未接入">购买积分</button></div>
        </section>
        <div className="account-actions">
          {accountActions.map((action, index) => <div key={action.label} className={`${index === 3 || index === 8 ? "account-separated" : ""}`}>
            <button className={`account-action ${index < 3 ? "account-action-promo" : ""}`} onClick={() => setDetail({ label: action.label, message: action.message })}>
              <HomeIcon name={action.icon} size={17} /><span>{action.label}</span>
              {action.hint && <small>{action.fresh && <i />}{action.hint}</small>}
              {action.arrow && <HomeIcon name="chevron" size={10} />}
            </button>
          </div>)}
        </div>
      </>}
    </div>, document.body)}
  </>;
}
