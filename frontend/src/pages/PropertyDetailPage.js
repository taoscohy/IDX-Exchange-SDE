import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchOpenHouses, fetchProperty } from "../api/client";
import PropertyImageGallery from "../components/PropertyImageGallery";
import PropertyMap from "../components/PropertyMap";
import { formatNumber, priceFormat } from "../utils/format";

const acreFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

function formatDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
}

function formatTime(value) {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return "Time unavailable";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function OpenHouse({ event }) {
  let data = event.all_data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }
  const remarks = typeof data?.OpenHouseRemarks === "string" ? data.OpenHouseRemarks.trim() : "";

  return (
    <li>
      <h3>{formatDate(event.OpenHouseDate)}</h3>
      <p>{formatTime(event.OH_StartTime)} – {formatTime(event.OH_EndTime)}</p>
      {remarks && <p className="property-description">{remarks}</p>}
    </li>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openHouses, setOpenHouses] = useState(null);
  const [openHouseError, setOpenHouseError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setError("");
    setOpenHouses(null);
    setOpenHouseError("");
    fetchProperty(id, { signal })
      .then(data => { if (!signal.aborted) setProperty(data); })
      .catch(error => { if (!signal.aborted) setError(error.message); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    fetchOpenHouses(id, { signal })
      .then(data => { if (!signal.aborted) setOpenHouses(data); })
      .catch(error => { if (!signal.aborted) setOpenHouseError(error.message); });
    return () => controller.abort();
  }, [id]);

  return (
    <main className="property-detail-page">
      <button className="back-button" onClick={() => navigate("/")}>← Back to listings</button>
      {loading ? <div className="status-panel" role="status">Loading property…</div> : error ? (
        <div className="status-panel error-panel" role="alert"><h1>Unable to load property</h1><p>{error}</p></div>
      ) : (
        <>
          <header className="property-detail-header">
            <p className="property-price">{Number(property.L_SystemPrice) > 0 ? formatNumber(property.L_SystemPrice, priceFormat) : "Price unavailable"}</p>
            <h1>{property.L_Address || "Address unavailable"}</h1>
            <p>{[property.L_City, property.L_State, property.L_Zip].filter(Boolean).join(", ")}</p>
            <dl className="property-facts detail-stats">
              <div><dt>Beds</dt><dd>{formatNumber(property.L_Keyword2) ?? "—"}</dd></div>
              <div><dt>Baths</dt><dd>{formatNumber(property.LM_Dec_3) ?? "—"}</dd></div>
              <div><dt>Sq ft</dt><dd>{formatNumber(property.LM_Int2_3) ?? "—"}</dd></div>
              <div><dt>Year built</dt><dd>{property.YearBuilt > 0 ? property.YearBuilt : "—"}</dd></div>
            </dl>
          </header>
          <PropertyImageGallery key={id} photos={property.L_Photos} address={property.L_Address || "Address unavailable"} />
          <section><h2>Description</h2><p className="property-description">{property.L_Remarks || "Description unavailable"}</p></section>
          <section>
            <h2>Property details</h2>
            <dl className="property-details">
              {[
                ["Listing ID", property.L_ListingID], ["Property type", property.L_Type_],
                ["Status", property.L_Status], ["Lot size (acres)", formatNumber(property.LotSizeAcres, acreFormat)],
                ["Garage spaces", formatNumber(property.L_Keyword5)], ["Subdivision", property.SubdivisionName],
                ["School district", property.HighSchoolDistrict], ["Flooring", property.Flooring],
                ["Heating", property.Heating], ["Cooling", property.Cooling]
              ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === "" ? "—" : value ?? "—"}</dd></div>)}
            </dl>
          </section>
          <PropertyMap latitude={property.LMD_MP_Latitude} longitude={property.LMD_MP_Longitude} />
          <section>
            <h2>Open houses</h2>
            {openHouseError ? <p role="alert">{openHouseError}</p> : openHouses === null ? (
              <p role="status">Loading open houses…</p>
            ) : openHouses.length === 0 ? <p>No open houses scheduled</p> : (
              <ul className="open-houses">{openHouses.map(event => <OpenHouse key={event.id} event={event} />)}</ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
