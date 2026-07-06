# 🎮 Chengxi's Digital Playground

个人 Bento 风格网站，展示项目、博客、Minecraft 皮肤、Steam 游戏状态等。

## Tech Stack

- [Astro](https://astro.build) (SSR, Server Endpoints)
- [UnoCSS](https://unocss.dev/)
- [Motion](https://motion.dev/) (formerly Framer Motion)
- [Solid.js](https://solidjs.com/)
- [Svelte](https://svelte.dev/)
- [d3](https://d3js.org/) (3D Globe)
- [Steam Web API](https://steamcommunity.com/dev)

## Features

- Bento Grid 布局
- 3D Steam 状态卡片（实时游戏状态）
- Minecraft 3D 皮肤渲染
- 访客留言板
- 博客系统 + RSS
- 3D 地球（到访国家展示）
- 图片防盗保护（Canvas 渲染 + Blob URL）
- OC 展示卡片

## 环境变量

```bash
# .env
STEAM_API_KEY=你的32位Steam API密钥
STEAM_ID=你的17位Steam64位ID
```

## 本地开发

```bash
pnpm install
pnpm dev
```

## Deploy

自动部署到 Netlify（关联 GitHub 仓库即可）。
