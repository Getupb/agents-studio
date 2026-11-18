# 桌宠 / 桌面 Helper

桌宠来自 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet)，本仓库只保留集成代码和补丁，不包含桌宠素材。

## 为什么不把素材放进仓库

dsh-pet 的 README 写明：

> 许可：代码 MIT；素材禁止商用；二创在公开渠道须署名。

所以本仓库不分发桌宠图片、音频、字体；需要桌宠时，请从上游获取并遵守上游授权。仓库里也没有 `上首软糖体` 字体文件。

## 本仓库做的改动

- 桌宠的品牌文案与工作台统一；
- 菜单快捷键改为 `Ctrl+左键` 对话、`Ctrl+右键` 打开网页；
- 文件拖到 Helper 上时进入「待输入 + 已上传附件」状态；
- 微信渠道增加「正在输入中」状态；
- 桌宠的 `presetSetup` 支持微信渠道内部变体。

这些改动大多在 dsh-pet 的构建产物里，所以 `patches/dsh-pet/patch-pet-channel.mjs` 和 `patches/dsh-pet/patch-session-share.mjs` 需要同时改多份 `lib/*.js`；不要只改源码，宿主实际加载的是构建产物。

## 安装

1. 从上游获取 `dsh-pet-only@0.4.7`；
2. 按上游 README 安装桌面 Helper；
3. 如果使用微信裁剪，运行 `node patches/dsh-pet/patch-pet-channel.mjs`；
4. 如果使用微信渠道，运行 `node patches/dsh-pet/patch-session-share.mjs`，避免工作台页面和微信争抢同一间会话的写句柄；
5. 重启工作台。

## 已知限制

- Windows only；
- Helper 依赖 Electron，首次启动较慢；
- 上游素材授权限制不因本仓库的代码许可证而改变。
