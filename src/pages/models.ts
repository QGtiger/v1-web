import axios from "axios";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { OPENCODE_BASE_URL, SERVER_BASE_URL } from "./constant";

export const opencodeClient = createOpencodeClient({
  baseUrl: OPENCODE_BASE_URL,
});

export const serverApi = axios.create({ baseURL: SERVER_BASE_URL });
