# AlgorithmGuessr

AlgorithmGuessr 是一个部署在 Cloudflare Workers 上的互动练习平台。用户可以在指定的 Codeforces 难度区间内随机抽取题目，通过阅读题面判断题目的算法标签。当用户提交答案后，系统会给出正误反馈并实时更新积分，管理员还可以进行用户管理与注册控制。

## 功能概览

- **题目抽取**：从 Codeforces 题库中按指定难度随机抽题，并尝试从 VJudge 获取题面、标签及难度等信息，无法获取时自动回退到原题链接。
- **算法标签挑战**：内置常见算法标签候选项。用户多选后提交，系统校验是否完全匹配题目标签，答对加分、答错扣分。
- **用户系统**：
  - 用户注册 / 登录（支持首个用户自动成为管理员）。
  - JWT 鉴权，支持持久化登录。
  - 个人积分展示与排行榜。
- **管理员能力**：
  - 封禁 / 解封用户。
  - 后台创建用户。
  - 开启 / 关闭公开注册入口。
  - 查看全部用户列表及状态。

## 项目结构

```
.
├── package.json          # 项目依赖与脚本
├── schema.sql            # D1 数据库初始化脚本
├── src
│   ├── ui
│   │   └── index.ts      # 渲染前端界面的模板字符串
│   └── worker.ts         # Cloudflare Worker 主程序
├── tsconfig.json
└── wrangler.toml         # Wrangler 配置
```

## 本地开发

<img width="934" height="686" alt="image" src="https://github.com/user-attachments/assets/6021b6a5-612e-4237-891e-2831b0a2eec9" />
推荐在Github自带的Codespace上面部署，Linux环境很方便

1. 安装依赖：
   ```bash
   npm install
   ```
2. 根据需要修改 `wrangler.toml`，填入实际的 KV、D1 等绑定信息。
3. 初始化数据库（首次运行）：
   ```bash
   wrangler d1 execute algorithm_guessr_db --file=./schema.sql
   ```
4. 启动本地开发环境：
   ```bash
   npm run dev
   ```

## 在 GitHub Codespaces 中快速体验

1. 点击仓库页面上的 **Code → Create codespace on main**，等待环境自动构建。等待10分钟左右
2. Codespace 会基于 `.devcontainer/devcontainer.json` 自动安装 Node.js 20 与项目依赖。
3. 首次启动后在终端执行数据库初始化：
   ```bash
   wrangler d1 execute algorithm_guessr_db --file=./schema.sql
   ```
4. 运行开发服务器：
   ```bash
   npm run dev -- --remote
   ```
   > Codespaces 运行在远端环境，使用 `--remote` 选项以便通过公网 URL 访问。

## 部署（全程使用 Wrangler CLI）

1. 登录 Cloudflare 账号：
   ```bash
   wrangler login
   ```
2. 创建并记录资源标识：
   ```bash
   wrangler kv namespace create PROBLEM_CACHE
   wrangler kv namespace create PROBLEM_CACHE --preview
   wrangler d1 create algorithm_guessr_db
   ```
   > 命令执行后会输出 `id`、`preview_id` 与 `database_id`，请将它们填写到 `wrangler.toml` 中对应的位置。
3. 注入私密配置：
   ```bash
   wrangler secret put JWT_SECRET
   ```
4. 初始化数据库 Schema：
   ```bash
   wrangler d1 execute algorithm_guessr_db --file=./schema.sql
   ```
5. 部署到 Cloudflare Workers：
   ```bash
   wrangler deploy
   ```

## 使用说明

- 第一次部署后，首个注册的账户会自动拥有管理员权限，可用于配置系统。
- 若关闭了公开注册，普通用户无法通过自助注册入口，只能由管理员在后台创建。
- 题面与标签依赖第三方接口，若无法获取，会提示用户前往 Codeforces 原题阅读。

## 安全提示

- 项目默认使用 SHA-256 + 随机盐进行密码哈希，建议在生产环境下结合 HTTPS 与 Cloudflare Zero Trust 等额外防护。
- `JWT_SECRET` 必须妥善保管，定期更换，并确保不同环境使用不同的密钥。
- 请在 Cloudflare 仪表盘中配置合理的速率限制，避免被恶意刷分。

## 许可证

本项目采用 [MIT License](./LICENSE)。
