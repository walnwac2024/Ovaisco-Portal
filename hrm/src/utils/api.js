// src/utils/api.js
import axios from "axios";

const isLocal = window.location.hostname === "localhost";
export const BASE_URL = isLocal
  ? "http://localhost:5000"
  : "https://api.propeople.cloud";

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true, // ✅ send session cookie always
});

// cache token in memory
let csrfToken = null;
// prevent multiple parallel token requests
let csrfPromise = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfPromise) {
    csrfPromise = api
      .get("/csrf") // ✅ /api/v1/csrf
      .then((res) => {
        csrfToken = res?.data?.csrfToken || null;
        csrfPromise = null;
        return csrfToken;
      })
      .catch((err) => {
        csrfPromise = null;
        throw err;
      });
  }

  return csrfPromise;
}

/**
 * ✅ Backward compatible function.
 * Your old code calls initCsrf() in App/AuthContext/Login.
 * Keep it exported so nothing breaks.
 */
export async function initCsrf() {
  try {
    await getCsrfToken();
    return csrfToken;
  } catch (e) {
    console.error("initCsrf failed", e);
    return null;
  }
}

// ✅ attach token on write requests
api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();
  const needsToken = ["post", "put", "patch", "delete"].includes(method);

  if (needsToken) {
    const token = csrfToken || (await getCsrfToken());
    if (token) {
      config.headers = config.headers || {};
      config.headers["x-csrf-token"] = token; // ✅ matches server allowedHeaders
    }
  }

  return config;
});

// ✅ if token becomes invalid, refresh once and retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "";

    const isCsrfError =
      error?.response?.status === 403 &&
      (String(message).toLowerCase().includes("csrf") || !error?.response?.data?.message); // Sometimes message might be missing or different

    if (isCsrfError && original && !original.__csrfRetry) {
      original.__csrfRetry = true;

      // clear & refetch token
      csrfToken = null;
      await getCsrfToken();

      original.headers = original.headers || {};
      original.headers["x-csrf-token"] = csrfToken;

      return api(original);
    }

    return Promise.reject(error);
  }
);

export default api;
