export async function fetchProperties(params = {}, { signal } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  let response;
  try {
    response = await fetch(`/api/properties${queryString ? `?${queryString}` : ""}`, {
      signal,
      headers: { Accept: "application/json" }
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to reach the listings service. Check your connection and make sure the backend is running on port 5000.");
  }

  if (!response.ok) {
    let detail;
    try {
      const body = await response.json();
      if (typeof body.error === "string") detail = body.error;
    } catch {
      // A development proxy may return plain text when Express is offline.
    }
    throw new Error(`Unable to load listings (HTTP ${response.status}). ${detail || "Make sure the backend is running on port 5000 and try again."}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The listings service returned invalid JSON. Please try again.");
  }
  if (!data || !Array.isArray(data.results) ||
      !Number.isSafeInteger(data.total) || data.total < 0 ||
      !data.results.every(property => property && typeof property === "object" && !Array.isArray(property))) {
    throw new Error("The listings service returned an unexpected response. Please try again.");
  }
  return data;
}
