import type { Skill } from "./models/workspace";
import research from "../../apps/web/src/assets/skills/research.png";
import powerpoint from "../../apps/web/src/assets/skills/powerpoint.png";
import word from "../../apps/web/src/assets/skills/word.png";
import microsoft from "../../apps/web/src/assets/skills/microsoft.png";
import pdf from "../../apps/web/src/assets/skills/pdf.png";
import markdown from "../../apps/web/src/assets/skills/markdown.png";
import pdfTools from "../../apps/web/src/assets/skills/pdf-tools.png";
import weather from "../../apps/web/src/assets/skills/weather.png";
import distribution from "../../apps/web/src/assets/skills/distribution.png";
import flights from "../../apps/web/src/assets/skills/flights.png";
import translate from "../../apps/web/src/assets/skills/translate.png";
import factory from "../../apps/web/src/assets/skills/factory.png";

export type CatalogSkill = Pick<Skill, "id" | "name" | "description" | "category"> & {
  icon?: string;
  recommendation?: string;
  requirement?: string;
  custom?: boolean;
};

export const skillCategories = ["全部", "效率工具", "内容创作", "数据分析", "商业运营", "办公协同", "知识与学习", "开发工具", "投资理财", "生活服务"];

/** Local task presets. These entries do not install executables or provision external APIs. */
export const skillCatalog: CatalogSkill[] = [
  { id: "builtin-deep-research", name: "Deep Research", category: "知识与学习", description: "结构化深度调研工作流，支持大纲生成、资料梳理与引用整理。", icon: research, recommendation: "几分钟出带引用的调研报告", requirement: "调研需提供资料或接入检索服务；引用与时效性需自行核验。" },
  { id: "builtin-powerpoint", name: "PPT 演示文稿", category: "办公协同", description: "PowerPoint 演示文稿生成", icon: powerpoint, recommendation: "大纲一键变精美 PPT", requirement: "此入口保存演示文稿任务说明；实际幻灯片生成与导出请使用 Studio。" },
  { id: "builtin-word", name: "Word 文档生成", category: "办公协同", description: "Word 文档生成与编辑", icon: word, recommendation: "一键生成专业 Word 文档", requirement: "当前将文档写作说明传入任务，不包含 Microsoft Word 自动化或 DOCX 导出引擎。" },
  { id: "builtin-microsoft365", name: "Microsoft 365", category: "办公协同", description: "WorkBuddy 专用的 Microsoft365Skill，辅助整理文档、表格与协同办公需求。", icon: microsoft, requirement: "访问 Microsoft 365 数据需另行配置授权与服务端接口；当前仅保存任务说明。" },
  { id: "builtin-pdf", name: "PDF 文档生成", category: "效率工具", description: "高质量 PDF 文档生成", icon: pdf, requirement: "可用于文档排版任务；最终 PDF 导出依赖项目编辑器已有的打印/导出功能。" },
  { id: "builtin-markitdown", name: "MarkItDown", category: "效率工具", description: "文档转 Markdown（PDF/Word/PPT/图片 OCR），整理为清晰的文本内容。", icon: markdown, requirement: "尚未接入 MarkItDown 运行时及 OCR 服务；当前不执行文件转换。" },
  { id: "builtin-pdf-tools", name: "PDF 全能工具", category: "效率工具", description: "PDF全能工具箱，覆盖阅读分析、自然语言问答与文档内容整理。", icon: pdfTools, requirement: "当前不会解析 PDF 附件；请提供提取后的文本，或接入 PDF 解析服务。" },
  { id: "builtin-weather", name: "天气查询", category: "生活服务", description: "查询天气预报，无需 API 密钥", icon: weather, requirement: "此描述来自参考目录。本项目尚未接入天气数据服务，安装不会提供实时天气。" },
  { id: "builtin-distribution", name: "内容分发", category: "商业运营", description: "将长文内容转化为多平台优化的社交媒体文案与发布计划。", icon: distribution, requirement: "仅生成内容与分发计划，不会自动登录或发布到外部平台。" },
  { id: "builtin-flights", name: "机票搜索", category: "生活服务", description: "通过 Google Flights 搜索航班，支持城市、日期与出行偏好整理。", icon: flights, requirement: "本项目未接入 Google Flights 或实时航班数据；不会查询实时票价或代订机票。" },
  { id: "builtin-translation", name: "翻译与本地化助手", category: "知识与学习", description: "面向文档的中英互译与本地化：先建术语表，再统一表达与语气。", icon: translate },
  { id: "builtin-content-factory", name: "内容工厂", category: "内容创作", description: "多智能体内容生产系统，一份素材生成多种内容形式与创作方案。", icon: factory, requirement: "当前将内容生产要求交给所配置的 AI，不包含独立多智能体执行系统。" },
  { id: "builtin-ai-design", name: "AI设计技能", category: "内容创作", description: "生成页面布局、配色方案与可复用设计规范。", recommendation: "让创意成为清晰的设计方案" },
  { id: "builtin-code", name: "代码开发技能", category: "开发工具", description: "协助编写、解释、重构代码并定位常见问题。", recommendation: "从需求到代码，更快开始" },
  { id: "builtin-office", name: "办公效率技能", category: "效率工具", description: "整理资料、提炼重点、生成会议纪要与文档。", recommendation: "把重复工作整理成可复用流程" },
  { id: "builtin-product", name: "产品管理技能", category: "商业运营", description: "把产品想法转化为需求、流程和优先级计划。" },
  { id: "builtin-visual", name: "视觉设计技能", category: "内容创作", description: "优化视觉层级、组件状态和跨页面一致性。" },
];

export const featuredSkillBatches = [
  ["builtin-deep-research", "builtin-powerpoint", "builtin-word"],
  ["builtin-ai-design", "builtin-code", "builtin-office"],
];

export const skillSuites = [
  { id: "office", name: "高效办公套件", description: "文档、演示与 PDF 排版，组合常用办公任务。", skillIds: ["builtin-word", "builtin-powerpoint", "builtin-pdf"], icon: microsoft },
  { id: "content", name: "内容创作套件", description: "从选题创作到翻译与多平台分发。", skillIds: ["builtin-content-factory", "builtin-translation", "builtin-distribution"], icon: factory },
  { id: "research", name: "学习研究套件", description: "整理研究大纲、归纳资料并辅助文档阅读。", skillIds: ["builtin-deep-research", "builtin-markitdown", "builtin-pdf-tools"], icon: research },
];
