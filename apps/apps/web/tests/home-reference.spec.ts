import { expect, test } from "@playwright/test";

const title = /想做什么，\s*说出来就好。/;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

test("reference 27 structure is on the right and shared sidebar remains unchanged", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const sidebar = page.locator(".app-sidebar");
  expect((await sidebar.boundingBox())!.width).toBe(239);
  expect((await sidebar.boundingBox())!.height).toBe(1000);
  await expect(
    sidebar.getByRole("button", { name: "首页", exact: true }),
  ).toBeVisible();
  for (const name of ["插件", "模版", "定时任务"]) {
    await expect(
      sidebar.getByRole("button", { name, exact: true }),
    ).toBeVisible();
  }
  await expect(
    sidebar.getByRole("button", { name: "账号菜单：19932101651" }),
  ).toBeVisible();
  await expect(sidebar).toHaveCSS("background-color", "rgb(242, 242, 242)");
  await expect(page.locator(".home27")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".home27")).toHaveCSS("background-image", "none");
  await expect(
    page.locator(
      ".home27-hero-art, .home27-scene-preview img, .home27-scene-description",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".home27-color-icon").first()).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.getByRole("tab", { name: "日常办公" })).toHaveCSS(
    "color",
    "rgb(68, 68, 68)",
  );
  const composer = (await page.locator(".composer-shell").boundingBox())!;
  const shortcuts = (await page.locator(".home27-shortcuts").boundingBox())!;
  const scenes = (await page.locator(".home27-scenes").boundingBox())!;
  expect(shortcuts.y).toBeGreaterThan(composer.y + composer.height);
  expect(scenes.y).toBeGreaterThan(shortcuts.y + shortcuts.height);
  await expect(page.locator(".home27-shortcut")).toHaveCount(5);
  await expect(page.locator(".home27-scene")).toHaveCount(5);
});

test("all five shortcuts prepare an editable task without automatically sending", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/api\/(chat|generation)/.test(request.url())
    )
      calls.push(request.url());
  });
  const cases = [
    ["文档处理", "日常办公", "整理和处理"],
    ["图像创作", "日常办公", "图像生成提示词"],
    ["数据分析", "日常办公", "数据口径"],
    ["PPT制作", "日常办公", "逐页内容"],
    ["智能助手", "日常办公", "优先级"],
  ];
  for (const [name, mode, content] of cases) {
    await page.getByRole("textbox", { name: "任务描述" }).fill("");
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("textbox", { name: "任务描述" })).toHaveValue(
      new RegExp(content),
    );
    await expect(page.getByRole("textbox", { name: "任务描述" })).toBeFocused();
    await expect(page.getByRole("tab", { name: mode })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("button", { name: "开始任务" })).toBeEnabled();
    await expect(page).toHaveURL(/\/$/);
  }
  expect(calls).toEqual([]);
});

test("all five popular scenes load the right prompt and retain workspace and policy", async ({
  page,
}) => {
  await page
    .getByLabel("工作空间", { exact: true })
    .selectOption("产品设计空间");
  await page.getByLabel("任务权限").selectOption("需要确认后执行");
  const cases = [
    ["会议纪要", "日常办公", "负责人"],
    ["周报生成", "日常办公", "工作记录"],
    ["表格分析", "日常办公", "CSV"],
    ["汇报PPT", "日常办公", "故事线"],
    ["邮件撰写", "日常办公", "收件对象"],
  ];
  for (const [name, mode, content] of cases) {
    await page.getByRole("textbox", { name: "任务描述" }).fill("");
    await page
      .getByRole("button", { name: `预览${name}`, exact: true })
      .click();
    await page
      .getByRole("dialog", { name: `${name}场景预览`, exact: true })
      .getByRole("button", { name: "使用此场景" })
      .click();
    await expect(page.getByRole("textbox", { name: "任务描述" })).toHaveValue(
      new RegExp(content),
    );
    await expect(page.getByRole("tab", { name: mode })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByLabel("工作空间", { exact: true })).toHaveValue(
      "产品设计空间",
    );
    await expect(page.getByLabel("任务权限")).toHaveValue("需要确认后执行");
  }
});

test("reference header and discovery links reach existing destinations", async ({
  page,
}) => {
  await page.getByRole("button", { name: "默认工作空间", exact: true }).click();
  await expect(page.getByLabel("工作空间", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "查看首页通知" }).click();
  await expect(page.getByRole("status")).toContainText("目前没有新通知");
  await page.getByRole("button", { name: "查看最近项目" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goto("/");
  await page.getByRole("button", { name: "查看更多", exact: false }).click();
  await expect(page).toHaveURL(/\/inspiration$/);
  await page.goto("/");
  await page
    .getByRole("button", { name: "探索更多 AI 能力", exact: false })
    .click();
  await expect(page).toHaveURL(/\/plugins$/);
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`reference cards stay accessible without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      await page
        .locator(".home27")
        .evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    for (const card of await page.locator(".home27-scene").all()) {
      await card.scrollIntoViewIfNeeded();
      const box = (await card.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await page.getByRole("button", { name: "预览会议纪要" }).click();
    await page.getByRole("button", { name: "使用此场景" }).click();
    await expect(page.getByRole("textbox", { name: "任务描述" })).toBeFocused();
    await page.getByRole("button", { name: "选择大模型", exact: true }).click();
    const panel = (await page
      .getByRole("dialog", { name: "选择大模型", exact: true })
      .boundingBox())!;
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    expect(panel.y + panel.height).toBeLessThanOrEqual(900);
  });
}

test("mode tabs use larger custom icons and readable centered labels", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const list = page.getByRole("tablist", { name: "任务模式" });
    const box = (await list.boundingBox())!;
    const composer = (await page.locator(".composer-shell").boundingBox())!;
    expect(
      Math.abs(box.x + box.width / 2 - composer.x - composer.width / 2),
    ).toBeLessThan(1);
    for (const name of ["日常办公", "代码开发", "设计创意"]) {
      const tab = list.getByRole("tab", { name });
      await expect(tab).toHaveCSS("font-size", "14px");
      const icon = (await tab.locator(".home-mode-icon").boundingBox())!;
      expect(icon.width).toBeGreaterThanOrEqual(width <= 680 ? 20 : 26);
      expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test("requested home labels and select options stay 14px on desktop and mobile", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const selectors = [
      ".home27-workspace-button",
      ".footer-select select",
      ".footer-select option",
      ".model-picker",
      ".model-picker > span:nth-child(2)",
      ".mode-tab",
      ".home27-eyebrow",
      ".home27-eyebrow b",
      ".home27-eyebrow span",
      ".home27-hero-copy p",
    ];
    for (const selector of selectors) {
      const elements = page.locator(selector);
      expect(await elements.count()).toBeGreaterThan(0);
      for (const element of await elements.all())
        await expect(element).toHaveCSS("font-size", "14px");
    }
    await expect(page.locator(".home27-hero-copy p")).toHaveText(
      "DesignBuddy 让创意更简单，让工作更高效。",
    );
    await expect(page.locator(".home27-eyebrow")).toHaveText("AI×创意×效率");
    await page
      .getByRole("combobox", { name: "工作空间", exact: true })
      .selectOption("产品设计空间");
    await page
      .getByRole("combobox", { name: "任务权限", exact: true })
      .selectOption("需要确认后执行");
    for (const label of await page.locator(".footer-select").all()) {
      const box = (await label.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    expect(
      await page
        .locator(".home27")
        .evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});
