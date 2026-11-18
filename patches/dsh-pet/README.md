# dsh-pet 渠道补丁

`patch-pet-channel.mjs` 修改 dsh-pet `0.4.7` 的 `presetSetup`：

- `channel=wechat` 且 `studio/profile/preset-settings.json` 的
  `channels.wechat.mode=custom` 时，挂内部变体 `default-wechat`；
- 变体不可用时回落 `default`，避免旧配置把微信打挂。

dsh-pet 的宿主加载的是 `lib/*.js` 构建产物，所以脚本会同时改多份文件：

```text
studio/vendor/dsh-pet-src/dsh-pet-only/lib/standalone.js
studio/vendor/dsh-pet-src/dsh-pet-only/lib/index.js
studio/vendor/dsh-pet-src/dsh-pet-only/lib/app.js
studio/vendor/dsh-pet-only/lib/...
.dsh-home/profiles/studio/node_modules/dsh-pet-only/lib/...
```

如果你没有把 dsh-pet vendor 到本地，请按你自己的安装路径改脚本里的 `files` 数组。

**注意**：本补丁只改代码行为，不改变 dsh-pet 素材的授权。桌宠图片、音频、字体仍然受上游「禁止商用、公开二创须署名」的限制，本仓库不包含这些素材。

## 会话复用补丁

`patch-session-share.mjs` 修改 dsh-pet `0.4.7` 的 `openPetAgent`：

- 先查 `agents.get(sessionId)`；工作台页面已经打开同一间会话时，直接复用活 agent，不再申请第二个写句柄；
- 首次 `create` / `resume` 失败后、以及两条路径都失败前，都再查一次，覆盖并发打开的情况；
- 同步修 `disposeHandle`：释放失败时保留登记，下一轮 `reclaimSession` 还能重试，避免写锁永久留在会话上。

它同样会改多份 `lib/*.js` 构建产物，避免宿主实际加载的副本漏改。应用后需要重启工作台才会生效。
