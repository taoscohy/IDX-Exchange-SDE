import { fetchProperties } from "./client";

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test("encodes optional backend parameters and forwards cancellation", async () => {
  const data = { total: 0, limit: 20, offset: 0, results: [] };
  fetch.mockResolvedValue({ ok: true, json: async () => data });
  const signal = new AbortController().signal;
  await expect(fetchProperties({ city: "San Jose", minPrice: 0, beds: null }, { signal })).resolves.toEqual(data);
  expect(fetch).toHaveBeenCalledWith("/api/properties?city=San+Jose&minPrice=0", {
    signal, headers: { Accept: "application/json" }
  });
});

test("explains network failure", async () => {
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(fetchProperties()).rejects.toThrow("backend is running on port 5000");
});

test("preserves request cancellation", async () => {
  const error = new DOMException("Aborted", "AbortError");
  fetch.mockRejectedValue(error);
  await expect(fetchProperties()).rejects.toBe(error);
});

test.each([true, false])("handles HTTP failures with JSON or text (%p)", async json => {
  fetch.mockResolvedValue({ ok: false, status: 500, json: async () => {
    if (!json) throw new SyntaxError();
    return { error: "Database unavailable" };
  } });
  await expect(fetchProperties()).rejects.toThrow(json ? "Database unavailable" : "HTTP 500");
});

test.each([null, {}, { total: 2, results: [null] }, { total: -1, results: [] }])("rejects unexpected response %p", async data => {
  fetch.mockResolvedValue({ ok: true, json: async () => data });
  await expect(fetchProperties()).rejects.toThrow("unexpected response");
});

test("explains invalid JSON", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError(); } });
  await expect(fetchProperties()).rejects.toThrow("invalid JSON");
});
