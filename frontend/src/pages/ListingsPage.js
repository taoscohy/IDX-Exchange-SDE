import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";

export default function ListingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const activeRequest = useRef(null);

  function handleSearch(params) {
    // Cancel immediately so an older response cannot update the next search.
    activeRequest.current?.abort();
    setLoading(true);
    setError("");
    setFilters({ ...params });
  }

  useEffect(() => {
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    fetchProperties(filters, { signal: controller.signal })
      .then(result => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(error => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  return (
    <main id="main" className="listings-page">
      <PropertyFilters onSearch={handleSearch} />
      <section aria-label="Property listings" aria-busy={loading}>
        {loading ? (
          <div className="status-panel" role="status"><span className="spinner" aria-hidden="true" />Loading properties…</div>
        ) : error ? (
          <div className="status-panel error-panel" role="alert">
            <h2>We couldn’t load the properties</h2>
            <p>{error}</p>
            <button onClick={() => handleSearch(filters)}>Try again</button>
          </div>
        ) : (
          <>
            <div className="results-heading">
              <h2>Explore properties</h2>
              <p role="status">Showing {data.results.length.toLocaleString("en-US")} of {data.total.toLocaleString("en-US")} properties</p>
            </div>
            {data.results.length === 0 ? (
              <div className="status-panel"><h2>No properties found</h2><p>No properties match your search. Try changing or clearing the filters.</p></div>
            ) : (
              <div className="property-grid">
                {data.results.map(property => <PropertyCard key={property.L_ListingID} property={property} />)}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
