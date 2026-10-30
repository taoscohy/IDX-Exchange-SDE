import { fetchProperties } from "./client";

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test("returns successful unfiltered listings", async () => {
  const data = { total: 1, limit: 20, offset: 0, results: [{ L_ListingID: "test-1" }] };
  fetch.mockResolvedValue({ ok: true, json: async () => data });
  await expect(fetchProperties()).resolves.toEqual(data);
  expect(fetch).toHaveBeenCalledWith("/api/properties", expect.any(Object));
});

test("sends all six filters together and omits empty values", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ total: 0, results: [] }) });
  const filters = { city: "San Jose", zipcode: "01234", minPrice: "0", maxPrice: "900000", beds: "3", baths: "2.5" };
  await fetchProperties(filters);
  const query = new URLSearchParams(fetch.mock.calls[0][0].split("?")[1]);
  expect(Object.fromEntries(query)).toEqual(filters);
  await fetchProperties({ city: "", zipcode: undefined, minPrice: null, maxPrice: "", beds: "", baths: "" });
  expect(fetch).toHaveBeenLastCalledWith("/api/properties", expect.any(Object));
});

test("reports API filter validation errors", async () => {
  fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "minPrice cannot be greater than maxPrice" }) });
  await expect(fetchProperties({ minPrice: "900000", maxPrice: "100000" }))
    .rejects.toThrow("Unable to load listings (HTTP 400). minPrice cannot be greater than maxPrice");
});

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
