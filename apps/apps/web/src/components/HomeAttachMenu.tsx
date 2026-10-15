import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { HomeIcon, type HomeIconName } from "./HomeIcon";
import { HomeModeIcon } from "./HomeModeIcon";
import { expertCatalog } from "../../../../frontend/workspace/expertCatalog";
import { skillCatalog } from "../../../../frontend/workspace/skillCatalog";
import { connectorCatalog } from "../../../../frontend/workspace/connectorCatalog";
import { useWorkspaceStore } from "../../../../frontend/workspace/store";
import "./home-attach-menu.css";

type Mode = "office" | "code" | "design";
type Category = "file" | "mode" | "expert" | "skill" | "connector";
type Entry = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  requirement?: string;
};
const categories: { id: Category; label: string; icon: HomeIconName }[] = [
  { id: "file", label: "添加文件", icon: "document" },
  { id: "mode", label: "模式", icon: "bolt" },
  { id: "expert", label: "专家", icon: "experts" },
  { id: "skill", label: "技能", icon: "tools" },
  { id: "connector", label: "连接器", icon: "link" },
];
const modes: { id: Mode; name: string }[] = [
  { id: "office", name: "日常办公" },
  { id: "code", name: "代码开发" },
  { id: "design", name: "设计创意" },
];
const moreLinks = {
  expert: { label: "召唤更多专家", path: "/experts" },
  skill: { label: "发现更多技能", path: "/skills" },
  connector: { label: "管理连接器", path: "/connectors" },
};
function unique(items: Entry[]) {
  return items.filter(
    (item, index) =>
      items.findIndex(
        (other) => other.id === item.id || other.name === item.name,
      ) === index,
  );
}

type Props = {
  mode: Mode;
  selectedExpert: string;
  selectedSkill: string;
  onOpen(): void;
  onUpload(): void;
  onModeChange(mode: Mode): void;
  onExpertSelect(name: string): void;
  onSkillSelect(name: string, requirement?: string): void;
  onNavigate(path: string): void;
};

