import ReactMarkdown from "react-markdown";

/** Render assistant Markdown without raw HTML, executable URLs or remote image requests. */
export function TaskMarkdown({ content }: { content: string }) {
  return <ReactMarkdown components={{
    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    img: ({ alt }) => <span>{alt ? `[图片：${alt}]` : "[图片]"}</span>,
  }}>{content}</ReactMarkdown>;
}
