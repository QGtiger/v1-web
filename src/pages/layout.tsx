import { Outlet } from "react-router-dom";

/**
 * 根布局
 *
 * 这是项目的根布局。模板中保持最小化，仅渲染子路由内容。
 * 当项目需要全局导航栏、侧边栏或全局 Provider 时，可在此扩展。
 */
export default function RootLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
