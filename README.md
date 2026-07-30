# 拼豆工坊 (Pindou Studio)

图片一键转换为拼豆图纸，支持 MARD 291 色标准色板，自动匹配最优颜色。

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

## 环境变量

在 `.env` 文件中配置 Supabase：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=ssb_secret_your_service_role_key
```

## 技术栈

| 技术 | 用途 |
|---|---|
| Vue 3 + Composition API | 前端框架 |
| Vite 8 | 构建工具 |
| TypeScript 6 | 类型安全 |
| Pinia | 状态管理 |
| Vue Router (Hash) | 路由（兼容 GitHub Pages） |
| Supabase | 后端即服务（认证、数据库、存储） |

## 数据库

创建 Supabase 项目后，依次运行以下脚本：

1. `supabase-setup.sql` — 建表、RLS 策略、存储桶
2. `supabase-migration.sql` — 字段补充（用户名、状态、网格数据）

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
