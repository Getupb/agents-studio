# 配置模板

这些文件是可公开的示例，不含任何 Key、token 或个人路径。

| 文件 | 复制到 | 说明 |
|---|---|---|
| `cordis.patch.example.yml` | `.dsh-home/profiles/studio/cordis.patch.yml` | 模型 provider、权限、内置插件开关 |
| `preset-settings.example.json` | `studio/profile/preset-settings.json` | 默认模式的人设、工具边界、微信渠道 |
| `overlay.example.yml` | `studio/overlay.yml` | 插件登记表 |

## 注意

- `preset-settings.json` 里的 `persona` 是示例人设，可以按你的习惯改。
- 不要把真实 Key 写进这些模板；密钥只放环境变量。
- `cordis.patch.example.yml` 里的 `SPARK_API_KEY` / `ZHIPU_API_KEY` 只是环境变量名，不是值。
- 复制后如果目标文件已存在，不要覆盖；先备份再合并。
