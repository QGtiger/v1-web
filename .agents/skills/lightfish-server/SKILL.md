---
name: lightfish-server
description: lightfish-server 全栈开发指南，涵盖 Schema 定义、后端路由开发、前端 apiRequest 调用，以及从数据库到接口的完整工作流
---

# lightfish-server 全栈开发指南

## 项目结构速览

```
项目根/
├── src/                          # 前端应用
├── server/                       # lightfish-server 后端
│   ├── schema/index.ts           # Drizzle ORM 数据库 Schema
│   ├── router/                   # 约定式路由目录
│   │   └── <module>/index.ts     # 路由入口
│   └── migrations/               # 数据库迁移文件（自动生成，勿手动编辑）
├── lightfish-server.config.js        # 后端配置
└── vite.config.ts                # 前端构建配置
```

`lightfish-server.config.js` 示例：

```js
import { defineConfig } from "@lightfish/server";

export default defineConfig({
  port: 3000,
  apiDir: "./server/router",
  appName: "lightfish-front-app-test2", // 数据库 schema 前缀 & 路由前缀
  env: "dev",
});
```

---

## 一、Schema 定义

### 位置与命名空间

Schema 入口为 `server/schema/index.ts`。使用 `pgSchema(appName)` 创建数据库命名空间，避免多应用之间的表名冲突：

```ts
import {
  pgSchema,
  integer,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

const appSchema = pgSchema("lightfish-front-app-test2"); // 与 config 中 appName 一致

export const usersTable = appSchema.table("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  displayName: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }),
  remark: varchar({ length: 500 }),
  active: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
```

### 常用列类型

| Drizzle 类型             | 对应 PG 类型     | 示列      |
| ------------------------ | ---------------- | --------- |
| `integer()`              | INTEGER          | 自增主键  |
| `varchar({ length: N })` | VARCHAR(N)       | 字符串    |
| `boolean()`              | BOOLEAN          | 布尔值    |
| `timestamp()`            | TIMESTAMP        | 时间戳    |
| `jsonb()`                | JSONB            | JSON 对象 |
| `text()`                 | TEXT             | 长文本    |
| `doublePrecision()`      | DOUBLE PRECISION | 浮点数    |

### 约束速查

- `.primaryKey()` — 主键
- `.notNull()` — 非空
- `.unique()` — 唯一约束
- `.default(value)` — 默认值
- `.defaultNow()` — 默认当前时间
- `.generatedAlwaysAsIdentity()` — 自增（适用于 integer 主键）

---

## 二、后端路由开发

### 2.1 约定式路由

`server/router/` 下的文件系统目录结构自动映射为 URL 路径。

**规则**：

- 只有 `index.ts` / `index.js` 被识别为路由文件
- 目录名即 URL 路径名（区分大小写）
- `[paramName]` 格式的目录名表示动态参数

```
server/router/
├── index.ts                    →  /
├── users/
│   ├── index.ts                →  /users
│   └── [id]/
│       └── index.ts            →  /users/:id
└── auth/
    ├── login/
    │   └── index.ts            →  /auth/login
    └── register/
        └── index.ts            →  /auth/register
```

### 2.2 Handler 基本形态

#### PostgreSQL（通过框架注入）

框架默认注入 PG 数据库实例到 `c.get('db')`：

```ts
import type { ContextWithDb } from "@lightfish/server";

// 方法约束（可选）
export const method = "POST";

type SomeBody = {
  // 请求体类型
};

export default async function handler(c: ContextWithDb) {
  // 1. 获取数据库
  const db = c.get("db");
  if (!db) {
    throw new Error("Database not configured");
  }

  // 2. 读取请求体
  const body = await c.req.json<SomeBody>();

  // 3. 读取动态路由参数
  const { id } = c.get("params");

  // 4. 业务逻辑...

  // 5. 直接返回业务数据（框架自动包 { success, data, code }）
  return { id: 1, name: "Alice" };
}
```

#### MySQL（通过 @lightfish/server/pool）

