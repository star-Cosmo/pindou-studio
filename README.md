# 拼豆工坊 · Pindou Studio

> **v1.0.0** · 图片转拼豆图纸的在线工具 — 上传图片，自动匹配色板，生成带标注的网格图纸和物料清单

## 功能

- **图片转图纸** — 上传图片，自动匹配拼豆色板，生成带编码标注的网格图纸
- **双转换模式** — 细节优先（Floyd-Steinberg 抖动算法）和平滑自然（颜色平均）两种模式
- **多比例选择** — 原比例、1:1、3:4、4:3、16:9、9:6，宽度 20-200 珠可调
- **下载高清 PNG** — 含物料清单，标注每种颜色编码和所需数量
- **用户系统** — 邮箱注册登录，管理员后台
- **图纸历史** — 保存图纸记录，支持重新下载、发布到社区
- **社区画廊** — 浏览他人作品，点赞互动
- **管理后台** — 用户管理（查询/新增/删除/改密码）、图纸管理（上架/下架/删除）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## Supabase 后端服务

本项目使用 [Supabase](https://supabase.com) 作为后端，它是一个开源的 Firebase 替代品，提供以下核心服务：

| 服务 | 用途 |
|---|---|
| **Auth** | 用户注册、登录、会话管理、密码重置 |
| **Database** | 用户档案、图纸数据、点赞记录的存储 |
| **Storage** | 图纸缩略图图片存储 |
| **Row Level Security** | 数据访问权限控制 |

### Supabase 项目创建步骤

1. 打开 [supabase.com](https://supabase.com)，点击 **Start your project** 注册账号
2. 进入 Dashboard → **New project**，填写项目名称和数据库密码
3. 选择离你最近的服务器区域，点击 **Create new project**
4. 等待项目创建完成（约 1-2 分钟）

### 获取配置密钥

在项目 Dashboard 中：

| 密钥 | 位置 |
|---|---|
| `VITE_SUPABASE_URL` | **Project Settings → API → Project URL** |
| `VITE_SUPABASE_ANON_KEY` | **Project Settings → API → anon public key** |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → service_role key** |

### 环境变量

在项目根目录创建 `.env` 文件（已加入 `.gitignore`，不会提交到仓库）：

```env
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_你的匿名密钥
VITE_SUPABASE_SERVICE_ROLE_KEY=ssb_secret_你的服务角色密钥
```

> `service_role key` 拥有最高权限，仅用于管理后台的增删用户操作，请勿泄露。

### 数据库初始化

在 Supabase Dashboard → **SQL Editor** 中，按顺序运行以下脚本：

1. **`supabase-setup.sql`** — 创建 profiles、patterns、likes 表，配置 RLS 策略和存储桶
2. **`supabase-migration.sql`** — 补充 username、status、grid_data 等字段

### 启用邮箱密码登录

1. 进入 **Authentication → Providers**
2. 找到 **Email**，确保 **Enabled** 已开启
3. 在 **Confirm email** 设置中选择是否要求邮箱确认（开发阶段建议关闭）

### 主要表结构

**profiles** — 用户档案
| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | UUID | 用户 ID（关联 auth.users） |
| email | TEXT | 邮箱 |
| username | TEXT | 用户名（唯一） |
| is_admin | BOOLEAN | 管理员标志 |
| status | TEXT | 状态（active/disabled） |
| created_at | TIMESTAMPTZ | 注册时间 |

**patterns** — 拼豆图纸
| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 作者 ID |
| title | TEXT | 标题 |
| grid_width / grid_height | INTEGER | 网格尺寸 |
| grid_data | TEXT | 完整网格颜色编码 JSON |
| thumbnail_url | TEXT | 缩略图 URL |
| is_public | BOOLEAN | 是否公开 |
| likes_count | INTEGER | 点赞数 |

## 部署

项目已配置 GitHub Pages 部署（Hash 路由）：

```bash
npm run build
# 将 dist/ 部署到 GitHub Pages
```

## 项目结构

```
src/
├── lib/            # 工具库（Supabase 客户端、色板转换）
├── stores/         # Pinia 状态（auth、patterns、admin）
├── views/          # 页面组件
├── components/     # 通用组件
├── router/         # 路由配置
├── data/           # MARD 291 色色板数据
└── main.ts         # 入口
```
