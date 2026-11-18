# 安装与本地运行

> 本项目的定位是「可读、可复现的个人改造层」，不是一个完整的安装包。
> 你需要先有一个可运行的 dsh，再把本仓库的插件和配置挂上去。

## 0. 你需要先知道的事

- 仅支持 Windows 10/11。
- 需要 Node.js >= 24.9、pnpm 11.x、Git。
- dsh 必须固定在上游 `0.2.2-rc.1`，提交 `fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159`。
- dsh-pet 是可选能力：只开工作台可以不要桌宠；要微信渠道或桌面 Helper 才需要。
- 不要从本仓库寻找 dsh / dsh-pet 的源码或桌宠素材，本仓库不包含它们。

## 1. 准备 dsh

```powershell
git clone https://github.com/deepseek-ai/deepseek-harness.git dsh
cd dsh
git checkout fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159
pnpm install
pnpm run build
```

构建耗时较长；构建完成后，确认 `dsh/apps/cli/lib/bin.js` 存在。

## 2. 准备 dsh profile

dsh 用 `DSH_HOME` 作为数据目录。本项目默认使用仓库根目录下的 `.dsh-home`：

```powershell
$env:DSH_HOME = (Join-Path $PWD ".dsh-home")
```

如果你已经有 `studio` profile，可以跳过创建；没有的话，先按 dsh 文档创建 profile，或把本仓库的 `config/cordis.patch.example.yml` 复制到：

```text
.dsh-home/profiles/studio/cordis.patch.yml
```

然后把 `config/preset-settings.example.json` 复制到：

```text
studio/profile/preset-settings.json
```

## 3. 挂载插件

```powershell
pwsh ./scripts/bootstrap.ps1 -DshPath .\dsh
```

脚本会建立以下 Junction：

```text
.dsh-home/profiles/studio/node_modules/studio-brand
.dsh-home/profiles/studio/node_modules/studio-settings-entry
.dsh-home/profiles/studio/node_modules/studio-pet-settings
.dsh-home/profiles/studio/node_modules/studio-preset-settings
```

对应源目录是 `studio/plugins/*`。

### 可选：桌宠 / 微信

从 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet) 获取 `dsh-pet-only@0.4.7`，按上游 README 安装。若你要使用微信渠道的「按渠道裁剪」，再运行：

```powershell
node ./patches/dsh-pet/patch-pet-channel.mjs
```

注意：这个脚本会修改 dsh-pet 的 `lib/*.js` 构建产物。上游代码仍受 MIT 约束；素材仍受上游的「禁止商用、公开二创须署名」约束，本仓库不提供素材。

## 4. 第一次启动前：设置模型密钥

工作台需要两个环境变量：

```text
SPARK_API_KEY
ZHIPU_API_KEY
```

在你自己的模型平台获取值后，打开 Windows 的「设置 → 系统 → 系统信息 → 高级系统设置 → 环境变量」，添加到**用户变量**。设置完成后重新打开终端。

## 5. 应用 dsh 补丁

`patches/dsh/dsh-0.2.2-rc.1-local-changes.patch` 是对上游的 7 个文件修改。首次复现时：

```powershell
cd dsh
git apply ..\patches\dsh\dsh-0.2.2-rc.1-local-changes.patch
pnpm run build
cd ..
```

如果你不想应用补丁，也可以只使用本仓库的插件；但品牌标题、插件导航收敛等行为可能不完整。

## 6. 启动与停止

双击：

```text
scripts\start-studio.cmd
```

或使用 PowerShell：

```powershell
pwsh ./scripts/start-studio.ps1
```

停止：

```text
scripts\stop-studio.cmd
```

脚本会先重跑预设生成器（如果 `default-preset.yml` 不存在），再启动：

```text
node dsh/apps/cli/lib/bin.js --profile studio --patch studio/overlay.yml --patch studio/profile/default-preset.yml --port 3099
```

浏览器打开脚本打印的地址。token 每次启动都会变，旧链接会返回 401。

## 7. 常见问题

**启动时报 `Unknown agent preset`**

确认 `studio/profile/default-preset.yml` 存在，并且 `start-studio.ps1` 的 `--patch` 参数指向它。

**设置页里没有「Agent 预设」**

确认 `studio-preset-settings` Junction 已建立，并确认 profile patch 里 `ui-agent-preset` 已停用；两者不能同时注册同一个 `settings.section`。

**微信里没有桌宠**

dsh-pet 是可选依赖；没有安装上游包时，微信渠道不会出现。不要试图从本仓库复制素材。

**能不能升级 dsh？**

本项目冻结在 `0.2.2-rc.1`。升级需要重放 `patches/`、重新验证插件 API 和构建产物，属于另一个工程，不在本仓库承诺范围内。