MySQL 连接由 handler 自行通过 `@lightfish/server/pool` 创建，框架不自动注入：

```ts
import { createMySQLDb } from "@lightfish/server/pool";

const db = createMySQLDb({
  connectionString: "mysql://user:pass@host:3306/dbname",
  max: 10,
});

export default async function handler() {
  const products = await db.execute("SELECT * FROM products");
  return products[0];
}
```

### 2.3 HTTP 方法约束

通过 `export const method` 声明：

```ts
export const method = "GET";

export const method = ["GET", "POST"]; // 允许多种方法

// 不声明则所有方法均可访问
```

### 2.4 请求体读取

```ts
const body = await c.req.json<T>();
```

### 2.5 数据库操作

使用 `c.get('db')` 获取 Drizzle ORM 实例，配合 schema 中定义的表进行操作：

```ts
import { eq, and, like, desc } from "drizzle-orm";
import { usersTable } from "../../../schema"; // 相对路径 import

// 查询
const [user] = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, email))
  .limit(1);

// 插入
const [newUser] = await db
  .insert(usersTable)
  .values({ email, displayName, password })
  .returning({ id: usersTable.id, email: usersTable.email });

// 更新
const [updated] = await db
  .update(usersTable)
  .set({ displayName: newName })
  .where(eq(usersTable.id, id))
  .returning();

// 删除
await db.delete(usersTable).where(eq(usersTable.id, id));
```

### 2.6 动态路由参数

目录 `[id]` 对应路径参数 `:id`，通过 `c.get('params')` 获取：

```ts
export default async function handler(c: ContextWithDb) {
  const { id } = c.get("params");
  // id 为 string 类型
}
```

### 2.7 响应与错误

**成功**：直接 return 业务数据，框架统一包装：

```ts
return { id: 1, email: "a@b.com" };
// 实际响应: { "success": true, "data": { "id": 1, "email": "a@b.com" }, "code": 200 }
```

**错误**：throw 异常，框架统一捕获：

```ts
import { ServerError } from "@lightfish/server/shared";

// 通用业务错误（code=400）
throw new ServerError("用户不存在");

// 自定义业务码
throw new ServerError("余额不足", 1001);

// 也可直接 throw Error（code=500）
throw new Error("系统异常");
```

### 2.8 import schema 的相对路径

| 文件位置                       | import 路径          |
| ------------------------------ | -------------------- |
| `server/router/xxx/index.ts`   | `../../schema`       |
| `server/router/a/b/index.ts`   | `../../../schema`    |
| `server/router/a/b/c/index.ts` | `../../../../schema` |

---

## 三、Schema 变更与数据库同步

修改 `server/schema/` 后，**必须**在项目根目录执行以下命令将变更同步到数据库：

```bash
# 推荐（已安装全局 @lightfish/server）
lightfish-server db push

# 或
npx lightfish-server db push
```

**重要规则**：

- **禁止**直接执行 `drizzle-kit` 或 `npx drizzle-kit`，其配置由 `lightfish-server` 统一管理
- 执行 `db push` 会自动处理 schema 命名空间和迁移记录

---

## 四、前端调用后端 API

### 4.1 apiRequest

前端调用本地后端服务统一使用 `@lightfish/server/api` 导出的 `apiRequest`：

```ts
import { apiRequest } from "@lightfish/server/api";
```

**签名与返回类型**：

```ts
apiRequest<T = any>(
  path: string,           // 以 / 开头，对应 server/router/ 下的路径
  config?: AxiosRequestConfig  // axios 配置（method, data, headers 等）
): Promise<{
  success: boolean;
  data?: T;
  message?: string;
  code: number;
}>
```

**使用示例**：

```ts
// GET 请求
const res = await apiRequest<{ id: number; name: string }>("/users");
if (res.success && res.data) {
  console.log(res.data);
}

// POST 请求
const res = await apiRequest<{ id: number }>("/auth/login", {
  method: "POST",
  data: { email: "a@b.com", password: "123456" },
});

// 带动态参数
const res = await apiRequest(`/users/${userId}`);
```

