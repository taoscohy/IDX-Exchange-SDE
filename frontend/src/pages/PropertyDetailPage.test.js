import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import PropertyImageGallery from "../components/PropertyImageGallery";
import PropertyImageCarousel from "../components/PropertyImageCarousel";
import PropertyMap from "../components/PropertyMap";
import { fetchOpenHouses, fetchProperties, fetchProperty } from "../api/client";

jest.mock("../api/client");

const photos = JSON.stringify(["https://example.com/one.jpg", "https://example.com/two.jpg"]);
const property = {
  L_ListingID: "00AB-12", L_Address: "123 Test Street", L_City: "Oakland", L_State: "CA", L_Zip: "94601",
  L_SystemPrice: 900000, L_Keyword2: 3, LM_Dec_3: 2.5, LM_Int2_3: 1800, YearBuilt: 1998,
  L_Remarks: "A sunny home.", L_Type_: "SingleFamilyResidence", L_Status: "Active", L_Photos: photos,
  LMD_MP_Latitude: "37.8", LMD_MP_Longitude: "-122.2"
};

beforeEach(() => {
  jest.resetAllMocks();
  window.history.replaceState({}, "", "/");
  fetchProperties.mockResolvedValue({ total: 1, results: [property] });
  fetchProperty.mockResolvedValue(property);
  fetchOpenHouses.mockResolvedValue([]);
});

