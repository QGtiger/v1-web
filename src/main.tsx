import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";

// src/router.tsx
import { createFileRoutes } from "@lightfish/router";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// 导入所有页面模块（eager 模式确保路由表立即可用）
const pages = import.meta.glob("/src/pages/**/*.tsx", {
  eager: true,
}) as Record<string, any>;
const layouts = import.meta.glob("/src/pages/**/layout.tsx", {
  eager: true,
}) as Record<string, any>;
const notFounds = import.meta.glob("/src/pages/**/404.tsx", {
  eager: true,
}) as Record<string, any>;
const settings = import.meta.glob("/src/pages/**/settings.tsx", {
  eager: true,
}) as Record<string, any>;

const routeObjects = createFileRoutes({
  pages,
  layouts,
  notFounds,
  settings,
  // 以下为默认值，可按需覆盖：
  // rootDir: "/src/pages",
  // ignoredSegmentNames: ["components", "models"],
});

const router = createBrowserRouter(routeObjects);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
