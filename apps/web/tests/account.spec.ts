import { test, expect } from "@playwright/test";

const triggerName = "账号菜单：19932101651";
const actionNames = ["Buddy加油站", "去邀约", "成长计划", "设置", "外观", "记忆与进化", "意见反馈", "检查更新", "退出登录"];

test("profile opens the reference cards and all account actions", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: triggerName, exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const popup = page.getByRole("dialog", { name: "账号菜单", exact: true });
  await expect(popup).toBeVisible();
  await expect(popup.locator(".account-identity")).toHaveText("199****1651");
  await expect(popup.getByLabel("套餐与积分")).toContainText("体验版");
  await expect(popup.getByLabel("积分余额：尚未接入")).toHaveText("—");
  await expect(popup.getByRole("button", { name: "购买积分", exact: true })).toBeDisabled();
  for (const label of actionNames) await expect(popup.getByRole("button", { name: label, exact: false })).toBeVisible();
  const box = (await popup.boundingBox())!;
  const anchor = (await trigger.boundingBox())!;
  expect(box.width).toBe(316);
  expect(box.height).toBe(568);
  expect(box.y + box.height).toBeLessThanOrEqual(anchor.y);
  await trigger.click();
  await expect(popup).toHaveCount(0);
});

test("outside click, Escape, keyboard navigation and focus dismissal", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: triggerName });
  const popup = page.getByRole("dialog", { name: "账号菜单", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(popup).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(popup.getByRole("button", { name: "升级套餐" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(popup.getByRole("button", { name: "退出登录" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(popup.getByRole("button", { name: "升级套餐" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("textbox", { name: "任务描述", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await trigger.click();
  await page.getByRole("button", { name: "返回 DesignBuddy 首页" }).focus();
  await expect(popup).toHaveCount(0);
});

test("unconnected services disclose limitations without charging or clearing local data", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("account-test-retained-draft", "keep"));
  const requests: string[] = [];
  page.on("request", request => { if (/\/api\//.test(request.url())) requests.push(request.url()); });
  await page.getByRole("button", { name: triggerName }).click();
  const popup = page.getByRole("dialog", { name: "账号菜单", exact: true });
  for (const label of ["升级套餐", ...actionNames.filter(name => name !== "设置" && name !== "意见反馈")]) {
    await popup.getByRole("button", { name: label, exact: false }).click();
    await expect(popup.getByRole("heading", { name: label, exact: true })).toBeVisible();
    await expect(popup.locator(".account-detail p")).toContainText("尚未接入");
    await popup.getByRole("button", { name: "返回账号菜单", exact: true }).click();
  }
  expect(await page.evaluate(() => localStorage.getItem("account-test-retained-draft"))).toBe("keep");
  expect(requests).toEqual([]);
  await popup.getByRole("button", { name: "意见反馈", exact: true }).click();
  await expect(popup.getByRole("link", { name: "打开项目反馈页面" })).toHaveAttribute("href", "https://github.com/lichongyang130/new/issues");
  await expect(popup.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
});

test("settings reaches session-only AI configuration and can return to the menu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: triggerName }).click();
  const popup = page.getByRole("dialog", { name: "账号菜单", exact: true });
  await popup.getByRole("button", { name: /^设置/ }).click();
  await popup.locator("summary").click();
  await popup.getByRole("combobox", { name: "服务商", exact: true }).selectOption("deepseek");
  await expect(popup.getByLabel("API Key", { exact: true })).toHaveAttribute("type", "password");
  await expect(popup.getByRole("combobox", { name: "服务商", exact: true })).toHaveValue("deepseek");
  await popup.getByRole("button", { name: "返回账号菜单", exact: true }).click();
  await expect(popup.locator(".account-identity")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: triggerName }).click();
  await popup.getByRole("button", { name: /^设置/ }).click();
  await popup.locator("summary").click();
  await expect(popup.getByRole("combobox", { name: "服务商", exact: true })).toHaveValue("deepseek");
});

for (const path of ["/experts", "/skills", "/connectors"]) {
  test(`shared account entry works on ${path} and closes on navigation`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: triggerName }).click();
    await expect(page.getByRole("dialog", { name: "账号菜单", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "返回 DesignBuddy 首页" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog", { name: "账号菜单", exact: true })).toHaveCount(0);
  });
}

for (const [width, height] of [[320, 480], [375, 812], [768, 600], [1440, 900]]) {
  test(`account popover fits ${width}×${height}, with reachable bottom actions`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("button", { name: triggerName }).click();
    const popup = page.getByRole("dialog", { name: "账号菜单", exact: true });
    const box = (await popup.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await popup.getByRole("button", { name: "退出登录", exact: true }).click();
    await expect(popup.locator(".account-detail p")).toContainText("不会删除本地项目");
  });
}
