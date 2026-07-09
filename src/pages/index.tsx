import { RuntimeProvider } from "./RuntimeProvider";
import { Thread, ThreadList } from "@assistant-ui/react-ui";

/**
 * 首页占位
 */
export default function HomePage() {
  return (
    <RuntimeProvider>
      <div className="h-screen w-full flex">
        <ThreadList />
        <Thread />
      </div>
    </RuntimeProvider>
  );
}
