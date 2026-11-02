# 已知偏差

本表记录模板相对中央 `frontend-shell 1.0.0` / Main Shell 契约的已知差距。空表项表示当前无额外偏差；有意偏离必须追加行并给出退出条件。

| ID | 描述 | 影响 | 退出条件 |
| --- | --- | --- | --- |
| TPL-001 | 已接菜单挂载 + Tab↔地址栏同步 + `MicroAppFallback` + **深链 `restoreAfterAuth` + `/redirect` Gateway + Vite SPA fallback**；网关离开单飞 + 离开期间抑制 shell URL 同步；生产 Nginx 微路径 document 回退待环境验证 | 生产若未配置微路径回退到**本壳** index（如 `/admin/index.html`）而回退到其他壳（如 `/main/`），F5 会落到错误 Context Path | 目标环境按 `nginx/default.conf.example` 把微路径 document 回退到本壳 `index.html` 后关闭本行 |
| TPL-002 | Token Store / SSO / `bootstrapSession` 已落地；联调冒烟待真实 IAM + Gateway + Sign | 本地无 SSO / Backend 配置时启动或换票失败 | 配置 `VITE_SSO_BASE_URL` + `VITE_BACKEND_ORIGIN` 完成未登录→回调→刷新→退出后关闭本行 |
| TPL-005 | OpenResty/Lua 签名已纳入模板；容器联调与密钥注入待各环境验证 | 生成后需挂载 `lua/keys` | 在目标环境完成 `docker compose -f docker-compose.sign.yml` 或等价镜像冒烟后关闭本行 |
| TPL-006 | ~~REQUEST_TOKEN / route-change 未接~~ → 已接 | — | 可关闭本行 |
| TPL-007 | Token 持久化于 `localStorage` 键 `g2rain-shell-token:${applicationCode}`（旧固定键一次性迁移） | XSS / 共享设备有落盘风险 | 评估 HttpOnly 会话或缩短 refresh；禁止 `console.log` 整包消息 |
| TPL-008 | `loadMicroApp.name` 固定为 `applicationCode`（对齐 vite-plugin-qiankun），**不用** main-shell 的 `` `${name}__${instanceId}` `` | 与 main-shell 命名策略分叉；同应用多实例依赖 qiankun 同名多 load + 子应用按 instanceId 隔离 | 中央 Profile / Appkit 统一多实例命名契约后收敛 |
| TPL-009 | Auth Bridge 经同页 `CustomEvent` 定向下发 `token` / `tokenKid` / **client 浅拷贝**（含私钥 JWK）；禁止 props / URL / storage / 日志 | 同页任意脚本可窃听；接受「同页可信微前端」模型 | 若改为隔离进程或 Token Exchange，更新契约后关闭 |
| TPL-010 | ~~双协议 / `--with-legacy` 覆盖层~~ | — | **已关闭**（本仓已删除 `platform/legacy` 与 `legacy-message-bridge`；`shell-extensions` 为空实现；`legacyCompatibility: false`） |
| TPL-011 | ~~legacy TOKEN_INVALID 仅 applicationCode 路由~~ | — | **已关闭**（随覆盖层删除） |
| TPL-LEGACY-010 | ~~legacy 适配器 Token-in-props~~ | — | **已关闭**（随覆盖层删除） |
| TPL-LEGACY-011 | ~~legacy-message-bridge~~ | — | **已关闭**（随覆盖层删除） |

不得把上表临时状态复制为新生成主应用的长期默认模式。
