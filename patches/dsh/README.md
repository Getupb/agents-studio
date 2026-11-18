# dsh 本地补丁

`dsh-0.2.2-rc.1-local-changes.patch` 是对上游
`https://github.com/deepseek-ai/deepseek-harness`
固定提交 `fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159` 的修改。

应用：

```powershell
cd dsh
git checkout fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159
git apply ..\patches\dsh\dsh-0.2.2-rc.1-local-changes.patch
pnpm run build
```

修改内容：

- `package.json`：跳过部署环境的 git hooks 安装；
- `ui-layout/AppFrame.tsx`：允许运行时覆盖产品标题；
- `ui-plugin-manager`：插件管理收进设置；
- `ui-schedule`：自动化任务收进设置；
- `agent-preset-registry`：未注册 preset id 回落默认。

这些修改仍受 dsh 的 MIT 许可证约束。补丁只是方便审阅，不改变上游版权。
