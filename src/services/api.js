
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Set JSON content type only for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
        data?.message || data?.error || "Something went wrong"
    );
  }

  return data;
}
