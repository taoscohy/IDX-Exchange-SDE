import { jest, test, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";

const execute = jest.fn();
jest.unstable_mockModule("../db.js", () => ({ default: { execute } }));
const { default: app } = await import("../app.js");
let log;
beforeEach(() => {
  execute.mockReset();
  log = jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

const property = { L_ListingID: "00AB-12", L_Address: "123 Test St", L_Remarks: "Full details" };

test("detail returns the complete row and preserves a string ID", async () => {
  execute.mockResolvedValueOnce([[property]]);
  const response = await request(app).get("/api/properties/00AB-12");
  expect(response.status).toBe(200);
  expect(response.body).toEqual(property);
  expect(execute).toHaveBeenCalledWith(
    "SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1", ["00AB-12"]
  );
});

for (const suffix of ["", "/openhouses"]) {
  test.each([" ", "bad id", "abc/def", "x' OR 1=1", "x".repeat(256), "\u0000"])(
    `invalid ID returns 400 before querying (${suffix}): %s`, async (id) => {
      const response = await request(app).get(`/api/properties/${encodeURIComponent(id)}${suffix}`);
      expect(response.status).toBe(400);
      expect(execute).not.toHaveBeenCalled();
    }
  );
  test(`255-character ID is accepted (${suffix})`, async () => {
    execute.mockResolvedValueOnce([[]]);
    expect((await request(app).get(`/api/properties/${"a".repeat(255)}${suffix}`)).status).toBe(404);
    expect(execute).toHaveBeenCalled();
  });
  test(`unknown property returns 404 (${suffix})`, async () => {
    execute.mockResolvedValueOnce([[]]);
    const response = await request(app).get(`/api/properties/unknown${suffix}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Property not found" });
    expect(execute).toHaveBeenCalledTimes(1);
  });
  test(`database rejection returns safe JSON (${suffix})`, async () => {
    execute.mockRejectedValueOnce(new Error("private database details"));
    const response = await request(app).get(`/api/properties/123${suffix}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
}

test("open houses use date, start time, and a stable tie breaker", async () => {
  const events = [{ id: 1, OpenHouseDate: "2026-10-22", OH_StartTime: "10:00:00" }];
  execute.mockResolvedValueOnce([[property]]).mockResolvedValueOnce([events]);
  const response = await request(app).get("/api/properties/00AB-12/openhouses");
  expect(response.status).toBe(200);
  expect(response.body).toEqual(events);
  expect(execute).toHaveBeenLastCalledWith(
    expect.stringContaining("ORDER BY OpenHouseDate ASC, OH_StartTime ASC, id ASC"), ["00AB-12"]
  );
});

test("existing property without events returns an empty array", async () => {
  execute.mockResolvedValueOnce([[property]]).mockResolvedValueOnce([[]]);
  const response = await request(app).get("/api/properties/00AB-12/openhouses");
  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
});

test("failure fetching events is handled after the property lookup", async () => {
  execute.mockResolvedValueOnce([[property]]).mockRejectedValueOnce(new Error("database unavailable"));
  const response = await request(app).get("/api/properties/00AB-12/openhouses");
  expect(response.status).toBe(500);
  expect(response.body).toEqual({ error: "Internal server error" });
});

test.each(["/api/properties/bad%20id", "/api/properties/%ZZ"])("logs malformed requests: %s", async (url) => {
  const response = await request(app).get(url);
  expect(response.status).toBe(400);
  const entry = JSON.parse(log.mock.calls[0][0]);
  expect(entry).toMatchObject({ method: "GET", url, status: 400 });
  expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  expect(entry.durationMs).toBeGreaterThanOrEqual(0);
});

test("search pagination and routing remain intact", async () => {
  execute.mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[property]]);
  const response = await request(app).get("/api/properties?limit=1&offset=2");
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ total: 1, limit: 1, offset: 2, results: [property] });
});

test.each(["limit=0", "limit=101", "offset=-1", "beds=1.5", "minPrice=20&maxPrice=10"])(
  "search validation remains intact: %s", async (query) => {
    expect((await request(app).get(`/api/properties?${query}`)).status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  }
);

test("search database failures remain handled", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  execute.mockRejectedValueOnce(new Error("database unavailable"));
  const response = await request(app).get("/api/properties");
  expect(response.status).toBe(500);
  expect(response.body).toEqual({ error: "Failed to retrieve properties" });
});