test("card carousel wraps without navigating; card opens details and back returns to listings", async () => {
  render(<App />);
  await screen.findByText(property.L_Address);
  fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
  expect(window.location.pathname).toBe("/");
  fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
  expect(screen.getByText("1 / 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("img"));
  expect(window.location.pathname).toBe("/property/00AB-12");
  expect(await screen.findByText("A sunny home.")).toBeTruthy();
  for (const text of ["$900,000", "Oakland, CA, 94601", "1,800", "1998", "SingleFamilyResidence", "Active", "No open houses scheduled"]) {
    expect(screen.getByText(text)).toBeTruthy();
  }
  fireEvent.click(screen.getByRole("button", { name: /Back to listings/ }));
  expect(await screen.findByText("Explore properties")).toBeTruthy();
  expect(window.location.pathname).toBe("/");
});

test.each([["0.1234", "0.1234"], [1.5, "1.5"], [null, "—"]])(
  "lot size uses LotSizeAcres with acre units (%p)", async (acres, expected) => {
    window.history.replaceState({}, "", "/property/00AB-12");
    fetchProperty.mockResolvedValue({ ...property, LotSizeAcres: acres, LotSizeSquareFeet: 43560 });
    render(<App />);
    const label = await screen.findByText("Lot size (acres)");
    expect(within(label.parentElement).getByRole("definition").textContent).toBe(expected);
    expect(screen.queryByText("Lot size (sq ft)")).toBeNull();
  }
);

test("main gallery arrows wrap and synchronize thumbnails without opening the lightbox", () => {
  render(<PropertyImageGallery photos={photos} address="Test Street" />);
  const opener = screen.getByRole("button", { name: "Open photo lightbox" });
  const next = screen.getByRole("button", { name: "Next photo" });
  const previous = screen.getByRole("button", { name: "Previous photo" });
  fireEvent.click(next);
  expect(within(opener).getByRole("img").src).toContain("two.jpg");
  expect(screen.getByRole("button", { name: "View photo 2" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "View photo 1" }).getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(next);
  expect(within(opener).getByRole("img").src).toContain("one.jpg");
  fireEvent.click(previous);
  expect(within(opener).getByRole("img").src).toContain("two.jpg");
  fireEvent.click(screen.getByRole("button", { name: "View photo 1" }));
  fireEvent.click(next);
  expect(within(opener).getByRole("img").src).toContain("two.jpg");
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(opener);
  expect(within(screen.getByRole("dialog")).getByRole("img").src).toContain("two.jpg");
});

test("gallery selects thumbnails, focuses the lightbox, navigates, and closes with Escape or backdrop", () => {
  render(<PropertyImageGallery photos={photos} address="Test Street" />);
  fireEvent.click(screen.getByRole("button", { name: "View photo 2" }));
  const opener = screen.getByRole("button", { name: "Open photo lightbox" });
  expect(within(opener).getByRole("img").src).toContain("two.jpg");
  fireEvent.click(opener);
  const dialog = screen.getByRole("dialog");
  expect(document.activeElement).toBe(dialog);
  fireEvent.keyDown(document.activeElement, { key: "ArrowRight" });
  expect(within(dialog).getByText("1 / 2")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Previous photo" }));
  expect(within(dialog).getByText("2 / 2")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Next photo" }));
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(within(dialog).getByText("2 / 2")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("img"));
  expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.keyDown(dialog, { key: "Tab" });
  expect(dialog.contains(document.activeElement)).toBe(true);
  fireEvent.keyDown(document.activeElement, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(opener);
  fireEvent.click(opener);
  fireEvent.click(screen.getByRole("dialog"));
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("single-photo carousel and gallery work without navigation arrows", () => {
  const single = '["https://example.com/one.jpg"]';
  render(<><PropertyImageCarousel photos={single} address="Test" /><PropertyImageGallery photos={single} address="Test" /></>);
  expect(screen.getByText("1 / 1")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "View photo 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Open photo lightbox" }));
  expect(within(screen.getByRole("dialog")).getByText("1 / 1")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Next photo" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Previous photo" })).toBeNull();
  fireEvent.keyDown(document.activeElement, { key: "ArrowRight" });
  expect(within(screen.getByRole("dialog")).getByRole("img").src).toContain("one.jpg");
  fireEvent.keyDown(document.activeElement, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("malformed photos show placeholders in both components", () => {
  render(<><PropertyImageCarousel photos="bad json" /><PropertyImageGallery photos="null" /></>);
  expect(screen.getAllByText("Photo unavailable")).toHaveLength(2);
  expect(screen.queryByRole("button")).toBeNull();
});

test("map uses both coordinates, validates ranges, and offers directions even without an API key", () => {
  const oldKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY = "test-key";
  try {
    const { rerender } = render(<PropertyMap latitude="37.8" longitude="-122.2" />);
    const url = new URL(screen.getByTitle("Property location").src);
    expect(url.pathname).toBe("/maps/embed/v1/place");
    expect(url.searchParams.get("q")).toBe("37.8,-122.2");
    expect(url.searchParams.get("zoom")).toBe("15");
    const directions = screen.getByRole("link", { name: "Get Directions" });
    expect(directions.target).toBe("_blank");
    expect(new URL(directions.href).searchParams.get("destination")).toBe("37.8,-122.2");
    for (const [latitude, longitude] of [
      [null, 1], [1, undefined], ["", 1], ["bad", 1], [91, 1], [1, -181],
      [0, 0], [0, -122.2], [37.8, 0], ["0.000000000000000", "-122.2"], ["37.8", "0.000000000000000"]
    ]) {
      rerender(<PropertyMap latitude={latitude} longitude={longitude} />);
      expect(screen.queryByTitle("Property location")).toBeNull();
      expect(screen.queryByRole("link", { name: "Get Directions" })).toBeNull();
    }
    delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    rerender(<PropertyMap latitude="37.8" longitude="-122.2" />);
    expect(screen.queryByTitle("Property location")).toBeNull();
    expect(screen.getByRole("link", { name: "Get Directions" })).toBeTruthy();
  } finally {
    if (oldKey === undefined) delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    else process.env.REACT_APP_GOOGLE_MAPS_API_KEY = oldKey;
  }
});

test.each(['{"OpenHouseRemarks":"Come visit!"}', { OpenHouseRemarks: "Come visit!" }, "invalid json"])(
  "open houses format date and times and safely read remarks (%p)", async all_data => {
    window.history.replaceState({}, "", "/property/00AB-12");
    fetchOpenHouses.mockResolvedValue([{ id: 1, OpenHouseDate: "2026-09-20T07:00:00.000Z", OH_StartTime: "13:00:00", OH_EndTime: "16:00:00", all_data }]);
    render(<App />);
    expect(await screen.findByText("Sunday, September 20, 2026")).toBeTruthy();
    expect(screen.getByText("1:00 PM – 4:00 PM")).toBeTruthy();
    expect(Boolean(screen.queryByText("Come visit!"))).toBe(all_data !== "invalid json");
  }
);

test("invalid listing URL displays an error with a working way back", async () => {
  window.history.replaceState({}, "", "/property/invalid-id");
  fetchProperty.mockRejectedValue(new Error("Property not found"));
  fetchOpenHouses.mockRejectedValue(new Error("Property not found"));
  render(<App />);
  expect((await screen.findByRole("alert")).textContent).toContain("Property not found");
  fireEvent.click(screen.getByRole("button", { name: /Back to listings/ }));
  expect(await screen.findByText("Explore properties")).toBeTruthy();
});

test("an open-house failure keeps property details visible and is not shown as no events", async () => {
  window.history.replaceState({}, "", "/property/00AB-12");
  fetchOpenHouses.mockRejectedValue(new Error("Open house service unavailable"));
  render(<App />);
  expect(await screen.findByText("A sunny home.")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("Open house service unavailable");
  expect(screen.queryByText("No open houses scheduled")).toBeNull();
});
