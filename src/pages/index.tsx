import { RuntimeProvider } from "./RuntimeProvider";
import { Thread } from "@assistant-ui/react-ui";

/**
 * 首页占位
 */
export default function HomePage() {
  return (
    <div className="h-screen w-full flex flex-col">
      <RuntimeProvider>
        <Thread />
      </RuntimeProvider>
    </div>
  );
}
