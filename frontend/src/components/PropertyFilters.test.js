import { fireEvent, render, screen } from "@testing-library/react";
import PropertyFilters from "./PropertyFilters";

let onSearch;

beforeEach(() => {
  onSearch = jest.fn();
  render(<PropertyFilters onSearch={onSearch} />);
});

function changeFilter(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

test("renders six labeled inputs with beds and baths dropdowns", () => {
  const fields = ["City", "ZIP code", "Minimum price", "Maximum price", "Beds", "Baths"];
  const inputs = fields.map(label => screen.getByLabelText(label));

  expect(inputs.map(input => input.name)).toEqual([
    "city", "zipcode", "minPrice", "maxPrice", "beds", "baths"
  ]);
  expect(screen.getByRole("combobox", { name: "Beds" }).name).toBe("beds");
  expect(screen.getByRole("combobox", { name: "Baths" }).name).toBe("baths");
  expect(inputs.every(input => input.value === "")).toBe(true);
});

test("submits combined filters only when Search is submitted", () => {
  const filters = { city: "San Jose", zipcode: "95112", minPrice: "0", maxPrice: "900000", beds: "3", baths: "2.5" };
  const labels = { city: "City", zipcode: "ZIP code", minPrice: "Minimum price", maxPrice: "Maximum price", beds: "Beds", baths: "Baths" };

  for (const [name, value] of Object.entries(filters)) changeFilter(labels[name], value);
  expect(onSearch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Search" }));

  expect(onSearch).toHaveBeenCalledTimes(1);
  expect(onSearch).toHaveBeenCalledWith(filters);
});

test("trims text and excludes empty filters from submission", () => {
  changeFilter("City", " San Jose ");
  changeFilter("ZIP code", "   ");
  fireEvent.click(screen.getByRole("button", { name: "Search" }));

  expect(onSearch).toHaveBeenCalledWith({ city: "San Jose" });
});

test("Clear Filters resets every input and requests unfiltered results", () => {
  changeFilter("City", "San Jose");
  changeFilter("ZIP code", "95112");
  changeFilter("Minimum price", "100000");
  changeFilter("Maximum price", "900000");
  changeFilter("Beds", "3");
  changeFilter("Baths", "2");

  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  const fields = ["City", "ZIP code", "Minimum price", "Maximum price", "Beds", "Baths"];
  expect(fields.every(label => screen.getByLabelText(label).value === "")).toBe(true);
  expect(onSearch).toHaveBeenCalledTimes(1);
  expect(onSearch).toHaveBeenCalledWith({});

  changeFilter("City", "Oakland");
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(onSearch).toHaveBeenLastCalledWith({ city: "Oakland" });
});
