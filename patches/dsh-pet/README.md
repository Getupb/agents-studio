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