### 4.2 path 规则

`path` 以 `/` 开头，对应 `server/router/` 下的文件路径。无需、也不应手动拼写任何前缀。

### 4.3 与 openapi-fetch 的区分

| 工具                                    | 用途                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| `@lightfish/server/api` 的 `apiRequest` | **调本地 lightfish-server 后端**（`server/router/` 下的接口） |
| `@/.lightfish` 的 `API` (openapi-fetch) | 调 yingdao 开放平台 API                                       |

**简单判断**：访问自己在 `server/router/` 写的接口 → 用 `apiRequest`。

---

## 五、端到端开发流（文档 + 匿名问卷）

以下是一个从零到完整调用的示例，展示了 Schema → Router → Frontend 的完整链路。

### 5.1 定义 Schema

```ts
// server/schema/index.ts
import {
  pgSchema,
  integer,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

const appSchema = pgSchema("lightfish-front-app-test2");

export const surveysTable = appSchema.table("surveys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
```

### 5.2 同步数据库

```bash
lightfish-server db push
```

### 5.3 写路由

```ts
// server/router/surveys/index.ts
import type { ContextWithDb } from "@lightfish/server";
import { ServerError } from "@lightfish/server/shared";
import { surveysTable } from "../../schema";

export const method = ["GET", "POST"];

export default async function surveys(c: ContextWithDb) {
  const db = c.get("db");
  if (!db) throw new ServerError("Database not configured", 503);

  if (c.req.method === "POST") {
    const body = await c.req.json<{ title: string }>();
    if (!body.title?.trim()) throw new ServerError("Title is required");

    const [survey] = await db
      .insert(surveysTable)
      .values({ title: body.title })
      .returning();
    return survey;
  }

  const list = await db.select().from(surveysTable);
  return list;
}
```

### 5.4 前端调用

```ts
import { apiRequest } from "@lightfish/server/api";

// GET
const res =
  await apiRequest<{ id: number; title: string; createdAt: string }[]>(
    "/surveys",
  );

// POST
const res = await apiRequest<{ id: number; title: string }>("/surveys", {
  method: "POST",
  data: { title: "Q1 feedback" },
});
```

---

## 六、生产环境约束

本地 dev 是 Node.js 直接 `import()`，线上是 **VM2 沙盒 + CJS**。关键差异：

- 代码经 esbuild 打包为 CJS，**大部分 npm 依赖会被内联 bundle**，直接可用
- 仅 `EXTERNAL_PACKAGES`（`drizzle-orm`、`@lightfish/server/shared`）会留成 `require()` 调用，VM2 需允许
- 显式 **不可用**：`fs`、`import.meta`、`process.env`、`Buffer` — esbuild 无法内联 builtin 模块

所以写代码时正常 import 纯 JS 的 npm 包即可，esbuild 会帮 bundle 进去。怀疑不一致时：`npx lightfish-server build` → 检查 `dist/server/` 下产物看依赖是否被正确内联。

---

## 检查清单

- [ ] 改 schema 后在项目根执行 `npx lightfish-server db push`（勿直接 `drizzle-kit`）
- [ ] 路由文件必须是 `index.ts`（非 `index.ts` 不会被识别）
- [ ] 动态参数目录名用方括号 `[param]`
- [ ] Handler 默认导出 + `ContextWithDb` 类型标注
- [ ] 使用数据库时先 `c.get('db')` 并判空
- [ ] 请求体用 `c.req.json<T>()` 读取
- [ ] 动态参数用 `c.get('params')` 获取
- [ ] 成功 return 业务数据；错误 `throw new ServerError()` / `throw new Error()`
- [ ] HTTP 方法约束用 `export const method = 'METHOD'` 声明
- [ ] 前端统一用 `apiRequest` 调本地后端
- [ ] `apiRequest` 的 `path` 以 `/` 开头，对应 `server/router/` 下的文件路径
- [ ] 不使用 esbuild 无法内联的内容（`fs`、`import.meta`、`process.env`、`Buffer`）
