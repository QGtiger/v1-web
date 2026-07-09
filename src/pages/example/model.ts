import { createCustomModel } from "@lightfish/react-model";
import { useState } from "react";

/**
 * 示例模型
 *
 * 仅用于演示 `src/pages/example/` 路由模块内的局部状态管理。
 * 这是示例代码，新建项目时可以直接删除或替换为真实业务模型。
 */
function useExample() {
  const [count, setCount] = useState(0);

  return {
    count,
    increment: () => setCount((c) => c + 1),
  };
}

export const { Provider: ExampleProvider, useModel: useExampleModel } =
  createCustomModel(useExample);
