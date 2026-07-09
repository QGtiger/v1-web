# template-vite-server

基于 Vite 8 + React 19 + TypeScript 6 的全栈项目模板，前端使用文件系统路由与轻量级状态管理，后端使用 `@lightfish/server` 约定式路由。

> 这是模板项目，所有示例代码均可放心修改或删除。

## 技术栈

| 能力        | 方案                                            |
| ----------- | ----------------------------------------------- |
| 构建工具    | Vite 8                                          |
| UI 框架     | React 19                                        |
| 类型系统    | TypeScript 6                                    |
| 路由方案    | `@lightfish/router` — 文件系统路由              |
| 状态管理    | `@lightfish/react-model` — 桥接 hook 到 Context |
| 样式方案    | Tailwind CSS 4                                  |
| 代码规范    | ESLint 10                                       |
| 后端 / ORM  | `@lightfish/server` + Drizzle ORM + PostgreSQL  |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动前端开发服务器（默认 http://localhost:8000）
pnpm dev

# 构建生产版本
pnpm build

# 预览构建产物
pnpm preview

# 代码检查
pnpm lint

# 同步数据库 schema（修改 schema 后执行）
pnpm db:push
```

## 项目结构

```
项目根/
├── src/                          # 前端应用
│   ├── pages/                    # 页面组件（文件系统路由）
│   │   ├── index.tsx             # / 首页占位页（请替换为真实业务首页）
│   │   ├── layout.tsx            # 根布局
│   │   └── example/              # 示例路由模块（可直接删除）
│   │       ├── model.ts          # 局部状态模型
│   │       ├── layout.tsx        # 布局壳（Provider + Outlet）
│   │       └── index.tsx         # 示例页面 UI
│   ├── components/               # 共享组件（复用时抽离）
│   ├── hooks/                    # 共享 hooks（复用时抽离）
│   ├── models/                   # 全局状态模型（跨路由共享）
│   ├── utils/                    # 工具函数
│   ├── types/                    # 共享类型定义
│   ├── main.css                  # 全局样式（Tailwind + @utility）
│   └── main.tsx                  # 应用入口
├── server/                       # lightfish-server 后端
│   ├── schema/index.ts           # Drizzle ORM 数据库 Schema
│   └── router/                   # 约定式路由
│       └── <module>/index.ts
├── lightfish-server.config.js    # 后端配置
└── vite.config.ts                # 前端构建配置
```

## 路由

使用 `@lightfish/router` 实现文件系统路由，页面文件自动映射为路由：

| 文件路径                          | 路由                                      |
| --------------------------------- | ----------------------------------------- |
| `src/pages/index.tsx`             | `/`                                       |
| `src/pages/example/index.tsx`     | `/example`                                |
| `src/pages/example/layout.tsx`    | `/example` 及其子路由的**布局壳**         |
| `src/pages/example/404.tsx`       | `/example/*`（未匹配兜底）                |
| `src/pages/example/settings.tsx`  | 页面元信息（用于设置 `document.title`）   |
| `src/pages/blog/[id]/index.tsx`   | `/blog/:id`                               |

> `@lightfish/router` 只识别 `index.tsx` 作为页面入口。

## 状态管理

使用 `@lightfish/react-model` 将自定义 hook 桥接到 React Context：

```tsx
// model.ts
import { createCustomModel } from "@lightfish/react-model";
import { useState } from "react";

function useExample(initial: { id: string }) {
  const [count, setCount] = useState(0);
  return { count, increment: () => setCount((c) => c + 1) };
}

export const { Provider: ExampleProvider, useModel: useExampleModel } =
  createCustomModel(useExample);
```

```tsx
// layout.tsx — 注入状态
import { ExampleProvider } from "./model";

export default function ExampleLayout() {
  return (
    <ExampleProvider value={{ id: "default" }}>
      <Outlet />
    </ExampleProvider>
  );
}

// index.tsx — 消费状态
import { useExampleModel } from "./model";

export default function ExamplePage() {
  const { count, increment } = useExampleModel();
  // ...
}
```

## 后端开发

后端接口写在 `server/router/<模块>/index.ts`，通过 `@lightfish/server/api` 的 `apiRequest` 在前端调用。详细规范见 `.agents/skills/lightfish-server/SKILL.md`。

前后端协作流程：

1. 在 `server/schema/index.ts` 定义数据表。
2. 执行 `pnpm db:push` 同步到数据库。
3. 在 `server/router/<模块>/index.ts` 写接口 handler。
4. 前端通过 `apiRequest` 调用接口。

## 样式

- 使用 Tailwind CSS 4 utility classes
- 复杂样式用 `@utility` 指令在 `src/main.css` 中定义
- 默认暗色主题，Inter Variable 字体

## 开发原则

- **默认一个文件** — UI、逻辑、状态写在同一个页面文件里，不复用就不抽离
- **类型安全** — 充分利用 TypeScript 6
- **可读性优先** — 代码清晰比聪明重要

## 重要提示

- `src/pages/index.tsx` 是**首页占位页**，请替换为真实业务首页。
- `src/pages/example/` 是**示例路由模块**，仅用于演示 `layout + model + index` 的标准写法，新建项目时可直接删除或覆盖。
- 不要把示例代码当作已实现的业务功能去修改或补全。
