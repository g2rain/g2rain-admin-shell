# 部署

## 构建（静态）

```bash
# 确保 CONTEXT_PATH / 端口已是具体值
npm ci
npm run build
```

产物位于 `dist/`，静态资源以 `VITE_CONTEXT_PATH` 为 `base`。

## 容器镜像

构建依赖锁文件指定的 `@g2rain/*@1.0.1`；镜像内执行 `npm ci`，不再拷贝本地 kits 制品。项目自身版本由 `package.json` 决定，当前为 `1.0.0`，不要将其与依赖版本混同。

```bash
./build.sh --tag 1.0.0
# 等价：docker build --build-arg VITE_BUILD_MODE=production --build-arg IMAGE_VERSION=1.0.0 --build-arg VCS_REF="$(git rev-parse HEAD)" -t ghcr.io/g2rain/g2rain-admin-shell:1.0.0 .
```

### GitHub Container Registry（GHCR）发布

镜像地址为 `ghcr.io/g2rain/g2rain-admin-shell:<tag>`。本地 `build.sh` 与 CI 均使用根目录 `Dockerfile`、`VITE_BUILD_MODE=production` 和 OCI 构建参数；最终镜像运行在 OpenResty，入口为 `/docker-entrypoint.sh`，监听 `8080`。OCI 标签记录目标源仓库、标题、描述、版本、提交和与 `LICENSE` 一致的 `Apache-2.0` 许可证。

工作流位于 `.github/workflows/image.yml`。它只在推送严格格式的稳定版 Git tag（如 `v1.0.0`）时运行，不响应普通分支推送、Pull Request 或手动触发。工作流校验 tag 格式、tag 提交属于 `origin/main` 历史、`docs/releases/v1.0.0.md` 存在且非空，并校验 tag 版本等于 `package.json`。随后执行 `npm ci` 和 `npm run build`；本项目没有独立测试脚本，故 CI 的自动验证范围仅为锁定依赖安装、TypeScript 类型检查及 Vite 生产构建，不等同于浏览器联调、容器运行或部署验收。

两个步骤均成功后，工作流才在 Actions Summary 显示完整镜像地址。它用 GitHub 自动提供的 `GITHUB_TOKEN` 推送 `1.0.0` 与 `sha-<完整提交 SHA>`，不创建 GitHub Release、不部署服务，也不更新 `latest`。权限仅为 `contents: read` 和 `packages: write`。

本仓真实分支流程为 `feature/* → develop → main`。先把发布改动、工作流和 `docs/releases/v1.0.0.md` 合入 `main`，再在已验证的 `main` 提交创建并推送标签：

```bash
git tag v1.0.0
git push origin v1.0.0
```

首次成功推送后，如需允许匿名拉取，在 GitHub Packages 的包页面进入 **Package settings → Change visibility → Public**。若组织管理员禁止修改，应联系管理员。若已有 GHCR 包推送返回 `denied`，优先检查包页面的 **Package settings → Actions access** 是否已向 `g2rain-admin-shell` 授予写权限，并检查组织 Packages 策略；仅有工作流的 `packages: write` 不保证可以写入已有包。

### 验证边界

- **本地构建**：`npm ci && npm run build` 仅验证锁定依赖、类型检查和静态产物。
- **CI 构建和测试**：tag 工作流重复 `npm ci && npm run build`；本仓没有独立测试脚本。
- **容器构建**：`./build.sh --tag 1.0.0` 复用 Dockerfile，但不推送镜像。
- **GHCR 推送**：仅由满足校验的 tag 工作流执行；登录或镜像构建成功不代表两个标签都已发布。
- **匿名拉取**：仅在包设为 Public 后，以 `docker pull ghcr.io/g2rain/g2rain-admin-shell:1.0.0` 单独验证。
- **在线演示**：平台演示是 [G2rain 主仓库说明](https://github.com/g2rain/g2rain#在线演示)中的独立环境，不是本次镜像发布或部署验证。
- **实际部署验证**：需在目标环境注入密钥、SSO、Gateway/IAM 配置并验证 Context Path、刷新回退和真实子应用联调。

产物镜像需在 `g2rain-deploy` 的 `services.conf` / Compose 中登记后，由 `./update.sh <service>` 拉取构建并启动。入口路径示例：`/admin/`。

## OpenResty 镜像（含 Application-DPoP）

模板提供 `Dockerfile` + `nginx/default.conf.template` + `lua/`：

1. 本地生成密钥：`./scripts/generate-sign-keys.sh`（或 `scripts/generate-sign-keys.ps1`）
2. 将真实 **IAM** 公钥写入 `lua/keys/iam-public-key.pem`（勿提交）
3. 构建镜像时 **不** 把私钥打进层；运行时由 deploy 挂载 `config/<project>/keys`
4. 暴露 `/lua/sign_code`、`/keys/iam-key-id`、`/keys/iam-public-key`（另有 Context Path 前缀变体）

最终镜像实际包含 Vite 的 `dist/`、Lua 签名脚本、Nginx 模板、启动脚本和 `lua/keys/README.md`，并只创建空密钥目录；私钥、DER、公钥 PEM 与 key id 必须通过运行时只读 volume 或 Secret 注入。已跟踪的 `.env` 现被 `.dockerignore` 排除于 Docker 构建上下文；这只限制镜像构建输入，不会改变其 Git 可见性，维护者仍须评估其中开发上游地址的公开性。`.env.production` 中的 `SSO_BASE_URL` 是占位符，容器启动时由环境变量注入 `env-config.js`。

本地签名侧车（开发）：

```bash
docker compose -f docker-compose.sign.yml up --build
```

开发环境可将 `VITE_BACKEND_ORIGIN` 指向签名侧车（仅测签名）或指向同时提供 `/admin/api`、`/admin/auth`、`/admin/lua` 的上游（与 main-shell 同款）。在 deploy 栈内由本容器 OpenResty 提供签名，无需侧车。

## Nginx 纯静态示例

参考 `nginx/default.conf.example`（无 Lua）。生产签名必须用 OpenResty 模板或等价边缘。

## 检查清单

- [ ] Context Path 与网关入口文档一致
- [ ] 私钥仅 volume / secret 注入，未进 Git / 镜像层
- [ ] 静态资源 404 回退正确
- [ ] 子应用 `entry` 仅来自受信配置
- [ ] 生产 `SSO_BASE_URL` 已注入（`env-config.js`）
