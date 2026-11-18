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
- **默认模型已接好**：文本主力是讯飞星火 Spark X2.6，识图是智谱 GLM；不需要设置环境变量，启动后在「设置 → 模型」里填自己的 Key 即可，也可以换成别的模型。

工作台本身可以直接跑；**桌宠和微信渠道需要额外安装上游 dsh-pet 0.4.7**，仓库只提供改造层，不包含上游源码、素材和字体。

### 默认模型说明

仓库的默认配置是**作者个人在用的组合**，不是强制依赖，也不是排他推荐：

- **讯飞星火 Spark X2.6**：文本主力，支持工具调用和推理。官网：<https://xinghuo.xfyun.cn/sparkapi>，API 文档：<https://www.xfyun.cn/doc/spark/API.html>
- **智谱 GLM**：识图主力（截图、扫描件、图表），也带文本档。开放平台：<https://open.bigmodel.cn/>，API 文档：<https://docs.bigmodel.cn/cn/api/introduction>

你可以在「设置 → 模型」里编辑这两条，填入自己的 API Key；也可以添加 OpenAI、Anthropic、Kimi 或任意 OpenAI/Anthropic 兼容的自定义接口。Key 只保存在工作台自己的凭据里，不会写进仓库。

## 最快上手：把这段提示词交给 AI

在项目根目录打开你常用的 AI 编程助手，把下面整段发给它。它会先读仓库里的文档，再按步骤部署。

```text
你是我的 Windows 本机部署助手。当前目录是 Agents Studio 仓库根目录。
目标：把这台机器搭成和仓库默认配置一致、可以直接使用的工作台：默认模型已接好、4 个工作台插件已装、设置页完整、可以隐藏启动。不要向我索取、读取或写入任何真实 API Key。

请先读 README.md、docs/install.md、docs/pet.md、scripts/bootstrap.ps1、scripts/start-studio.cmd、scripts/start-studio-hidden.vbs、scripts/install-startup.ps1、scripts/stop-studio.cmd，然后按下面执行：

1. 检查 Node.js >= 24.9、pnpm、Git。缺依赖时只告诉我需要装什么，不要擅自安装系统软件。
2. 克隆固定版本的 dsh：
   git clone https://github.com/deepseek-ai/deepseek-harness.git dsh
   cd dsh
   git checkout fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159
   pnpm install
   pnpm run build
   然后回到项目根目录。
3. 运行 pwsh ./scripts/bootstrap.ps1 -DshPath .\dsh，并逐项确认：
   - 4 个插件 Junction 已建立：studio-brand、studio-settings-entry、studio-pet-settings、studio-preset-settings；
   - .dsh-home/profiles/studio/cordis.patch.yml 已生成；
   - studio/profile/preset-settings.json 已生成；
   - studio/profile/default-preset.yml 已生成。
   已存在的文件不要覆盖；如果发现指向旧路径或旧版本，先告诉我再修。
4. 检查 .dsh-home/profiles/studio/cordis.patch.yml 的默认配置：
   - 有 provider spark（星火 Spark X2.6）和 provider zhipu（智谱 GLM 视觉）；
   - agent-default-model 是 spark / spark-x2.6；
   - permission.defaultPreset 是 full-access-ask（Windows 上 workspace-write 会让 shell 挂起）。
   缺什么就按 config/cordis.patch.example.yml 补齐。不要把任何 Key 写进这个文件。
5. 双击或运行 scripts/start-studio.cmd，确认 http://127.0.0.1:3099 返回工作台页面，并把本次带 token 的链接发给我。没有 Key 也要能启动，不要因为缺少环境变量而退出。
6. 在工作台里检查并逐项告诉我：
   - 侧边栏只有「设置」一个入口；
   - 设置里有「通用设置」「模型」「插件」「自动化任务」「Agent 预设」；
   - 模型页能看到「星火 Spark X2.6」和「智谱 GLM 视觉」，默认模型是 Spark X2.6；
   - 插件页「已安装」能看到 4 个 studio-* 插件；
   - Agent 预设里只有「默认模式」，可以改人设和工具开关。
7. 不要设置 Windows 环境变量，也不要向我索取 Key。告诉我到「设置 → 模型 → 星火 Spark X2.6 → 编辑 → API 密钥 → 保存」填自己的 Key；智谱同理。留空也能启动，只是暂时不能调用对应模型。
8. 验证 scripts/stop-studio.cmd 能停止 3099 端口；再说明隐藏启动 scripts/start-studio-hidden.vbs（链接和日志去 studio.log 看）和开机自启 scripts/install-startup.ps1 / 取消 scripts/uninstall-startup.ps1 的用法。
9. 只有我明确说要桌宠或微信时，再按 docs/pet.md 安装 dsh-pet 0.4.7 并运行 node ./patches/dsh-pet/patch-pet-channel.mjs。没有安装就明确说：工作台插件已装，桌宠/微信未装。
10. 不要提交 .dsh-home、日志、截图、.env、.credentials.yaml 或任何密钥。遇到错误先读日志再修，不要猜。

完成后按这个清单逐项打勾：dsh 构建、4 个插件、默认模型路由、设置页、模型页两行、插件页已安装、默认模式、启动/停止、隐藏启动、开机自启。哪一项没做到就明确说没做到，不要笼统说“已完成”。
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

### 4. 模型 Key：启动后在设置里填

**不需要设置 Windows 环境变量。** 启动工作台后，左侧「设置 → 模型」里已经预置了两行：

- 星火 Spark X2.6（文本主力）
- 智谱 GLM 视觉（截图 / 图片）

点「编辑」，在「API 密钥」里填入你自己的 Key，保存即可。Key 保存在工作台的本地凭据里，不会进入仓库。

默认的星火 + 智谱组合只是作者个人在用的配置；如果你要用别的模型：
- 在「模型」页点「添加模型提供商」，从内置目录选 OpenAI、Anthropic、Kimi 等；
- 或者选「自定义模型 API」，填 Base URL、协议和模型 ID，接入中转站或自部署服务。

官方入口：[讯飞星火 API](https://xinghuo.xfyun.cn/sparkapi) ｜ [智谱 BigModel](https://open.bigmodel.cn/)

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

### 6. 后台隐藏启动与开机自启

不想看到 CMD 窗口时，双击：

```text
scripts\start-studio-hidden.vbs
```

它会在后台启动服务，不弹出浏览器，也不显示任务栏窗口。启动日志写到项目根目录的 `studio.log`，在里面搜索 `http://127.0.0.1:3099/?token=` 就能找到本次链接。停止仍然使用 `scripts\stop-studio.cmd`。

如果 3099 端口已经在监听，VBS 会直接退出，不会重复启动。

开机自启：

```powershell
pwsh ./scripts/install-startup.ps1
```

它会在当前用户的「启动」文件夹里创建一个指向 `wscript.exe` 的快捷方式，登录 Windows 后自动隐藏启动。取消：

```powershell
pwsh ./scripts/uninstall-startup.ps1
```

开机自启前，请先在「设置 → 模型」里确认 Key 已保存；不需要设置 Windows 环境变量。

## 界面怎么用

- 左下角只有「设置」一个入口。
- 设置里包含「通用设置」「模型」「插件」「自动化任务」「Agent 预设」。
- 「模型」里默认有「星火 Spark X2.6」和「智谱 GLM 视觉」两行；点「编辑」填自己的 API Key，或点「添加模型提供商」换成别的模型。
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

右键文件，选择「在终端中运行」，看它打印的错误。最常见的原因是 dsh 还没构建，或者模型 Key 还没在「设置 → 模型」里保存。

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
