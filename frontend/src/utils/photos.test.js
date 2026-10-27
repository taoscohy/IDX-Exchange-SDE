import { firstPhotoUrl } from "./photos";

test.each([null, undefined, "", "[]", [], "not json", "{}", {}, "null", 12])(
  "missing or malformed photos return a placeholder (%p)", photos => {
    expect(firstPhotoUrl(photos)).toBeNull();
  }
);

test("accepts JSON and MySQL2 arrays, skipping invalid entries", () => {
  const photos = [null, {}, "", "broken", "javascript:alert(1)", " https://example.com/home.jpg ", "https://example.com/second.jpg"];
  expect(firstPhotoUrl(photos)).toBe("https://example.com/home.jpg");
  expect(firstPhotoUrl(JSON.stringify(photos))).toBe("https://example.com/home.jpg");
});
