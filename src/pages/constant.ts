import { getRouterAppConfig } from "@lightfish/server/api";

const appConfig = getRouterAppConfig() as any;

export const OPENCODE_BASE_URL =
  appConfig.OPENCODE_BASE_URL || "http://localhost:55001";
export const SERVER_BASE_URL =
  appConfig.SERVER_BASE_URL || "http://localhost:3060";
