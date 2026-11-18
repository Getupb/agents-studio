# Changelog

## v0.1.0-alpha.1 — 2026-11-19

### 修复

- 微信渠道 `回复失败：session "session-pet-wechat-v1" ...`：dsh-pet 与工作台页面同时申请同一间会话的写句柄时，`create`/`resume` 都会失败。新增 `patches/dsh-pet/patch-session-share.mjs`，优先复用 `agents.get(sessionId)` 返回的活 agent，并在首次/二次打开失败后再查一次。
- `disposeHandle()` 释放失败时不再提前从存活句柄表删除，下一轮仍可重试回收；避免写锁永久留在会话上。
- 微信渠道同时保留工具能力与会话记录，不再静默回落原生单轮。
- 微信扫码：`qrcodeUrl` 是 H5 扫码页时不再强行当作图片渲染，新增“打开微信扫码页面”可点击链接兜底。

## v0.1.0-alpha — 2026-11-18

首个公开整理版本。

### 功能

- 单一「默认模式」：工作台、桌宠、微信渠道共用 `default` 预设。
- Agent 预设配置页：显示名、描述、人设、10 组能力开关、逐工具高级开关。
- 微信渠道：支持「与主会话相同」与「只做减法」的自定义工具集。
- 设置收敛：插件管理、自动化任务与通用设置/模型平级；左下角只留「设置」。
- 品牌：工作台左上角显示 Agents Studio 与鲸鱼标。
- 桌宠/微信：文件与图片收发、正在输入状态、文件卡片、拖拽附件进入待输入状态。
- 预设生成：人设/工具边界写回 JSON，重建 `default-preset.yml` 与目录清单。

### 仓库整理

- 移除真实 API Key、`.dsh-home` 会话与运行数据。
- 上游修改导出为 `patches/dsh/*.patch`。
- 桌宠渠道补丁独立到 `patches/dsh-pet/`。
- 增加 README、LICENSE、NOTICE、SECURITY、CONTRIBUTING、Issue/PR 模板与发布检查脚本。
- README 改为面向新使用者的上手文档，增加可交给 AI 的部署提示词。
- 增加无需密钥的 `scripts/start-studio.cmd`、`scripts/stop-studio.cmd`、`scripts/restart-studio.cmd`。
- 增加隐藏启动 `scripts/start-studio-hidden.vbs`，以及开机自启/取消脚本 `scripts/install-startup.ps1`、`scripts/uninstall-startup.ps1`。
- 默认模型说明改为作者个人使用的星火 + 智谱组合，并给出官方 API 入口；API Key 改为在「设置 → 模型」里直接填写，不再要求 Windows 环境变量。
- 部署提示词改为“开箱即用”检查清单，覆盖 4 个插件、默认模型路由、设置页、默认模式、隐藏启动与开机自启。

### 已知限制

- Windows only；
- 上游冻结在 dsh `0.2.2-rc.1` / dsh-pet `0.4.7`；
- 没有一键安装器；
- 自研插件以手工验证为主，尚无完整自动化测试。
