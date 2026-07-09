import { useExampleModel } from "./model";

/**
 * 示例页面
 *
 * 这是 `src/pages/example/` 的示例页面，展示了如何消费同模块的 model。
 * 新建项目时可直接删除 `src/pages/example/` 目录。
 */
export default function ExamplePage() {
  const { count, increment } = useExampleModel();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">欢迎来到 template-vite-server！</h1>
      <p className="mb-2">这是一个基于 React 和 Tailwind CSS 构建的模板项目。</p>
      <p className="mb-2">你可以从这里开始构建真实业务功能。</p>
      <p className="mb-4">当前计数：{count}</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={increment}
      >
        点击我
      </button>
    </div>
  );
}
