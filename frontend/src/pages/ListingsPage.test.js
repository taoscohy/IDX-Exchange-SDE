import { act } from "react";
import { createRoot } from "react-dom/client";
import ListingsPage from "./ListingsPage";
import PropertyCard from "../components/PropertyCard";
import { fetchProperties } from "../api/client";

jest.mock("../api/client");
let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  fetchProperties.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

// Fixtures are used only in tests; the application always requests the real API.
const property = {
  L_ListingID: "test-1", L_Address: "123 Test Street", L_City: "Test City", L_State: "CA",
  L_SystemPrice: "1250000", L_Keyword2: 3, LM_Dec_3: "2.5", LM_Int2_3: 2345,
  L_Photos: '["https://example.com/home.jpg"]'
};

test("shows loading, then listings and the total without refetching on render", async () => {
  let resolve;
  fetchProperties.mockReturnValue(new Promise(done => { resolve = done; }));
  act(() => root.render(<ListingsPage />));
  expect(container.textContent).toContain("Loading properties");
  await act(async () => resolve({ total: 55212, results: [property] }));
  expect(container.textContent).toContain("Showing 1 of 55,212 properties");
  expect(container.textContent).toContain("$1,250,000");
  expect(container.textContent).toContain("Test City, CA");
  expect(container.textContent).toContain("2,345");
  expect(container.textContent).toContain("2.5");
  act(() => root.render(<ListingsPage />));
  expect(fetchProperties).toHaveBeenCalledTimes(1);
});

test("shows an empty state", async () => {
  fetchProperties.mockResolvedValue({ total: 0, results: [] });
  await act(async () => root.render(<ListingsPage />));
  expect(container.textContent).toContain("No properties found");
  expect(container.textContent).toContain("Showing 0 of 0 properties");
});

test("shows an error and supports retry", async () => {
  fetchProperties.mockRejectedValueOnce(new Error("Backend unavailable"))
    .mockResolvedValueOnce({ total: 0, results: [] });
  await act(async () => root.render(<ListingsPage />));
  expect(container.querySelector('[role="alert"]').textContent).toContain("Backend unavailable");
  await act(async () => container.querySelector("button").click());
  expect(container.textContent).toContain("No properties found");
});

test("aborts the request on unmount", async () => {
  let resolve;
  fetchProperties.mockReturnValue(new Promise(done => { resolve = done; }));
  act(() => root.render(<ListingsPage />));
  const signal = fetchProperties.mock.calls[0][1].signal;
  act(() => root.render(null));
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ total: 0, results: [] }));
  expect(container.textContent).toBe("");
});

test("replaces broken images and handles a different photo on rerender", () => {
  act(() => root.render(<PropertyCard property={property} />));
  expect(container.querySelector("img").getAttribute("src")).toBe("https://example.com/home.jpg");
  act(() => container.querySelector("img").dispatchEvent(new Event("error")));
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain("Photo unavailable");
  act(() => root.render(<PropertyCard property={{ ...property, L_Photos: ["https://example.com/new.jpg"] }} />));
  expect(container.querySelector("img").getAttribute("src")).toContain("new.jpg");
});

test("missing fields do not become misleading zeroes", () => {
  act(() => root.render(<PropertyCard property={{ L_Photos: "malformed" }} />));
  expect(container.textContent).toContain("Price unavailable");
  expect(container.textContent).toContain("Address unavailable");
  expect(container.textContent).toContain("Location unavailable");
  expect([...container.querySelectorAll("dd")].map(node => node.textContent)).toEqual(["—", "—", "—"]);
});