export function HomeAttachMenu(props: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [compact, setCompact] = useState(() => window.innerWidth < 600);
  const host = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const primary = useRef<HTMLDivElement>(null);
  const secondary = useRef<HTMLDivElement>(null);
  const personalExperts = useWorkspaceStore((state) => state.experts);
  const personalSkills = useWorkspaceStore((state) => state.skills);
  const personalConnectors = useWorkspaceStore((state) => state.connectors);
  const experts = useMemo(
    () =>
      unique([
        ...personalExperts.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
        })),
        ...[...expertCatalog]
          .sort(
            (a, b) =>
              Number(b.id === "builtin-developer") -
              Number(a.id === "builtin-developer"),
          )
          .map((item) => ({ ...item, image: item.avatar })),
      ]),
    [personalExperts],
  );
  const skills = useMemo(
    () =>
      unique([
        ...personalSkills.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          image: skillCatalog.find((skill) => skill.id === item.id)?.icon,
          requirement: skillCatalog.find((skill) => skill.id === item.id)
            ?.requirement,
        })),
        ...skillCatalog.map((item) => ({ ...item, image: item.icon })),
      ]),
    [personalSkills],
  );
  const connectors = useMemo(
    () =>
      unique([
        ...connectorCatalog.map((item) => ({ ...item, image: item.icon })),
        ...personalConnectors.map((item) => ({ id: item.id, name: item.name })),
      ]),
    [personalConnectors],
  );
  const entries =
    active === "expert" ? experts : active === "skill" ? skills : connectors;
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = normalized
    ? entries.filter((item) =>
        `${item.name} ${item.description || ""}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
    : entries.slice(0, 5);
  const activeLabel =
    categories.find((item) => item.id === active)?.label || "";
  const isCatalog =
    active === "expert" || active === "skill" || active === "connector";

  function close(restoreFocus = false) {
    setOpen(false);
    setActive(null);
    setQuery("");
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }
  function show(category: Category, focus = false) {
    if (category !== active) setQuery("");
    setActive(category);
    if (focus)
      requestAnimationFrame(() =>
        secondary.current
          ?.querySelector<HTMLElement>(
            "input, [role=menuitemradio], .home-attach-entry, .home-attach-upload",
          )
          ?.focus({ preventScroll: true }),
      );
  }
  function back() {
    const previous = active;
    setActive(null);
    setQuery("");
    requestAnimationFrame(() =>
      primary.current
        ?.querySelector<HTMLButtonElement>(`[data-category="${previous}"]`)
        ?.focus({ preventScroll: true }),
    );
  }
  function navigate(path: string) {
    close();
    props.onNavigate(path);
  }

  useEffect(() => {
    const resize = () => setCompact(window.innerWidth < 600);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !host.current?.contains(event.target))
        close();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !trigger.current || !primary.current) return;
    const place = () => {
      if (!trigger.current || !primary.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const clampY = (top: number, height: number) =>
        Math.max(12, Math.min(top, viewportHeight - height - 12));
      const root = primary.current;
      const rootBox = root.getBoundingClientRect();
      let left = Math.max(
        12,
        Math.min(anchor.left, viewportWidth - rootBox.width - 12),
      );
      const popup = secondary.current;
      if (compact && active && popup) {
        const box = popup.getBoundingClientRect();
        popup.style.left = `${Math.max(12, Math.min(anchor.left, viewportWidth - box.width - 12))}px`;
        popup.style.top = `${clampY(anchor.top - box.height - 10, box.height)}px`;
        return;
      }
      const top = clampY(anchor.top - rootBox.height - 10, rootBox.height);
      root.style.left = `${left}px`;
      root.style.top = `${top}px`;
      if (popup && active) {
        const box = popup.getBoundingClientRect();
        let childLeft = left + rootBox.width + 6;
        if (childLeft + box.width > viewportWidth - 12) {
          if (left - box.width - 6 >= 12) childLeft = left - box.width - 6;
          else {
            left = Math.max(12, viewportWidth - rootBox.width - box.width - 18);
            root.style.left = `${left}px`;
            childLeft = left + rootBox.width + 6;
          }
        }
        const row = root.querySelector<HTMLElement>(
          `[data-category="${active}"]`,
        );
        popup.style.left = `${childLeft}px`;
        popup.style.top = `${clampY((row?.getBoundingClientRect().top || top) - 8, box.height)}px`;
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(primary.current);
    if (secondary.current) observer.observe(secondary.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, active, compact, query]);

  function primaryKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = Array.from(
        primary.current?.querySelectorAll<HTMLButtonElement>(
          "[data-category]",
        ) || [],
      );
      const current = items.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowDown"
              ? (current + 1) % items.length
              : (current - 1 + items.length) % items.length;
      items[next]?.focus();
    } else if (event.key === "ArrowRight") {
      const category = (document.activeElement as HTMLElement)?.dataset
        .category as Category | undefined;
      if (category) {
        event.preventDefault();
        show(category, true);
      }
    }
  }
  function secondaryKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.key === "ArrowLeft" &&
      !(event.target instanceof HTMLInputElement)
    ) {
      event.preventDefault();
      back();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    if (event.target instanceof HTMLInputElement && event.key !== "ArrowDown")
      return;
    const items = Array.from(
      secondary.current?.querySelectorAll<HTMLButtonElement>(
        ".home-attach-entry, .home-attach-upload, .home-attach-more",
      ) || [],
    );
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (current + 1) % items.length
            : (current - 1 + items.length) % items.length;
    items[next]?.focus({ preventScroll: true });
    items[next]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <span ref={host} className="home-attach-host">
      <button
        ref={trigger}
        className={`attach-button${open ? " is-open" : ""}`}
        title={open ? "关闭添加菜单" : "添加附件"}
        aria-label={open ? "关闭添加菜单" : "添加附件"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) close(true);
          else {
            props.onOpen();
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            props.onOpen();
            setOpen(true);
            requestAnimationFrame(() =>
              primary.current
                ?.querySelector<HTMLButtonElement>("[data-category]")
                ?.focus(),
            );
          }
        }}
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="m7 7 10 10M7 17 17 7" />
          </svg>
        ) : (
          <HomeIcon name="plus" size={20} />
        )}
      </button>
      {open && (
        <>
          <div
            ref={primary}
            className={`home-attach-primary${compact && active ? " is-hidden" : ""}`}
            role="menu"
            aria-label="添加到任务"
            onKeyDown={primaryKeys}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="menuitem"
                data-category={category.id}
                aria-haspopup={
                  category.id === "file" || category.id === "mode"
                    ? "menu"
                    : "dialog"
                }
                aria-expanded={active === category.id}
                className={`home-attach-category${active === category.id ? " is-active" : ""}`}
                onMouseEnter={() => {
                  if (!compact) show(category.id);
                }}
                onClick={() => show(category.id, true)}
              >
                {category.id === "file" ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="m8 13 7-7a3 3 0 0 1 4 4l-9 9a5 5 0 0 1-7-7l9-9m-6 12 9-9" />
                  </svg>
                ) : (
                  <HomeIcon name={category.icon} />
                )}
                <span>{category.label}</span>
                <HomeIcon name="chevron" size={12} />
              </button>
            ))}
          </div>
          {active && (
            <div
              ref={secondary}
              className="home-attach-secondary"
              role={isCatalog ? "dialog" : "menu"}
              aria-label={`${activeLabel}选项`}
              onKeyDown={secondaryKeys}
            >
              {compact && (
                <button className="home-attach-back" onClick={back}>
                  <HomeIcon name="chevron" size={12} />
                  返回 · {activeLabel}
                </button>
              )}
              {active === "file" && (
                <>
                  <button
                    className="home-attach-upload"
                    role="menuitem"
                    onClick={() => {
                      props.onUpload();
                      close(true);
                    }}
                  >
                    <HomeIcon name="document" />
                    上传本地文件
                  </button>
                  <p className="home-attach-help">
                    最多保留 4 个附件。文本文件可读取；PDF
                    和图片目前仅附上文件名，不会解析其内容。
                  </p>
                </>
              )}
              {active === "mode" &&
                modes.map((item) => (
                  <button
                    className="home-attach-entry"
                    key={item.id}
                    role="menuitemradio"
                    aria-checked={props.mode === item.id}
                    onClick={() => {
                      props.onModeChange(item.id);
                      close(true);
                    }}
                  >
                    <HomeModeIcon mode={item.id} />
                    <span>{item.name}</span>
                    {props.mode === item.id && (
                      <HomeIcon name="check" size={14} />
                    )}
                  </button>
                ))}
              {isCatalog && (
                <>
                  <label className="home-attach-search">
                    <HomeIcon name="search" />
                    <input
                      aria-label={`搜索${activeLabel}`}
                      placeholder={`搜索${activeLabel}`}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <div className="home-attach-results">
                    {filtered.map((item) => (
                      <button
                        className="home-attach-entry"
                        key={item.id}
                        title={
                          active === "connector"
                            ? "查看配置，不会自动授权或调用外部服务"
                            : item.description
                        }
                        aria-pressed={
                          active === "expert"
                            ? props.selectedExpert === item.name
                            : active === "skill"
                              ? props.selectedSkill === item.name
                              : undefined
                        }
                        onClick={() => {
                          if (active === "connector") {
                            navigate(
                              `/connectors/${encodeURIComponent(item.id)}`,
                            );
                            return;
                          }
                          close();
                          if (active === "expert")
                            props.onExpertSelect(item.name);
                          else props.onSkillSelect(item.name, item.requirement);
                        }}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" />
                        ) : (
                          <span
                            className="home-attach-avatar"
                            aria-hidden="true"
                          >
                            {item.name.slice(0, 1)}
                          </span>
                        )}
                        <span>{item.name}</span>
                        {((active === "expert" &&
                          props.selectedExpert === item.name) ||
                          (active === "skill" &&
                            props.selectedSkill === item.name)) && (
                          <HomeIcon name="check" size={13} />
                        )}
                      </button>
                    ))}
                    {!filtered.length && (
                      <p className="home-attach-empty" role="status">
                        没有找到匹配的{activeLabel}
                      </p>
                    )}
                  </div>
                  <button
                    className="home-attach-more"
                    onClick={() => navigate(moreLinks[active].path)}
                  >
                    <span aria-hidden="true">↗</span>
                    {moreLinks[active].label}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </span>
  );
}
