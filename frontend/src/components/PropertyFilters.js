import { useState } from "react";

const emptyFilters = { city: "", zipcode: "", minPrice: "", maxPrice: "", beds: "", baths: "" };

export default function PropertyFilters({ onSearch }) {
  const [filters, setFilters] = useState(emptyFilters);

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const params = {};
    for (const [name, value] of Object.entries(filters)) {
      if (value.trim() !== "") params[name] = value.trim();
    }
    onSearch(params);
  }

  function handleClear() {
    setFilters(emptyFilters);
    onSearch({});
  }

  return (
    <form className="property-filters" aria-label="Property filters" onSubmit={handleSubmit}>
      <label>
        City
        <input name="city" value={filters.city} onChange={handleChange} maxLength={100} />
      </label>
      <label>
        ZIP code
        <input name="zipcode" value={filters.zipcode} onChange={handleChange} inputMode="numeric" />
      </label>
      <label>
        Minimum price
        <input type="number" name="minPrice" min="0" step="any" value={filters.minPrice} onChange={handleChange} />
      </label>
      <label>
        Maximum price
        <input type="number" name="maxPrice" min="0" step="any" value={filters.maxPrice} onChange={handleChange} />
      </label>
      <label>
        Beds
        <select name="beds" value={filters.beds} onChange={handleChange}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}+</option>)}
        </select>
      </label>
      <label>
        Baths
        <select name="baths" value={filters.baths} onChange={handleChange}>
          <option value="">Any</option>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5].map(value => <option key={value} value={value}>{value}+</option>)}
        </select>
      </label>
      <div className="filter-actions">
        <button type="submit">Search</button>
        <button type="button" onClick={handleClear}>Clear Filters</button>
      </div>
    </form>
  );
}
