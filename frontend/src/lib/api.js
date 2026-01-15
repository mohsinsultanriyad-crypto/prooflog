import axios from "axios";
import { getWorkerToken, getAdminToken } from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE
});

export async function workerApi(config) {
  const token = await getWorkerToken();
  return api.request({
    ...config,
    headers: { ...(config.headers || {}), Authorization: `Bearer ${token}` }
  });
}

export async function adminApi(config) {
  const token = getAdminToken();
  return api.request({
    ...config,
    headers: { ...(config.headers || {}), Authorization: `Bearer ${token}` }
  });
}
