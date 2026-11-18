# 架构说明

## 设计原则

1. **不 fork 框架主体**：尽量用 dsh 的 profile、patch、插件 slot 扩展，把改动限制在 7 个上游文件和少量构建产物。
2. **配置与代码分离**：人设、工具边界、渠道裁剪写到 `preset-settings.json`，由脚本生成预设。
3. **单一默认模式**：工作台、桌宠、微信都挂 `default`；只在微信选择「自定义」时生成内部变体。
4. **渠道只做减法**：微信不会获得主会话没有的工具。

## 运行时结构

```text
dsh host
  └─ profile studio
       ├─ cordis.patch.yml        # 模型 provider、权限、内置插件开关
       ├─ studio/overlay.yml      # 本仓库的插件登记
       └─ default-preset.yml      # 由 build-zero-preset.mjs 生成
```

`studio/overlay.yml` 用 `insert` 登记四个宿主插件：

| 插件 | slot | 作用 |
|---|---|---|
| `studio-brand` | `sidebar.brand.mark` / `sidebar.brand.name` | 左上角品牌 |
| `studio-settings-entry` | `settings.launcher` | 左下角只留「设置」 |
| `studio-pet-settings` | `settings.section` id=`pet` | 桌宠显示与微信配置 |
| `studio-preset-settings` | `settings.section` id=`agent-presets` | 默认模式配置页 |

上游 `ui-agent-preset` 在 `cordis.patch.yml` 里被停用，避免同一个 `settings.section` 被注册两次。

## 预设生成链路

```text
preset-settings.json
  ├─ persona / name / description
  ├─ disabledTools[]
  └─ channels.wechat { mode, disabledTools[] }
          │
          ▼
build-zero-preset.mjs
  ├─ 跑 dsh --dump-config，取 preset-standard 的工具清单
  ├─ 合并 PTC / Cordis 工具
  ├─ 按 disabledTools 过滤顶层插件条目
  ├─ mode=custom 时生成内部变体 default-wechat
  ├─ 写 default-preset.yml
  └─ 写 preset-catalog.json
```

`preset-standard` 在 dump 里可能带 `disabled: true`（因为上游把它停用了）。生成器会剔除这一行，否则唯一预设也会被禁用。

## 设置页

`studio-preset-settings` 分两层：

- 宿主 `index.mjs`：注册 `/studio-preset` 前缀路由。
  - `GET /config`：读 `preset-settings.json` + `preset-catalog.json`。
  - `POST /config`：白名单合并写配置，重跑生成器。
  - `POST /restart`：detached 调用重启脚本（可选）。
- 浏览器 `client.js`：注册 `settings.section`，渲染人设、能力分组、微信渠道、逐工具高级开关。

## 微信渠道

默认 `mode=inherit`，微信直接挂 `default`。

选择 `custom` 时：

- 生成器产出 `default-wechat`，它是 `default` 的同源副本，只少了 `channels.wechat.disabledTools` 里的工具；
- `dsh-pet` 的 `presetSetup` 在 `channel=wechat` 时读 `preset-settings.json`，选择 `default-wechat`；
- 变体挂载失败会回落 `default`，避免旧配置把微信打挂。

## 上游修改

`patches/dsh/dsh-0.2.2-rc.1-local-changes.patch` 包含 7 个文件：

| 文件 | 改动目的 |
|---|---|
| `package.json` | 跳过部署环境的 git hooks 安装 |
| `ui-layout/AppFrame.tsx` | 允许运行时覆盖产品标题 |
| `ui-plugin-manager` | 插件管理收进设置 |
| `ui-schedule` | 自动化任务收进设置 |
| `agent-preset-registry` | 未注册 preset id 回落默认 |

桌宠的 `presetSetup` 补丁在 `patches/dsh-pet/patch-pet-channel.mjs`；会话写句柄复用补丁在 `patches/dsh-pet/patch-session-share.mjs`。两者都需要同步到 dsh-pet 的多份构建产物，因为宿主实际加载的是 `lib/*.js`。
