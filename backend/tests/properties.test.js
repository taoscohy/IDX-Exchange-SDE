
import { jest, test, expect } from "@jest/globals";
import request from "supertest";

const mockExecute = jest.fn();

jest.unstable_mockModule("../db.js", () => ({
  default: { execute: mockExecute }
}));

const { default: app } = await import("../app.js");

test("price and bedroom filters work together", async () => {
  mockExecute
    .mockResolvedValueOnce([[{ total: 1 }]])
    .mockResolvedValueOnce([[{ L_ListingID: "123" }]]);

  const response = await request(app)
    .get("/api/properties")
    .query({ minPrice: 300000, beds: 3 });

  expect(response.status).toBe(200);
  expect(response.body.total).toBe(1);

  expect(mockExecute).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("L_SystemPrice >= ? AND L_Keyword2 >= ?"),
    [300000, 3]
  );

  expect(mockExecute).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("L_SystemPrice >= ? AND L_Keyword2 >= ?"),
    [300000, 3, 20, 0]
  );
});
