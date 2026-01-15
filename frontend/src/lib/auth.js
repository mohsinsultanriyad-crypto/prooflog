import { auth } from "../firebase";

const ADMIN_TOKEN_KEY = "prooflog_admin_token";

export async function getWorkerToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  return await user.getIdToken();
}

export function setAdminToken(t) {
  localStorage.setItem(ADMIN_TOKEN_KEY, t);
}
export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}
export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
