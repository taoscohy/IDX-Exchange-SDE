export async function fetchProperties(params = {}, { signal } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  const data = await fetchJSON(`/api/properties${queryString ? `?${queryString}` : ""}`, "listings", signal);
  if (!data || !Array.isArray(data.results) ||
      !Number.isSafeInteger(data.total) || data.total < 0 ||
      !data.results.every(property => property && typeof property === "object" && !Array.isArray(property))) {
    throw new Error("The listings service returned an unexpected response. Please try again.");
  }
  return data;
}

async function fetchJSON(url, resource, signal) {
  let response;
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" }
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(`Unable to reach the ${resource} service. Check your connection and make sure the backend is running on port 5000.`);
  }

  if (!response.ok) {
    let detail;
    try {
      const body = await response.json();
      if (typeof body.error === "string") detail = body.error;
    } catch {
      // A development proxy may return plain text when Express is offline.
    }
    throw new Error(`Unable to load ${resource} (HTTP ${response.status}). ${detail || "Make sure the backend is running on port 5000 and try again."}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`The ${resource} service returned invalid JSON. Please try again.`);
  }
  return data;
}

export async function fetchProperty(id, { signal } = {}) {
  const data = await fetchJSON(`/api/properties/${encodeURIComponent(id)}`, "property", signal);
  if (!data || typeof data !== "object" || Array.isArray(data) || !data.L_ListingID) {
    throw new Error("The property service returned an unexpected response. Please try again.");
  }
  return data;
}

export async function fetchOpenHouses(id, { signal } = {}) {
  const data = await fetchJSON(`/api/properties/${encodeURIComponent(id)}/openhouses`, "open houses", signal);
  if (!Array.isArray(data) || !data.every(event => event && typeof event === "object" && !Array.isArray(event))) {
    throw new Error("The open house service returned an unexpected response. Please try again.");
  }
  return data;
}
