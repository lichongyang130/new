import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/skills"); });

test("shared sidebar and reference skill cards fit together", async ({ page }) => {
  await page.setViewportSize({ width: 1216, height: 757 });
  await expect(page.locator(".app-sidebar")).toBeVisible();
  expect((await page.locator(".app-sidebar").boundingBox())?.width).toBe(277);
  await expect(page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("button", { name: "更多", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("heading", { name: "精选技能", exact: true })).toBeVisible();
  await expect(page.locator(".skills-featured .skill-tile")).toHaveCount(3);
  await expect(page.locator(".skills-directory .skill-tile").first().getByRole("button", { name: "查看Microsoft 365" })).toBeVisible();
  await expect(page.getByRole("button", { name: "已安装(0)", exact: true })).toBeVisible();
  const featured = await page.locator(".skills-featured > .skills-grid").boundingBox();
  expect(featured?.x).toBe(301);
  expect(featured?.y).toBe(99);
  expect(featured?.height).toBe(136);
  expect((await page.locator(".skills-directory > .skills-grid").boundingBox())?.y).toBe(355);
  expect((await page.locator(".skills-directory .skill-tile").first().boundingBox())?.height).toBe(120);
  expect(await page.locator(".skill-tile img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
});

test("search, categories and empty state", async ({ page }) => {
  await page.getByRole("searchbox", { name: "搜索技能" }).fill("  markitdown  ");
  await expect(page.locator(".skills-directory .skill-tile")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "查看MarkItDown" })).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索技能" }).fill("");
  await page.getByRole("group", { name: "技能分类" }).getByRole("button", { name: "生活服务", exact: true }).click();
  await expect(page.locator(".skills-directory .skill-tile")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "查看天气查询" })).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索技能" }).fill("不存在的技能xyz");
  await expect(page.getByRole("heading", { name: "没有找到匹配的技能" })).toBeVisible();
});

test("refresh cycles featured skills", async ({ page }) => {
  await expect(page.locator(".skills-featured").getByRole("button", { name: "查看Deep Research" })).toBeVisible();
  await page.getByRole("button", { name: "换一批", exact: true }).click();
  await expect(page.locator(".skills-featured").getByRole("button", { name: "查看AI设计技能" })).toBeVisible();
  await page.getByRole("button", { name: "换一批", exact: true }).click();
  await expect(page.locator(".skills-featured").getByRole("button", { name: "查看Deep Research" })).toBeVisible();
});

test("installation persists, is idempotent, and can be removed", async ({ page }) => {
  await page.getByRole("button", { name: "安装PDF 文档生成", exact: true }).click();
  await expect(page.getByRole("button", { name: "PDF 文档生成已安装", exact: true })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("不会安装外部程序");
  await expect(page.getByRole("button", { name: "已安装(1)", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "已安装(1)", exact: true }).click();
  await expect(page).toHaveURL(/\/skills\/installed$/);
  await expect(page.locator(".skill-tile")).toHaveCount(1);
  await page.getByRole("button", { name: "查看PDF 文档生成", exact: true }).click();
  await expect(page.getByRole("heading", { name: "PDF 文档生成", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "移除技能", exact: true }).click();
  await expect(page.getByRole("button", { name: "已安装(0)", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "已安装(0)", exact: true }).click();
  await expect(page.getByRole("heading", { name: "还没有安装技能" })).toBeVisible();
});

test("suite installation deduplicates an already installed skill", async ({ page }) => {
  await page.getByRole("button", { name: "安装PDF 文档生成", exact: true }).click();
  await page.getByRole("group", { name: "技能类型" }).getByRole("button", { name: "套件", exact: true }).click();
  const suite = page.locator(".skill-suite").filter({ has: page.getByRole("heading", { name: "高效办公套件" }) });
  await suite.getByRole("button", { name: "安装套件（3 项）", exact: true }).click();
  await expect(suite.getByRole("button", { name: "套件已安装", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "已安装(3)", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "已安装(3)", exact: true }).click();
  await expect(page.locator(".skill-tile")).toHaveCount(3);
});

test("custom skill creation, persistence, task handoff and confirmed deletion", async ({ page }) => {
  await page.getByRole("button", { name: "添加技能", exact: true }).click();
  await expect(page).toHaveURL(/\/skills\/create$/);
  await page.getByLabel("技能名称").fill("我的会议纪要");
  await page.getByLabel("技能说明").fill("提炼讨论要点和行动项。");
  await page.getByLabel("技能分类").selectOption("办公协同");
  await page.getByRole("button", { name: "保存技能", exact: true }).click();
  await expect(page.getByRole("heading", { name: "我的会议纪要" })).toBeVisible();
  const detailUrl = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: "我的会议纪要" })).toBeVisible();
  await page.getByRole("button", { name: "用于任务", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".home-selected-capabilities")).toContainText("我的会议纪要：提炼讨论要点和行动项。");
  await page.goto(detailUrl);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "删除自建技能", exact: true }).click();
  await expect(page.getByRole("heading", { name: "我的会议纪要" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "删除自建技能", exact: true }).click();
  await expect(page).toHaveURL(/\/skills\/installed$/);
  await expect(page.getByRole("heading", { name: "还没有安装技能" })).toBeVisible();
});

test("external integration requirements and unknown skills are explicit", async ({ page }) => {
  await page.getByRole("button", { name: "查看天气查询", exact: true }).click();
  await expect(page.locator(".skills-service-note")).toContainText("尚未接入天气数据服务");
  await page.goto("/skills/missing-skill");
  await expect(page.getByRole("heading", { name: "未找到该技能" })).toBeVisible();
  await page.getByRole("button", { name: "返回技能市场" }).click();
  await expect(page.getByRole("heading", { name: "精选技能", exact: true })).toBeVisible();
});

for (const width of [320, 375, 768, 1440]) {
  test(`skills controls remain usable at ${width}px without page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("searchbox", { name: "搜索技能" })).toBeVisible();
    await expect(page.getByRole("button", { name: "添加技能", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const card = await page.locator(".skills-directory .skill-tile").first().boundingBox();
    expect(card!.x + card!.width).toBeLessThanOrEqual(width);
  });
}

test("skill sidebar supports navigation and remains on skill subsections", async ({ page }) => {
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("button", { name: "更多", exact: true }).click();
  await page.getByRole("menuitem", { name: "技能", exact: true }).click();
  await expect(page).toHaveURL(/\/skills$/);
  await page.getByRole("button", { name: "添加技能", exact: true }).click();
  await expect(page.locator(".app-sidebar")).toBeVisible();
  await page.getByRole("button", { name: "首页", exact: true }).click();
  await expect(page.getByRole("heading", { name: "WorkBuddy，我帮你" })).toBeVisible();
  await page.goto("/skills/installed");
  await expect(page.locator(".app-sidebar")).toBeVisible();
  await page.getByRole("button", { name: "打开任务列表", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
});
