import { Outlet } from "react-router-dom";
import { ExampleProvider } from "./model";

/**
 * 示例布局
 *
 * 这是 `src/pages/example/` 的示例布局，演示了如何在该路由模块内注入 Provider。
 * 新建项目时可直接删除 `src/pages/example/` 目录。
 */
export default function ExampleLayout() {
  return (
    <ExampleProvider>
      <div className="min-h-screen flex flex-col">
        <header className="bg-gray-800 text-white p-4">
          <h1 className="text-2xl font-bold">示例页面</h1>
        </header>
        <main className="flex-grow p-4">
          <Outlet />
        </main>
        <footer className="bg-gray-800 text-white p-4">
          <p>&copy; template-vite-server. All rights reserved.</p>
        </footer>
      </div>
    </ExampleProvider>
  );
}
