import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/experts");
});

test("expert page follows the compact screenshot layout", async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 721 });
  await expect(page.getByRole("navigation", { name: "专家技能连接器导航" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "找到你的专属专家" })).toHaveCount(0);
  await expect(page.locator(".expert-collection")).toHaveCount(3);
  await expect(page.locator(".expert-directory-card").first()).toHaveAccessibleName("查看高校创业导师");
  expect((await page.locator(".app-sidebar").boundingBox())?.width).toBe(277);
  expect((await page.locator(".expert-collections").boundingBox())?.y).toBe(56);
  expect((await page.locator(".expert-card-grid").boundingBox())?.y).toBe(382);
  expect((await page.locator(".expert-directory-card").first().boundingBox())?.height).toBe(156);
  const imagesLoaded = await page.locator(".expert-collections img, .expert-directory-card img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0));
  expect(imagesLoaded).toBe(true);
});

test("search, category filters and popularity sorting", async ({ page }) => {
  await page.getByRole("searchbox", { name: "搜索专家" }).fill("架构设计");
  await expect(page.locator(".expert-directory-card")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "查看高级开发工程师" })).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索专家" }).fill("不存在的专家xyz");
  await expect(page.getByRole("status")).toContainText("没有找到匹配的专家");
  await page.getByRole("searchbox", { name: "搜索专家" }).fill("");
  await page.getByRole("group", { name: "专家分类" }).getByRole("button", { name: "金融投资", exact: true }).click();
  await expect(page.locator(".expert-directory-card")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "查看金融研究分析师" })).toBeVisible();
  await page.getByRole("group", { name: "专家分类" }).getByRole("button", { name: "全部", exact: true }).click();
  await page.getByRole("button", { name: "最热", exact: true }).click();
  await expect(page.locator(".expert-directory-card").first()).toHaveAccessibleName("查看高级开发工程师");
  await page.getByRole("button", { name: "综合", exact: true }).click();
  await expect(page.locator(".expert-directory-card").first()).toHaveAccessibleName("查看高校创业导师");
});

test("built-in expert details carry the selected role into a homepage task", async ({ page }) => {
  await page.getByRole("button", { name: "查看高级开发工程师" }).click();
  await expect(page).toHaveURL(/\/experts\/builtin-developer$/);
  await expect(page.getByRole("heading", { name: "高级开发工程师" })).toBeVisible();
  await page.getByRole("button", { name: "用于任务", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".home-selected-capabilities")).toContainText("高级开发工程师");
});

test("my experts is separate, supports creation and persists after reload", async ({ page }) => {
  await page.getByRole("button", { name: "我的专家", exact: true }).click();
  await expect(page).toHaveURL(/\/experts\/mine$/);
  await expect(page.getByRole("heading", { name: "还没有自己的专家" })).toBeVisible();
  await expect(page.locator(".expert-directory-card")).toHaveCount(0);
  await page.getByRole("button", { name: "创建第一个专家" }).click();
  await page.getByLabel("专家名称").fill("我的测试专家");
  await page.getByLabel("职责描述").fill("为项目整理交付说明。");
  await page.getByRole("button", { name: "保存专家", exact: true }).click();
  await expect(page.getByRole("heading", { name: "我的测试专家" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "我的测试专家" })).toBeVisible();
  await page.getByRole("button", { name: "我的专家", exact: true }).click();
  await expect(page.locator(".expert-directory-card")).toHaveCount(1);
  await page.getByRole("navigation", { name: "专家技能连接器导航" }).getByRole("button", { name: "专家", exact: true }).click();
  await page.getByRole("button", { name: "最新", exact: true }).click();
  await expect(page.locator(".expert-directory-card").first()).toHaveAccessibleName("查看我的测试专家");
  await page.getByRole("group", { name: "专家分类" }).getByRole("button", { name: "技术工程", exact: true }).click();
  await expect(page.getByRole("button", { name: "查看我的测试专家" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "查看高级开发工程师" })).toBeVisible();
});

test("expert teams and curated links can start a task", async ({ page }) => {
  await page.getByRole("group", { name: "专家类型" }).getByRole("button", { name: "专家团", exact: true }).click();
  await expect(page.locator(".expert-team-card")).toHaveCount(3);
  await page.getByRole("searchbox", { name: "搜索专家" }).fill("求职");
  await expect(page.locator(".expert-team-card")).toHaveCount(1);
  await page.getByRole("button", { name: "开始协作" }).click();
  await expect(page.locator(".home-selected-capabilities")).toContainText("求职冲刺专家团");
  await page.goto("/experts");
  await page.getByRole("button", { name: "论文写作导师", exact: true }).click();
  await expect(page.locator(".home-selected-capabilities")).toContainText("论文写作导师");
});

test("carousel and category arrows really scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "查看更多专家专题" }).click();
  await expect.poll(() => page.locator(".expert-collection-track").evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "查看更多专家分类" }).click();
  await expect.poll(() => page.locator(".expert-category-track").evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("skills and connectors remain reachable", async ({ page }) => {
  await page.getByRole("navigation", { name: "专家技能连接器导航" }).getByRole("button", { name: "技能", exact: true }).click();
  await expect(page).toHaveURL(/\/skills$/);
  await expect(page.getByRole("heading", { name: "精选技能", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "专家技能连接器导航" }).getByRole("button", { name: "专家", exact: true }).click();
  await page.getByRole("navigation", { name: "专家技能连接器导航" }).getByRole("button", { name: "连接器", exact: true }).click();
  await expect(page.getByRole("main", { name: "连接器市场" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看Gmail 邮箱", exact: true })).toBeVisible();
});

for (const width of [320, 375, 768, 1440]) {
  test(`expert page remains usable without page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("searchbox", { name: "搜索专家" })).toBeVisible();
    await expect(page.getByRole("button", { name: "我的专家", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const firstCard = await page.locator(".expert-directory-card").first().boundingBox();
    expect(firstCard!.x).toBeGreaterThanOrEqual(0);
    expect(firstCard!.x + firstCard!.width).toBeLessThanOrEqual(width);
  });
}
