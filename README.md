# Agents Studio

> 一个在 Windows 本机运行的 Agent 工作台：统一设置、单一默认模式、可视化工具边界、桌宠与微信渠道。
>
> 本项目基于 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 和 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet) 做个人化改造，不是上游官方项目。

![平台](https://img.shields.io/badge/平台-Windows-0078D4)
![阶段](https://img.shields.io/badge/阶段-v0.1.0--alpha-orange)
![许可证](https://img.shields.io/badge/许可证-PolyForm%20Noncommercial%201.0.0-blue)

![Agent 预设](docs/assets/settings-agent-preset.png)

## 你将得到什么

- **一个入口**：聊天、文件、图片、模型、插件、自动化任务都在同一个工作台里。
- **一个默认模式**：工作台、桌宠、微信渠道共用同一套人设与工具，不再在多个模式之间切换。
- **可视化配置**：在「设置 → Agent 预设」里改显示名、描述、人设、能力开关和逐项工具开关。
- **按渠道裁剪**：微信渠道可以选「与主会话相同」，也可以只做减法。
- **桌宠与微信**：桌面 Helper 支持图片、文件收发、文件卡片、拖拽附件和「正在输入」状态。
- **本地优先**：默认只监听 `127.0.0.1:3099`，数据留在自己的 `.dsh-home` 里。

工作台本身可以直接跑；**桌宠和微信渠道需要额外安装上游 dsh-pet 0.4.7**，仓库只提供改造层，不包含上游源码、素材和字体。

## 最快上手：把这段提示词交给 AI

在项目根目录打开你常用的 AI 编程助手，把下面整段发给它。它会先读仓库里的文档，再按步骤部署。

```text
你是我的 Windows 本机部署助手。当前目录是 Agents Studio 仓库根目录。

请先读 README.md、docs/install.md、scripts/bootstrap.ps1、scripts/start-studio.cmd、scripts/stop-studio.cmd，然后完成部署：

1. 检查 Node.js >= 24.9、pnpm、Git。缺依赖时只告诉我需要装什么，不要擅自安装系统软件。
2. 克隆固定版本的 dsh：
   git clone https://github.com/deepseek-ai/deepseek-harness.git dsh
   cd dsh
   git checkout fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159
   pnpm install
   pnpm run build
   然后回到项目根目录。
3. 运行 pwsh ./scripts/bootstrap.ps1 -DshPath .\dsh，确认 4 个插件 Junction 和本地配置生成成功。
4. 检查 SPARK_API_KEY / ZHIPU_API_KEY 是否已经在 Windows 用户环境变量里。如果没有，停下来告诉我到“系统属性 → 环境变量”里添加这两个变量名，不要向我索取 Key，也不要把 Key 写进任何文件。
5. 双击或运行 scripts/start-studio.cmd，确认 http://127.0.0.1:3099 返回工作台页面，并把本次带 token 的链接发给我。
6. 再验证 scripts/stop-studio.cmd 能停止 3099 端口上的进程。
7. 如果我要桌宠或微信，再按 docs/pet.md 安装 dsh-pet 0.4.7；否则先只保证工作台可用。
8. 不要提交 .dsh-home、日志、截图、.env 或任何密钥。遇到错误先读日志再修，不要猜。

完成后告诉我：用哪个文件启动、用哪个文件停止、设置页在哪里，以及还需要我手动做什么。
```

如果你更想自己动手，按下面的步骤走。

## 手动安装

### 1. 准备环境

- Windows 10/11
- Node.js >= 24.9
- pnpm 11.x
- Git

### 2. 准备 dsh

在项目根目录执行：

```powershell
git clone https://github.com/deepseek-ai/deepseek-harness.git dsh
cd dsh
git checkout fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159
pnpm install
pnpm run build
cd ..
```

### 3. 安装本仓库的改造层

```powershell
pwsh ./scripts/bootstrap.ps1 -DshPath .\dsh
```

脚本会建立 4 个插件 Junction，并把 `config/*.example.*` 复制成第一份本地配置；已存在的文件不会被覆盖。

### 4. 第一次启动前：设置模型 Key

工作台启动时需要两个环境变量：

```text
SPARK_API_KEY
ZHIPU_API_KEY
```

在你自己的模型平台获取 Key 后，打开 Windows 的「设置 → 系统 → 系统信息 → 高级系统设置 → 环境变量」，把它们添加到**用户变量**。值只保存在你自己的环境变量里，不需要发给我，也不要写进 README、脚本或仓库。

设置完成后，重新打开一个终端或重新登录 Windows，让新变量生效。

### 5. 打开与关闭

```text
启动：双击 scripts\start-studio.cmd
停止：双击 scripts\stop-studio.cmd
重启：双击 scripts\restart-studio.cmd
```

启动窗口会打印一个带 token 的链接，例如：

```text
http://127.0.0.1:3099/?token=...
```

**每次启动 token 都会变，请使用本次窗口打印的链接；旧链接会返回 401。启动窗口不要关闭，关闭窗口就会停止服务。**

## 界面怎么用

- 左下角只有「设置」一个入口。
- 设置里包含「通用设置」「模型」「插件」「自动化任务」「Agent 预设」。
- 在「Agent 预设 → 默认模式」里可以修改：
  - 显示名、描述、人设；
  - 能力开关；
  - 逐项工具开关。
- 在「微信渠道」里可以选择：
  - **与主会话相同**：微信直接使用默认模式；
  - **自定义（只做减法）**：只移除部分工具，不会增加主会话没有的工具。
- 保存后重启工作台生效。

更细的说明：

- [安装与本地运行](docs/install.md)
- [架构说明](docs/architecture.md)
- [微信渠道](docs/wechat-channel.md)
- [桌宠 / 桌面 Helper](docs/pet.md)

## 常见问题

**双击 `start-studio.cmd` 后窗口一闪而过？**

右键文件，选择「在终端中运行」，看它打印的错误。最常见的原因是 dsh 还没构建，或者两个环境变量还没设置。

**提示 `Unknown agent preset`？**

确认 `studio/profile/default-preset.yml` 存在。没有的话，先运行 `pwsh ./scripts/bootstrap.ps1 -DshPath .\dsh`。

**设置页里没有「Agent 预设」？**

确认 4 个插件 Junction 已建立，并且 `cordis.patch.yml` 里没有同时启用上游的只读预设页。

**微信里没有桌宠或图片？**

先确认 dsh-pet 0.4.7 已安装，再按 [docs/pet.md](docs/pet.md) 检查补丁和渠道配置。

**能不能升级 dsh？**

本项目冻结在 `dsh 0.2.2-rc.1` / `dsh-pet 0.4.7`。升级需要重放 `patches/` 下的修改并重新验证，属于另一项工程，不在当前版本承诺范围内。

## 项目来源与边界

这是个人二次开发项目，不是 DeepSeek、dsh 或 dsh-pet 的官方项目。

| 上游 | 冻结版本 | 作用 |
|---|---|---|
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | `0.2.2-rc.1`，提交 `fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159` | Agent 运行时、工具、会话、Web 工作台 |
| [dsh-pet](https://github.com/PC2005-cloud/dsh-pet) | `dsh-pet-only 0.4.7` | 桌面 Helper、桌宠、微信通道 |

仓库里的 `studio/plugins`、`studio/patches`、`patches/` 和文档是本项目在上下游之上做的改造层，约 1,800 行；上游的架构、工具系统和桌宠主体不是本项目的成果。上游版本已经冻结，后续上游更新与本项目无关。

桌宠素材（图片、音频、字体）不随本仓库分发；dsh-pet 上游对素材的限制是「禁止商用、公开二创须署名」。

## 已知限制

- 仅支持 Windows；启动脚本和 Helper 都按 Windows 路径写。
- 没有一键安装器；首次搭建需要 AI 或手动执行文档步骤。
- 自研插件以手工验证为主，没有完整的单元测试和 E2E。
- 没有账号体系、多租户、配额或公网部署方案，不适合直接暴露到公网。
- 项目仍在 `v0.1.0-alpha` 阶段，接口和目录可能调整。

## 许可证

- **本仓库的原创代码与文档**：PolyForm Noncommercial License 1.0.0，禁止商业使用。见 [LICENSE](LICENSE)。
- **dsh**：MIT，版权归 DeepSeek；见 [LICENSES/dsh-MIT.txt](LICENSES/dsh-MIT.txt)。
- **dsh-pet 代码**：MIT，版权归 PC2005-cloud；见 [LICENSES/dsh-pet-MIT.txt](LICENSES/dsh-pet-MIT.txt)。
- **dsh-pet 素材**：不在本仓库分发；上游限制为禁止商用、公开二创须署名。见 [NOTICE.md](NOTICE.md)。

PolyForm Noncommercial 不是 OSI 定义的开源许可证；本仓库属于「源码公开、非商业使用」项目。

## 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [dsh-pet](https://github.com/PC2005-cloud/dsh-pet)

没有这两个项目，就没有这个仓库。
