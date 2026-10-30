import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ListingsPage from "./ListingsPage";
import PropertyCard from "../components/PropertyCard";
import { fetchProperties } from "../api/client";

jest.mock("../api/client");

beforeEach(() => {
  fetchProperties.mockReset();
});

// Test data only. The application still fetches properties from the API.
const property = {
  L_ListingID: "test-1", L_Address: "123 Test Street", L_City: "Test City", L_State: "CA",
  L_SystemPrice: "1250000", L_Keyword2: 3, LM_Dec_3: "2.5", LM_Int2_3: 2345,
  L_Photos: '["https://example.com/home.jpg"]'
};

test("shows loading, then listings and the total without refetching on render", async () => {
  let resolveRequest;
  fetchProperties.mockReturnValue(new Promise(resolve => { resolveRequest = resolve; }));
  const { rerender } = render(<ListingsPage />);

  expect(screen.getByText(/Loading properties/)).toBeTruthy();
  await act(async () => resolveRequest({ total: 55212, results: [property] }));

  expect(screen.getByText("Showing 1 of 55,212 properties")).toBeTruthy();
  expect(screen.getByText("$1,250,000")).toBeTruthy();
  expect(screen.getByText("Test City, CA")).toBeTruthy();
  expect(screen.getByText("2,345")).toBeTruthy();
  expect(screen.getByText("2.5")).toBeTruthy();
  rerender(<ListingsPage />);
  expect(fetchProperties).toHaveBeenCalledTimes(1);
});

test("shows an empty state", async () => {
  fetchProperties.mockResolvedValue({ total: 0, results: [] });
  render(<ListingsPage />);

  expect(await screen.findByText("No properties found")).toBeTruthy();
  expect(screen.getByText("Showing 0 of 0 properties")).toBeTruthy();
});

test("shows an error and supports retry", async () => {
  fetchProperties.mockRejectedValueOnce(new Error("Backend unavailable"))
    .mockResolvedValueOnce({ total: 0, results: [] });
  render(<ListingsPage />);

  expect((await screen.findByRole("alert")).textContent).toContain("Backend unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No properties found")).toBeTruthy();
});

test("aborts the request on unmount", async () => {
  let resolveRequest;
  fetchProperties.mockReturnValue(new Promise(resolve => { resolveRequest = resolve; }));
  const { unmount } = render(<ListingsPage />);

  const signal = fetchProperties.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => resolveRequest({ total: 0, results: [] }));
  expect(screen.queryByText("No properties found")).toBeNull();
});

test("searches with combined filters and clearing reloads the unfiltered list", async () => {
  fetchProperties.mockResolvedValueOnce({ total: 1, results: [property] })
    .mockResolvedValueOnce({ total: 0, results: [] })
    .mockResolvedValueOnce({ total: 1, results: [property] });
  render(<ListingsPage />);

  expect(await screen.findByText(property.L_Address)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Oakland" } });
  fireEvent.change(screen.getByLabelText("Beds"), { target: { value: "3" } });
  expect(fetchProperties).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Search" }));

  await waitFor(() => {
    expect(fetchProperties).toHaveBeenLastCalledWith({ city: "Oakland", beds: "3" }, expect.any(Object));
  });
  expect(await screen.findByText(/Try changing or clearing the filters/)).toBeTruthy();
  expect(screen.queryByText(property.L_Address)).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  await waitFor(() => expect(fetchProperties).toHaveBeenLastCalledWith({}, expect.any(Object)));
  expect(await screen.findByText(property.L_Address)).toBeTruthy();
  const fields = ["City", "ZIP code", "Minimum price", "Maximum price", "Beds", "Baths"];
  expect(fields.every(label => screen.getByLabelText(label).value === "")).toBe(true);
});

test.each([false, true])("ignores stale search and clear responses (latest resolves first: %p)", async latestFirst => {
  const requests = [];
  fetchProperties.mockImplementation(() => new Promise(resolve => { requests.push(resolve); }));
  render(<ListingsPage />);

  await act(async () => requests[0]({ total: 1, results: [property] }));
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "San Jose" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(screen.queryByText(property.L_Address)).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Oakland" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));

  expect(fetchProperties.mock.calls.map(([params]) => params)).toEqual([
    {}, { city: "San Jose" }, {}, { city: "Oakland" }
  ]);
  expect(fetchProperties.mock.calls[1][1].signal.aborted).toBe(true);
  expect(fetchProperties.mock.calls[2][1].signal.aborted).toBe(true);
  expect(fetchProperties.mock.calls[3][1].signal.aborted).toBe(false);

  const latest = { total: 1, results: [{ ...property, L_Address: "Latest search result" }] };
  if (latestFirst) await act(async () => requests[3](latest));
  for (const index of [1, 2]) {
    await act(async () => requests[index]({ total: 1, results: [property] }));
    expect(screen.queryByText(property.L_Address)).toBeNull();
    expect(screen.getByText(latestFirst ? "Latest search result" : /Loading properties/)).toBeTruthy();
  }
  if (!latestFirst) await act(async () => requests[3](latest));
  expect(screen.getByText("Latest search result")).toBeTruthy();
  expect(screen.queryByText(/Loading properties/)).toBeNull();
});

test("ignores a late request error and retries the current filters", async () => {
  let rejectOldRequest;
  fetchProperties.mockReturnValueOnce(new Promise((resolve, reject) => { rejectOldRequest = reject; }))
    .mockRejectedValueOnce(new Error("Current search failed"))
    .mockResolvedValueOnce({ total: 1, results: [property] });
  render(<ListingsPage />);

  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Oakland" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Current search failed");

  await act(async () => rejectOldRequest(new Error("Old request failed")));
  expect(screen.getByRole("alert").textContent).not.toContain("Old request failed");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(fetchProperties).toHaveBeenLastCalledWith({ city: "Oakland" }, expect.any(Object)));
  expect(await screen.findByText(property.L_Address)).toBeTruthy();
});

test("replaces broken images and handles a different photo on rerender", () => {
  const { rerender } = render(<PropertyCard property={property} />);
  const photo = screen.getByRole("img", { name: "Property at 123 Test Street" });
  expect(photo.getAttribute("src")).toBe("https://example.com/home.jpg");
  fireEvent.error(photo);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("Photo unavailable")).toBeTruthy();

  rerender(<PropertyCard property={{ ...property, L_Photos: ["https://example.com/new.jpg"] }} />);
  expect(screen.getByRole("img").getAttribute("src")).toContain("new.jpg");
});

test("missing fields do not become misleading zeroes", () => {
  render(<PropertyCard property={{ L_Photos: "malformed" }} />);

  expect(screen.getByText("Price unavailable")).toBeTruthy();
  expect(screen.getByText("Address unavailable")).toBeTruthy();
  expect(screen.getByText("Location unavailable")).toBeTruthy();
  expect(screen.getAllByText("—")).toHaveLength(3);
});
