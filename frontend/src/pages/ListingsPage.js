import { useEffect, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";

export default function ListingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchProperties({}, { signal: controller.signal })
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
  }, [attempt]);

  return (
    <main id="main" className="listings-page">
      <section aria-label="Property listings" aria-busy={loading}>
        {loading ? (
          <div className="status-panel" role="status"><span className="spinner" aria-hidden="true" />Loading properties…</div>
        ) : error ? (
          <div className="status-panel error-panel" role="alert">
            <h2>We couldn’t load the properties</h2>
            <p>{error}</p>
            <button onClick={() => setAttempt(value => value + 1)}>Try again</button>
          </div>
        ) : (
          <>
            <div className="results-heading">
              <h2>Explore properties</h2>
              <p role="status">Showing {data.results.length.toLocaleString("en-US")} of {data.total.toLocaleString("en-US")} properties</p>
            </div>
            {data.results.length === 0 ? (
              <div className="status-panel"><h2>No properties found</h2><p>There are no listings to display right now. Please check back later.</p></div>
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
