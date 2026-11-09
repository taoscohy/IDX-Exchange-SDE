import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "./Pagination";

test("disables Previous on the first page and enables Next", () => {
  const onPageChange = jest.fn();
  render(<Pagination currentPage={1} totalPages={24} onPageChange={onPageChange} />);

  expect(screen.getByRole("button", { name: "Previous" }).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Next" }).disabled).toBe(false);
  expect(screen.getByRole("button", { name: "Page 1" }).getAttribute("aria-current")).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).not.toHaveBeenCalled();
});

test("disables Next on the last page and enables Previous", () => {
  const onPageChange = jest.fn();
  render(<Pagination currentPage={24} totalPages={24} onPageChange={onPageChange} />);

  expect(screen.getByRole("button", { name: "Next" }).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Previous" }).disabled).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).not.toHaveBeenCalled();
});

test("clicking page numbers, Previous, and Next requests the selected page", () => {
  const onPageChange = jest.fn();
  render(<Pagination currentPage={5} totalPages={24} onPageChange={onPageChange} />);

  expect(screen.getByRole("button", { name: "Previous" }).disabled).toBe(false);
  expect(screen.getByRole("button", { name: "Next" }).disabled).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Page 24" }));
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange.mock.calls).toEqual([[24], [4], [6]]);
  expect(screen.getByRole("button", { name: "Page 5" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("button", { name: "Page 4" }).hasAttribute("aria-current")).toBe(false);
});

test.each([
  [1, ["1", "2", "3", "4", "...", "24"]],
  [5, ["1", "...", "4", "5", "6", "...", "24"]],
  [24, ["1", "...", "21", "22", "23", "24"]]
])("shows the correct page numbers and ellipsis on page %i", (currentPage, expected) => {
  render(<Pagination currentPage={currentPage} totalPages={24} onPageChange={jest.fn()} />);

  const controls = screen.getByRole("navigation", { name: "Pagination" }).children;
  expect(Array.from(controls, control => control.textContent)).toEqual(["Previous", ...expected, "Next"]);
});

test("shows every page without ellipsis for small page counts", () => {
  render(<Pagination currentPage={4} totalPages={7} onPageChange={jest.fn()} />);

  expect(screen.getAllByRole("button", { name: /^Page / }).map(button => button.textContent))
    .toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  expect(screen.queryByText("...")).toBeNull();
});

test.each([0, 1])("hides pagination when there are %i pages", totalPages => {
  render(<Pagination currentPage={1} totalPages={totalPages} onPageChange={jest.fn()} />);
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("debug challenge: never duplicates the last page when navigating near the end", () => {
  const { rerender } = render(<Pagination currentPage={22} totalPages={24} onPageChange={jest.fn()} />);

  for (const currentPage of [22, 23, 24]) {
    rerender(<Pagination currentPage={currentPage} totalPages={24} onPageChange={jest.fn()} />);
    const pages = screen.getAllByRole("button", { name: /^Page / }).map(button => button.textContent);
    expect(screen.getAllByRole("button", { name: "Page 24" })).toHaveLength(1);
    expect(pages).toEqual(["1", "21", "22", "23", "24"]);
    expect(new Set(pages).size).toBe(pages.length);
  }
});
