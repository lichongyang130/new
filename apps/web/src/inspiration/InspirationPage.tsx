import { useState } from "react";
import { WorkBuddySidebar } from "../components/WorkBuddySidebar";
import { HomeIcon } from "../components/HomeIcon";
import { listProjects } from "../../../../frontend/workspace/projectStore";
import { navigateTo } from "../../../../frontend/workspace/workspaceRoutes";
import TravelPrototype, { TravelCover } from "./samples/TravelPrototype";
import SlideDeck, { SlideCanvas, CityDeck } from "./samples/SlideDeck";
import ResearchReport, {
  ReportPaper,
  TravelHandbook,
} from "./samples/ResearchReport";
import BrandGallery, {
  BrandArtwork,
  NatureGallery,
} from "./samples/BrandGallery";
import { drafts, samples, type SampleId } from "./samples/shared";
import MuseumPrototype, { MuseumCover } from "./samples/MuseumPrototype";
import { HandbookPaper } from "./samples/HandbookPaper";
import { NatureArtwork } from "./samples/NatureArtwork";
import "./samples/samples.css";
import "./samples/expansion.css";
function Preview({ id }: { id: SampleId }) {
  return (
    <div className={`sample-preview preview-${id}`} aria-hidden="true">
      {id === "museum" ? (
        <MuseumCover />
      ) : id === "city" ? (
        <SlideCanvas variant="city" />
      ) : id === "handbook" ? (
        <HandbookPaper />
      ) : id === "nature" ? (
        <NatureArtwork />
      ) : id === "travel" ? (
        <TravelCover />
      ) : id === "luma" ? (
        <SlideCanvas />
      ) : id === "research" ? (
        <ReportPaper />
      ) : (
        <BrandArtwork />
      )}
    </div>
  );
}
export default function InspirationPage({ pathname }: { pathname: string }) {
  const [category, choose] = useState("全部");
  const [query, search] = useState("");
  const [mine, showMine] = useState(false);
  const [notice, msg] = useState("");
  const parts = pathname.split("/").filter(Boolean);
  const sample = samples.find((x) => x.id === parts[1]);
  const draftId =
    parts[2] === "draft" && /^[a-zA-Z0-9-]{1,60}$/.test(parts[3] || "")
      ? parts[3]
      : undefined;
  const valid =
    sample &&
    (parts.length === 2 ||
      (parts.length === 4 &&
        draftId &&
        drafts().some((d) => d.id === draftId && d.sample === sample.id)));
  const viewers = {
    travel: TravelPrototype,
    luma: SlideDeck,
    research: ResearchReport,
    chishan: BrandGallery,
    museum: MuseumPrototype,
    city: CityDeck,
    handbook: TravelHandbook,
    nature: NatureGallery,
  };
  const Viewer = sample ? viewers[sample.id] : null;
  const visible = samples.filter(
    (x) =>
      (category === "全部" || category === x.category) &&
      `${x.title}${x.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const copies = drafts().filter((d) => visible.some((x) => x.id === d.sample));
  return (
    <div className="workbuddy-app samples-workspace">
      <WorkBuddySidebar
        active="templates"
        projectCount={listProjects().length}
        go={navigateTo}
        setNotice={msg}
      />
      {parts.length > 1 ? (
        valid && Viewer ? (
          <Viewer
            key={`${sample.id}-${draftId || "sample"}`}
            draftId={draftId}
          />
        ) : (
          <main className="sample-unavailable">
            <h1>这个旧案例已下架，或副本不存在</h1>
            <p>
              原来的通用工作台案例已撤下。新版社区提供四种独立作品形态的完整样板。
            </p>
            <button onClick={() => navigateTo("/inspiration")}>
              返回新版社区
            </button>
          </main>
        )
      ) : (
        <main className="samples-community" aria-label="灵感模版社区">
          <header className="samples-heading">
            <div>
              <h1>社区</h1>
              <p>8 套完整作品，4 种真正不同的创作形式。</p>
            </div>
            <button aria-pressed={mine} onClick={() => showMine(!mine)}>
              {mine ? "返回精选样板" : `我的副本（${drafts().length}）`}
            </button>
          </header>
          <div className="samples-filters">
            <div role="group" aria-label="作品类型">
              {["全部", "原型", "幻灯片", "文档", "图片"].map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => choose(c)}
                >
                  {c !== "全部" && (
                    <HomeIcon
                      name={
                        c === "原型"
                          ? "grid"
                          : c === "幻灯片"
                            ? "slides"
                            : c === "文档"
                              ? "document"
                              : "palette"
                      }
                      size={14}
                    />
                  )}
                  <span>{c}</span>
                </button>
              ))}
            </div>
            <label className="samples-search">
              <HomeIcon name="search" />
              <input
                aria-label="搜索作品"
                placeholder="搜索作品"
                value={query}
                onChange={(e) => search(e.target.value)}
              />
            </label>
          </div>
          <div className="samples-grid">
            {mine
              ? copies.map((d) => {
                  const s = samples.find((x) => x.id === d.sample)!;
                  return (
                    <article className="sample-card" key={d.id}>
                      <button
                        aria-label={`打开副本：${d.title}`}
                        onClick={() =>
                          navigateTo(`/inspiration/${d.sample}/draft/${d.id}`)
                        }
                      >
                        <Preview id={d.sample} />
                        <h2>{d.title}</h2>
                        <p>
                          {s.format} ·{" "}
                          {new Date(d.createdAt).toLocaleDateString("zh-CN")}
                        </p>
                      </button>
                    </article>
                  );
                })
              : visible.map((s) => (
                  <article
                    className="sample-card"
                    key={s.id}
                    data-sample={s.id}
                  >
                    <button
                      aria-label={`打开作品：${s.title}`}
                      onClick={() => navigateTo(`/inspiration/${s.id}`)}
                    >
                      <Preview id={s.id} />
                      <h2>{s.title}</h2>
                      <p>
                        <span className="sample-avatar">D</span>DesignBuddy ·{" "}
                        {s.category}
                      </p>
                    </button>
                    <div className="sample-card-detail">
                      <span>{s.description}</span>
                      <b>{s.format}</b>
                    </div>
                  </article>
                ))}
          </div>
          {(mine ? !copies.length : !visible.length) && (
            <div className="samples-empty" role="status">
              <h2>{mine ? "还没有匹配的副本" : "没有找到匹配的作品"}</h2>
              <p>
                {mine
                  ? "打开样板后点击“做同款”，会按原类型保存独立副本。"
                  : "换一个关键词或作品类型试试。"}
              </p>
            </div>
          )}
          <section className="samples-standard">
            <span>EIGHT WORKS. FOUR FORMATS.</span>
            <h2>8 套作品，每一套都能完整体验。</h2>
            <div>
              <p>
                <b>原型</b>旅行预订、展馆预约，各20个业务页面。
              </p>
              <p>
                <b>幻灯片</b>产品发布、城市漫步，各20页可编辑PPTX。
              </p>
              <p>
                <b>文档</b>研究报告、出行手册，各20页可编辑A4文稿。
              </p>
              <p>
                <b>图片</b>咖啡品牌、自然摄影，各20张SVG / PNG画板。
              </p>
            </div>
            <small>
              八个样板各自使用独立摄影素材。视频、音频与三维作品暂不展示，待有对应成品后再上线。原有130条资产规格目录仍可从资产中心访问，不计入这八个完整样板。
            </small>
          </section>
        </main>
      )}
      {notice && (
        <div className="samples-toast" role="status">
          {notice}
          <button aria-label="关闭提示" onClick={() => msg("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
