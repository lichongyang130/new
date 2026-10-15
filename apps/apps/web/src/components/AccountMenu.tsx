import { apiJSON } from "../api/client";
import {
  useId,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { openSettings } from "../../../../frontend/workspace/settingsStore";
import { HomeIcon } from "./HomeIcon";
import avatarImage from "../assets/home-avatar.png";
import "./account-menu.css";

/** A lightweight settings entry; no promotional, billing or fake account actions. */
export function AccountMenu() {
  const id = useId();
  const [serverName, setServerName] = useState<string | null>(null);
  useEffect(() => {
    let active = true,
      generation = 0;
    const refresh = () => {
      const attempt = ++generation;
      void apiJSON<{ user: { username: string | null } }>("/auth/me")
        .then((data) => {
          if (active && generation === attempt)
            setServerName(data.user.username);
        })
        .catch(() => {
          if (active && generation === attempt) setServerName(null);
        });
    };
    refresh();
    window.addEventListener("designbuddy:server-identity", refresh);
    return () => {
      active = false;
      window.removeEventListener("designbuddy:server-identity", refresh);
    };
  }, []);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect(),
        box = panel.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const width = viewport?.width || window.innerWidth,
        height = viewport?.height || window.innerHeight;
      const x = viewport?.offsetLeft || 0,
        y = viewport?.offsetTop || 0;
      const above = anchor.top - box.height - 8;
      setPosition({
        left: Math.max(
          x + 8,
          Math.min(anchor.left - 8, x + width - box.width - 8),
        ),
        top: Math.max(
          y + 8,
          Math.min(
            above >= y + 8 ? above : anchor.bottom + 8,
            y + height - box.height - 8,
          ),
        ),
      });
    };
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      )
        close();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    place();
    panel.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(place);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }
  return (
    <>
      <button
        ref={trigger}
        className="profile-trigger"
        title="设置"
        aria-label={`账号菜单：${serverName || "19932101651"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <img
          className="profile-avatar"
          src={avatarImage}
          alt=""
          width="33"
          height="33"
        />
        <strong>{serverName || "19932101651"}</strong>
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label="账号菜单"
            tabIndex={-1}
            className="account-popover account-settings-menu"
            style={position}
            onKeyDown={keyboard}
          >
            <button
              className="account-action"
              aria-label="设置"
              onClick={() => {
                close();
                openSettings("general", trigger.current);
              }}
            >
              <HomeIcon name="settings" size={17} />
              <span>设置</span>
              <small>⌘ ,</small>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
