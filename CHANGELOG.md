# Changelog

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

### 已知限制

- Windows only；
- 上游冻结在 dsh `0.2.2-rc.1` / dsh-pet `0.4.7`；
- 没有一键安装器；
- 自研插件以手工验证为主，尚无完整自动化测试。
