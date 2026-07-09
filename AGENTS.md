# AGENTS.md — template-vite-server

## 项目概览

### 模板项目开发约定

- `src/pages/index.tsx` 是**首页占位页**，仅用于项目初始化时展示，应替换为真实业务首页。
- `src/pages/example/` 是**示例路由模块**，仅用于演示 `layout + model + index` 的标准写法，新建项目时可直接删除或覆盖。
- 不要把示例代码当作已实现的业务功能去修改或补全。
- 新增功能时，遵循本文件约定的目录结构、命名规范和分层方式。

## 全栈架构

本项目是前端 + 后端一体化的全栈模板：

- **前端**：Vite + React + TypeScript + Tailwind CSS，使用 `@lightfish/router` 文件系统路由和 `@lightfish/react-model` 状态管理。
- **后端**：`@lightfish/server` 约定式路由 + Drizzle ORM + PostgreSQL，接口文件放在 `server/router/`。

### 完整目录结构

```
项目根/
├── src/                          # 前端应用
├── server/                       # lightfish-server 后端
│   ├── schema/index.ts           # Drizzle ORM 数据库 Schema
│   └── router/                   # 约定式路由
│       └── <module>/index.ts
├── lightfish-server.config.js    # 后端配置
└── vite.config.ts                # 前端构建配置
```

### 常用命令

| 命令            | 说明                              |
| --------------- | --------------------------------- |
| `pnpm dev`      | 启动前端开发服务器                |
| `pnpm build`    | 构建前端生产包                    |
| `pnpm lint`     | 运行 ESLint                       |
| `pnpm db:push`  | 同步数据库 schema（改 schema 后必做） |

### 前后端协作流程

1. 在 `server/schema/index.ts` 定义数据表。
2. 执行 `pnpm db:push` 同步到数据库。
3. 在 `server/router/<模块>/index.ts` 写接口 handler。
4. 前端通过 `@lightfish/server/api` 的 `apiRequest` 调用接口。

后端开发详细规范（schema、路由、handler、apiRequest、生产环境约束）见 `.agents/skills/lightfish-server/SKILL.md`。

---

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

---

## 1. 路由 & 页面结构（文件系统路由）

### 路由映射规则

| 文件路径                          | 路由                                      |
| --------------------------------- | ----------------------------------------- |
| `src/pages/index.tsx`             | `/`                                       |
| `src/pages/example/index.tsx`     | `/example`                                |
| `src/pages/example/layout.tsx`    | `/example` 及其子路由的**布局壳**         |
| `src/pages/example/404.tsx`       | `/example/*`（未匹配兜底）                |
| `src/pages/example/settings.tsx`  | 页面元信息（用于设置 `document.title`）   |
| `src/pages/blog/[id]/index.tsx`   | `/blog/:id`                               |

> 注意：`@lightfish/router` 只识别 `index.tsx` 作为页面入口，单文件页面（如 `example.tsx`、`blog/[id].tsx`）不会生成路由；`settings.tsx` 也不是独立路由。

### layout.tsx — 布局壳

`layout.tsx` 渲染**外围框架**（导航栏、侧边栏、Provider 包裹等），内部使用 `<Outlet />` 渲染子路由页面。

```tsx
// src/pages/example/layout.tsx
export default function ExampleLayout() {
  return (
    <div className="flex h-screen">
      <aside>侧边栏</aside>
      <main className="flex-1">
        <Outlet /> {/* ← 子路由在此渲染 */}
      </main>
    </div>
  );
}
```

**layout.tsx 的职责边界：**

- ✅ 渲染布局框架（flex、grid、导航等）
- ✅ 包裹 `<Outlet />` 渲染子页面
- ✅ 包裹 `<Provider>` 提供**该路由模块**的状态
- ❌ 不能写页面内容（内容在 index.tsx 或子路由中）
- ❌ 不能写请求逻辑或业务状态管理（在 model.ts 中）

### layout + model + index 标准模式

```
pages/example/
├── model.ts      ← ① 定义 hook + createCustomModel
├── layout.tsx    ← ② <Provider><Outlet /></Provider>
└── index.tsx     ← ③ 取状态 + 渲染 UI
```

