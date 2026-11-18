# 贡献指南

这是一个个人项目，但我很欢迎 Issues 和讨论。

## 适合提的内容

- 复现步骤清晰的 Bug；
- 文档错误、安装步骤缺失；
- 对插件边界、配置模型的改进建议；
- 与上游 dsh / dsh-pet 的兼容性问题（请注明版本）。

## 不适合提的内容

- 「把 dsh 升级到最新版」类 PR：本项目上游版本已冻结；
- 把桌宠素材、字体、音频直接提交进仓库：授权不允许；
- 在 Issue/PR 里贴真实 API Key、token、会话内容或微信二维码。

## 提交前

1. 不要提交 `.dsh-home/`、`.runtime/`、`dsh/`、`studio/vendor/`、日志、截图。
2. 运行：

```powershell
pwsh ./scripts/check-public.ps1
```

3. 如果改了 `studio/plugins` 或 `studio/patches`，至少做一次语法检查：

```powershell
node --check studio/plugins/preset-settings/index.mjs
node --check studio/patches/build-zero-preset.mjs
```

4. 在 PR 描述里写清楚：改了什么、怎么验证、是否影响上游冻结版本。

## 许可证

提交代码即表示你同意以本仓库的 PolyForm Noncommercial 1.0.0 授权你的贡献。
如果你不认同这个许可证，请不要提交代码，可以改为提 Issue。
