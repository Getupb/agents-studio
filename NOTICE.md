Agents Studio — 第三方项目与归属说明
==================================================

本项目是一个个人学习与二次开发项目，不是 DeepSeek Harness（dsh）或
dsh-pet 的官方项目，也不代表上游作者。

本仓库只包含我自己的集成层代码、补丁脚本、配置模板与文档，不包含
dsh 或 dsh-pet 的上游源码、构建产物、运行数据或素材文件。使用本仓库
时，dsh 与 dsh-pet 由使用者按各自的许可证另行获取。

1. DeepSeek Harness (dsh)
   - 仓库：https://github.com/deepseek-ai/deepseek-harness
   - 本仓库基于的版本：0.2.2-rc.1
   - 固定提交：fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159（2026-11-04）
   - 许可证：MIT License
   - 版权：Copyright (c) 2026 DeepSeek
   - 说明：本项目对 dsh 的少量本地修改已整理为 patches/dsh/ 下的补丁，
     方便审阅和复现；这些修改仍受 dsh 的 MIT 许可证约束。

2. dsh-pet / dsh-pet-only
   - 仓库：https://github.com/PC2005-cloud/dsh-pet
   - 本仓库基于的版本：dsh-pet-only 0.4.7
   - 代码许可证：MIT License
   - 版权：Copyright (c) 2026 PC2005-cloud
   - 重要限制：dsh-pet 的 README 明确写明「代码 MIT；素材禁止商用；
     二创在公开渠道须署名」。因此：
       * 本仓库不包含桌宠图片、音频、字体等素材；
       * 本仓库不包含 dsh-pet 的完整源码或构建产物；
       * 需要桌宠功能时，请从上游获取，并遵守上游对素材的单独限制。
   - 本仓库对 dsh-pet 的渠道选择补丁位于 patches/dsh-pet/，仅修改代码
     行为，不改变上游素材的授权。

3. 字体
   - dsh-pet 上游包含「上首软糖体」等字体文件。本仓库不复制、不再分发
     任何字体文件。字体是否可以商用/再分发，请以字体权利人的授权为准。

4. 品牌图形
   - 工作台左上角的鲸鱼图形路径来自 dsh 的 MIT 代码（ui-primitives），
     仅以代码内联方式复用，不包含独立的图片素材文件。

5. 第三方依赖
   - 依赖项的许可证以各自 package.json / LICENSE 为准。
   - 如果将来把 dsh 的 THIRD_PARTY_NOTICES.md 一并带入发布，请保留其
     完整内容；本仓库当前不复制该文件。

如果你认为本仓库的归属说明有遗漏，请通过 Issue 联系我，我会尽快修正。
