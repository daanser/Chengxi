# 项目运行计划

## 项目概述

这是一个基于 [Astro v6](https://astro.build) 的个人 Bento 风格作品集网站，包含博客、留言板、3D 地球、Minecraft 皮肤展示等功能。

## 技术栈

| 技术 | 说明 |
|------|------|
| [Astro](https://astro.build) v6 | 框架 |
| [pnpm](https://pnpm.io) v10.33.0 | 包管理器 |
| [Node.js](https://nodejs.org) v24.13.0 | 运行时 |
| [UnoCSS](https://unocss.dev/) | CSS 引擎 |
| [Solid.js](https://www.solidjs.com/) + [Svelte](https://svelte.dev/) | UI 组件 |
| [Astro DB](https://astro.build/db) + [Turso](https://turso.tech/) | 留言板数据库 |
| [Netlify Edge](https://docs.netlify.com/edge-functions/overview/) | 适配器 |

## 执行步骤

### 第一步：检查并安装 Node.js

项目要求在 `.nvmrc` 中指定 Node.js **24.13.0**。

```bash
# 检查当前版本
node --version

# 如果版本不对，使用 nvm 切换
nvm use
```

### 第二步：检查并安装 pnpm

项目使用 **pnpm v10.33.0** 作为包管理器。

```bash
# 检查 pnpm 是否已安装
pnpm --version

# 如果未安装或版本不对
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

### 第三步：安装依赖

```bash
pnpm install
```

### 第四步：配置环境变量

项目需要以下环境变量。建议创建一个 `.env` 文件：

| 变量 | 是否必需 | 说明 |
|------|---------|------|
| `SITE_URL` | ✅ 推荐 | 网站 URL，用于 sitemap/robots，默认 `https://gianmarcocavallo.com/` |
| `ASTRO_DB_REMOTE_URL` | ⚠️ 可选 | Turso 数据库远程 URL，留言板功能需要 |
| `ASTRO_DB_APP_TOKEN` | ⚠️ 可选 | Turso 数据库认证令牌 |
| `UMAMI_WEBSITE_ID` | ⚠️ 可选 | Umami 分析网站 ID，缺少会导致控制台警告 |
| `AHREFS_ANALYTICS_KEY` | ⚠️ 可选 | Ahrefs 分析密钥，缺少会导致控制台警告 |

> **注意**：如果未配置 `ASTRO_DB_*`，留言板（`/guestbook` 页面和 `/api/guestbook` API）在构建或运行时可能会报错。如果不需要留言板功能，可以考虑：
> - 先启动开发服务器，留言板页面报错时再处理
> - 或者暂时注释掉 `astro.config.mjs` 中的 `db()` 集成

### 第五步：运行站点设置（可选）

项目已部分定制（作者信息已改为 "Chengxi Wen"），但可以重新运行设置脚本：

```bash
pnpm run site-setup
```

这会交互式地更新 `src/site-config.ts` 和 `.env` 文件中的 `SITE_URL`。

### 第六步：启动开发服务器

```bash
pnpm run dev
```

默认会在 `http://localhost:4321` 启动开发服务器。

## 潜在问题及解决方案

### 1. Astro DB / Turso 报错

如果 `@astrojs/db` 找不到 Turso 配置，可能会在启动时或访问留言板时报错。

**解决方案**：
- 如不需要留言板，可注释 `astro.config.mjs` 中的 `db()` 集成
- 如需使用，需在 [Turso](https://turso.tech/) 创建数据库并设置环境变量

### 2. Umami / Ahrefs 分析脚本错误

[`src/layouts/BasicLayout.astro`](../src/layouts/BasicLayout.astro) 中引用了 `UMAMI_WEBSITE_ID` 和 `AHREFS_ANALYTICS_KEY` 环境变量，缺失时可能在浏览器控制台报错。

**解决方案**：
- 在 `.env` 中设置空值或移除/注释这些脚本标签

### 3. Netlify Edge 适配器

项目配置了 `@astrojs/netlify` 适配器且使用 Edge 模式。在本地开发时可能遇到兼容性问题。

**解决方案**：
- 开发模式下 Astro 通常会回退到 Node.js 服务器，一般不受影响
- 如果遇到问题，可临时移除适配器配置

### 4. GitHub / LinkedIn 链接

[`src/site-config.ts`](../src/site-config.ts) 中的社交链接指向原作者，可根据需要修改。
