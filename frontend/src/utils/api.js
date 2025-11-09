export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const res = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    // token expired or unauthorized
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}
