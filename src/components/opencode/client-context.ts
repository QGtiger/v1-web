import type { OpencodeClient } from "@assistant-ui/react-opencode";
import { createContext, useContext } from "react";

export const OpenCodeClientContext = createContext<OpencodeClient | null>(null);

export function useOpenCodeClient(): OpencodeClient {
  const client = useContext(OpenCodeClientContext);
  if (!client)
    throw new Error("useOpenCodeClient must be used within RuntimeProvider");
  return client;
}
