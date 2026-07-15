import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { OPENCODE_BASE_URL } from "./constant";

export const opencodeClient = createOpencodeClient({
  baseUrl: OPENCODE_BASE_URL,
});
