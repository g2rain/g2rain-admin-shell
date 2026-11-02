<p align="center">
  <img src="https://github.com/g2rain.png" alt="G2Rain" width="180" />
</p>

# g2rain-admin-shell

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.5-42B883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

G2rain（谷雨）是面向企业的开源智能体平台，连接模型、知识与业务工具，以 SaaS 基座和应用开发工具链支撑智能应用落地。`g2rain-admin-shell` 是其中的 Vue 3 Main Shell 模板/浏览器入口基线：提供 Header / Sidebar / Tab / Workspace / Footer、Pinia Workspace 模型、`@g2rain/platform/main` + `@g2rain/http` + `@g2rain/theme` / `@g2rain/ui` 接入点，以及 qiankun RuntimeAdapter 扩展位。它不单独提供平台的知识库、智能体、IAM、网关或业务服务能力；平台能力与开放状态以 [G2rain 主仓库](https://github.com/g2rain/g2rain) 为准。

本项目由 [g2rain-app-cli](https://github.com/g2rain/g2rain-app-cli) 基于 [g2rain-shell-template](https://github.com/g2rain/g2rain-shell-template) 生成。权威生产参考壳是 [g2rain-main-shell](https://github.com/g2rain/g2rain-main-shell)；跨仓架构契约见中央 [Main Shell 契约](https://github.com/g2rain/g2rain/blob/main/docs/architecture/profiles/frontend-shell/main-shell-contract.md)，appkit 接线细节见其 [Main Shell 接入](https://github.com/g2rain/g2rain-appkit/blob/main/docs/integration/main.md)。

[官网](https://www.g2rain.com) · [完整文档](docs/index.md) · [中央 Frontend Shell Profile](https://github.com/g2rain/g2rain/tree/architecture-v1.2.0/docs/architecture/profiles/frontend-shell) · [Issues](https://github.com/g2rain/g2rain/issues)

## 核心能力

| 能力 | 当前实现 |
| --- | --- |
| Shell UI | Header、Sidebar、TabBar、Workspace、Footer；默认三个 Shell 本地页 |
| Workspace / Tab | Pinia `workspace.store`：打开 / 激活 / 关闭；概览 Tab 不可关闭 |
| Platform Main | `createMainPlatform` 在 `runtime/boot` 单例装配 |
| HTTP | `@g2rain/http` 工厂挂在 `runtime/http`；Token / SSO 钩子预留 |
| Theme / UI | `@g2rain/theme` + `@g2rain/platform/theme`；`G2rainUi` 插件 |
| 微前端 | qiankun RuntimeAdapter 与实例队列；默认不注册业务 entry |
| 部署 | Vite `base` = Context Path；`nginx/default.conf.example` 示例 |

## 目录职责

| 目录 | 职责 |
| --- | --- |
| `src/shared` | 环境变量、项目名等无状态工具 |
| `src/components` | 不依赖 platform/runtime 的可复用 UI |
| `src/platform` | Workspace / Runtime / Session stores、Main/Theme、qiankun 适配 |
| `src/runtime` | boot、路由、HTTP 装配 |
| `src/shell` | 布局、菜单、Shell 本地页 |
| `src/views` | Shell 自有认证/租户页扩展位（模板基线为空） |
| `nginx` | 静态托管与 Context Path 示例 |

## 占位符

| 占位符 | 用途 | 示例 |
| --- | --- | --- |
| `g2rain-admin-shell` | `package.json` name、`PROJECT_NAME` | `g2rain-admin-shell` |
| `admin` | Context Path（无前导 `/`） | `admin` |
| `3000` | Vite 开发端口 | `3000` |

`.env` 使用：

```env
VITE_CONTEXT_PATH=/admin
VITE_SERVER_PORT=3000
```

模板仓本地验证前先替换为具体值（如 `/admin` 与 `3000`），再执行构建。

## 环境要求

- Node.js `>= 22`
- npm

## 快速开始

```bash
# 1) 将 .env 占位符替换为本地值（示例）
# VITE_CONTEXT_PATH=/admin
# VITE_SERVER_PORT=3000

npm install
npm run dev
npm run build
```

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | Vite 开发服务器 |
| `npm run build` | `vue-tsc --noEmit` + `vite build` |
| `npm run preview` | 预览构建产物 |

## GHCR 镜像

- 镜像地址：`ghcr.io/g2rain/g2rain-admin-shell`。
- 稳定版使用 `1.0.0` 这类版本标签，并同时发布 `sha-<完整提交 SHA>` 可追溯标签；不会更新 `latest`。
- 包公开后可拉取：`docker pull ghcr.io/g2rain/g2rain-admin-shell:1.0.0`。
- 只有推送精确格式的 `v<major>.<minor>.<patch>` Git tag 才会触发发布；tag 提交必须在 `main` 历史中，且包含同名发布说明。

完整的构建、GHCR 权限、首次公开、发布顺序、配置与部署说明见[部署文档](docs/operations/deployment.md#github-container-registryghcr发布)。

## 许可证与作者

本项目采用 [Apache License 2.0](LICENSE) 开源。版权归属：Copyright 2025-2026 g2rain.com。

### 作者

| 作者 | 联系 |
| --- | --- |
| Jagger | g2rain_developer@163.com · [g2rain.com](https://www.g2rain.com/) |
| Alpha | [g2rain.com](https://www.g2rain.com/) |

### 联系

- 官网：[g2rain.com](https://www.g2rain.com)
- Issues：[GitHub Issues](https://github.com/g2rain/g2rain/issues)
- 讨论：[GitHub Discussions](https://github.com/g2rain/g2rain/discussions)
- 邮箱：g2rain_developer@163.com
