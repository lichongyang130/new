import { useLayoutEffect, useRef, useState } from "react";
import { HomeIcon } from "./HomeIcon";
import {
  shortcutsByMode,
  scenesByMode,
  modeLabels,
  type HomeMode,
  type HomeScene,
  type HomeShortcut,
} from "./homeScenes";
import { SceneDemo } from "./SceneDemo";
import { ScenePreview } from "./ScenePreview";
import "./home-scenes.css";
import "./scene-demos/pro-scenes.css";
import "../assets/fonts/scene-fonts.css";
import "./scene-demos/workspace.css";
export type { HomeScene } from "./homeScenes";

/** A scaled rendering of the actual demo, not an unrelated decorative icon/image. */
function SceneThumbnail({ scene }: { scene: HomeScene }) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = frame.current!;
    const observer = new ResizeObserver(() => {
      if (inner.current)
        inner.current.style.transform = `scale(${node.clientWidth / 780})`;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="scene-thumbnail" ref={frame} aria-hidden="true" inert>
      <div className="scene-thumbnail-inner" ref={inner}>
        <SceneDemo scene={scene} />
      </div>
      <span className="scene-thumbnail-badge">可交互预览 ↗</span>
    </div>
  );
}

export function HomeDiscovery({
  mode,
  onSelect,
  onExplore,
}: {
  mode: HomeMode;
  onSelect(scene: HomeShortcut): boolean;
  onExplore(): void;
}) {
  const [preview, setPreview] = useState<HomeScene | null>(null);
  return (
    <>
      <section
        className="home27-shortcuts"
        aria-label={`${modeLabels[mode]}快捷任务场景`}
      >
        {shortcutsByMode[mode].map((scene) => (
          <button
            key={`${mode}-${scene.title}`}
            className="home27-shortcut"
            aria-label={scene.title}
            onClick={() => onSelect(scene)}
          >
            <span className="home27-color-icon">
              <HomeIcon name={scene.icon} size={24} />
            </span>
            <span className="home27-shortcut-copy">
              <strong>{scene.title}</strong>
            </span>
            <HomeIcon name="chevron" size={13} />
          </button>
        ))}
      </section>
      <section
        className="home27-scenes home27-scenes-gallery"
        aria-labelledby="home27-scenes-title"
      >
        <header className="home27-section-heading">
          <h2 id="home27-scenes-title">
            热门场景{" "}
            <span className="scene-mode-caption">/ {modeLabels[mode]}</span>
          </h2>
          <button onClick={onExplore}>
            查看更多 <span aria-hidden="true">→</span>
          </button>
        </header>
        <div className="home27-scene-grid">
          {scenesByMode[mode].map((scene) => (
            <article className="home27-scene" key={scene.id}>
              <SceneThumbnail scene={scene} />
              <div className="scene-card-caption">
                <small>{scene.tag}</small>
                <h3>{scene.title}</h3>
                <span aria-hidden="true">↗</span>
              </div>
              <button
                className="scene-card-open"
                aria-label={`预览${scene.title}`}
                onClick={() => setPreview(scene)}
              />
            </article>
          ))}
        </div>
      </section>
      {preview && (
        <ScenePreview
          key={preview.id}
          scene={preview}
          onClose={() => setPreview(null)}
          onUse={() => onSelect(preview)}
        />
      )}
    </>
  );
}