---

## 2. 状态管理（@lightfish/react-model）

### 基本原理

`createCustomModel(useHook)` 把自定义 hook 桥接到 React Context：

```ts
import { createCustomModel } from "@lightfish/react-model";

function useMyHook(props: { count: number }) {
  // 任意逻辑、useState、useEffect...
  return { count, increment: () => {} };
}

export const { Provider, useModel } = createCustomModel(useMyHook);
```

**Provider 的 value 会作为参数传给 hook：**

```tsx
<Provider value={{ count: 0 }}>
  <Child />
</Provider>
// → useMyHook({ count: 0 }) 在内部运行，返回值注入 Context
```

### 标准三层结构

```ts
// model.ts — 定义状态 + hook
import { createCustomModel } from "@lightfish/react-model";

// 注意：hook 名用 useXxx，对应 useModel 会命名为 useXxxModel
function useExample(initial: { id: string }) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  return {
    messages,
    collapsed,
    setCollapsed,
    send: (text: string) => {
      /* ... */
    },
  };
}

export const { Provider: ExampleProvider, useModel: useExampleModel } =
  createCustomModel(useExample);
//                          ↑ 命名规则：XxxProvider                  ↑ 命名规则：useXxxModel
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
```

```tsx
// index.tsx — 消费状态
import { useExampleModel } from "./model";

export default function ExamplePage() {
  const { messages, collapsed, send } = useExampleModel();
  // ...
}
```

### 常见错误

| ❌ 错误写法                                         | ✅ 正确写法                                                    |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `layout.tsx` 里直接写页面 UI                        | `layout.tsx` 只写布局 + `<Outlet />`                           |
| `layout.tsx` 里用 `useExampleModel()`               | `layout.tsx` 只包裹 `<Provider>`，子页面通过 `useModel()` 消费 |
| `model.ts` 里导出 hook 但不调用 `createCustomModel` | 必须调用 `createCustomModel` 生成 Provider + useModel          |
| 把 Provider 放在 `index.tsx` 里                     | Provider 放在 `layout.tsx` 里，确保**整个**路由模块共享        |

---

## 3. 组件 & 逻辑内聚原则

**默认策略：就近内聚，延迟抽离。全部写在一个文件里，直到被复用才抽离。**

- 页面组件、请求逻辑、UI 片段**先写在一个文件里**
- 1 处使用 → 就地写
- 2 处及以上 → 抽离到对应目录
  - UI 组件 → `src/components/`
  - hooks → `src/hooks/`
  - 工具函数 → `src/utils/`
  - 类型 → `src/types/`

**例外：** 只有 `model.ts` 必须独立文件（因为 createCustomModel 要求单独导出 Provider）。

---

## 4. 样式规范

- 使用 Tailwind CSS 4 utility classes
- 复杂样式用 `@utility` 指令在 `src/main.css` 中定义
- 不要用 `style={{}}` 内联 style（除非动态计算）

---

## 5. 代码组织

```
src/
├── pages/              # 页面组件（文件路由）
│   ├── index.tsx       # /
│   ├── layout.tsx      # 根布局
│   └── example/        # 示例模块（新项目可删除）
│       ├── model.ts    # useExampleModel + createCustomModel → ExampleProvider + useExampleModel
│       ├── layout.tsx  # <ExampleProvider><Outlet /></ExampleProvider>
│       └── index.tsx   # /example — 示例 UI
├── components/         # 共享组件（仅复用时抽离）
│   └── ai-elements/    # AI Elements CLI 生成的组件
├── hooks/              # 共享 hooks（仅复用时抽离）
├── models/             # 全局状态模型（跨路由共享）
├── utils/              # 工具函数
├── types/              # 共享类型定义
├── main.css            # 全局样式（Tailwind + @utility）
└── main.tsx            # 应用入口
```

---

## 6. 开发原则

- **默认一个文件** — UI、逻辑、状态写在同一个页面文件里，不复用就不抽离
- **类型安全** — 充分利用 TypeScript 6
- **可读性优先** — 代码清晰比聪明重要
