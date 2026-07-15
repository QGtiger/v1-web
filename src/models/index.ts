import axios from "axios";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { useOpenCodeThreadState } from "@assistant-ui/react-opencode";
import { OPENCODE_BASE_URL, SERVER_BASE_URL } from "@/pages/constant";

export const opencodeClient = createOpencodeClient({
  baseUrl: OPENCODE_BASE_URL,
});

export const serverApi = axios.create({ baseURL: SERVER_BASE_URL });

export function useIsThreadLoading() {
  const loadState = useOpenCodeThreadState((s) => s.loadState);
  return loadState.type === "idle" || loadState.type === "loading";
}
