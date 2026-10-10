import { IS_DEMO } from './http';
import { demoBackend } from './demoBackend';
import { serverBackend } from './serverBackend';
import type { Backend } from './backend';

export { API_URL, IS_DEMO, ApiError, setAuthToken, setUnauthorizedHandler } from './http';
export type { Backend, LoginResult } from './backend';

/** Ekranlar faqat shu obyekt bilan ishlaydi: demo yoki haqiqiy server (EXPO_PUBLIC_API_URL) */
export const backend: Backend = IS_DEMO ? demoBackend : serverBackend;
