import campusArt from "../../apps/web/src/assets/experts/campus.png";
import creatorArt from "../../apps/web/src/assets/experts/creator.png";
import campusAvatar from "../../apps/web/src/assets/experts/campus-mentor.png";
import developerAvatar from "../../apps/web/src/assets/experts/developer.png";
import admissionsAvatar from "../../apps/web/src/assets/experts/admissions.png";
import charityAvatar from "../../apps/web/src/assets/experts/charity.png";
import deliveryAvatar from "../../apps/web/src/assets/experts/delivery.png";
import newsAvatar from "../../apps/web/src/assets/experts/news.png";

export interface CatalogExpert {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  avatar?: string;
  /** Static reference/demo popularity, not live usage analytics. */
  popularity?: number;
  featured?: boolean;
  createdAt?: string;
  custom?: boolean;
}

export const expertCategories = ["全部", "OPC-一人公司", "腾讯专家", "高校新生攻略", "产品设计", "技术工程", "金融投资", "全球资讯"];

export const expertCatalog: CatalogExpert[] = [
  { id: "builtin-campus", name: "高校创业导师", category: "高校新生攻略", description: "面向高校创业教学与实践，提供项目辅导、商业计划梳理和路演准备。", tags: ["创业教学", "项目辅导"], avatar: campusAvatar, popularity: 13.33 },
  { id: "builtin-developer", name: "高级开发工程师", category: "技术工程", description: "10年以上全栈经验，擅长复杂系统架构与工程效率提升。", tags: ["全栈开发", "架构设计"], avatar: developerAvatar, popularity: 1630.37 },
  { id: "builtin-admissions", name: "升学备考通", category: "高校新生攻略", description: "查询高考数据并整理备考计划，辅助理解院校信息与志愿选择。", tags: ["高考真题", "一分一段"], avatar: admissionsAvatar, popularity: 48.47 },
  { id: "builtin-charity", name: "公益专家", category: "腾讯专家", description: "腾讯公益助手。协助梳理公益项目、活动策划与志愿服务需求。", tags: ["腾讯公益", "小红花花园"], avatar: charityAvatar, popularity: 41.67 },
  { id: "builtin-delivery", name: "自适应成果交付专家", category: "OPC-一人公司", description: "作为一个靠谱的工作伙伴，拆解任务目标，协助经营决策与成果交付。", tags: ["成果交付", "经营决策"], avatar: deliveryAvatar, popularity: 23.16 },
  { id: "builtin-news", name: "资讯每日简报", category: "全球资讯", description: "一句话查到每天关注的资讯，整理 AI 行业动态与每日简报。", tags: ["AI 资讯", "每日简报"], avatar: newsAvatar, popularity: 21.57, featured: true },
  { id: "builtin-product", name: "产品策略顾问", category: "产品设计", description: "从用户研究到产品路线图，帮助想法快速变成可执行方案。", tags: ["产品规划", "用户研究"], popularity: 928.6 },
  { id: "builtin-content", name: "小红书增长专家", category: "OPC-一人公司", description: "制定内容策略、账号定位与可持续的增长计划。", tags: ["内容运营", "增长策略"], popularity: 786.2 },
  { id: "builtin-finance", name: "金融研究分析师", category: "金融投资", description: "整理公开信息、分析行业趋势并构建研究框架。", tags: ["行业研究", "数据分析"], popularity: 642.8 },
  { id: "builtin-career", name: "高校求职导师", category: "高校新生攻略", description: "简历优化、面试准备与校园职业发展规划。", tags: ["求职规划", "简历优化"], popularity: 521.4 },
  { id: "builtin-tencent-product", name: "腾讯产品专家", category: "腾讯专家", description: "聚焦产品体验、协作流程与商业化落地。", tags: ["产品方法", "体验设计"], popularity: 418.9 },
];

export const expertCollections = [
  { title: "开学季", tone: "campus", art: campusArt, items: ["校园求职教练", "论文写作导师", "校园活动策划与执行顾问"] },
  { title: "内容创作", tone: "creator", art: creatorArt, items: ["内容创作专家团", "内容创作专家", "小红书运营专家"] },
  { title: "投资分析", tone: "finance", items: ["交易分析团队", "股票研究专家", "腾讯自选股股票助手"] },
];

export const expertTeams = [
  { name: "产品从 0 到 1 专家团", description: "从市场机会到首版产品，协同完成定位、原型与技术方案。", members: ["产品策略顾问", "UI 设计专家", "高级开发工程师"] },
  { name: "内容创作专家团", description: "协同完成品牌表达、内容选题和持续增长策略。", members: ["内容增长专家", "产品策略顾问"] },
  { name: "求职冲刺专家团", description: "把职业目标转化为简历重点、岗位匹配与面试准备清单。", members: ["求职与职业导师", "写作与研究助理"] },
];
