import { Link, useNavigate } from "react-router-dom";
import PropertyImageCarousel from "./PropertyImageCarousel";
import { formatNumber, priceFormat } from "../utils/format";

function textOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  const detailPath = `/property/${encodeURIComponent(property.L_ListingID)}`;
  const address = textOrEmpty(property.L_Address) || "Address unavailable";
  const location = [property.L_City, property.L_State].map(textOrEmpty).filter(Boolean).join(", ");

  return (
    <article className="property-card" onClick={() => navigate(detailPath)}>
      <PropertyImageCarousel photos={property.L_Photos} address={address} />
      <div className="property-content">
        <p className="property-price">
          {Number(property.L_SystemPrice) > 0 ? formatNumber(property.L_SystemPrice, priceFormat) : "Price unavailable"}
        </p>
        <dl className="property-facts">
          <div><dt>Beds</dt><dd>{formatNumber(property.L_Keyword2) ?? "—"}</dd></div>
          <div><dt>Baths</dt><dd>{formatNumber(property.LM_Dec_3) ?? "—"}</dd></div>
          <div><dt>Sq ft</dt><dd>{formatNumber(property.LM_Int2_3) ?? "—"}</dd></div>
        </dl>
        <h2><Link to={detailPath} onClick={event => event.stopPropagation()}>{address}</Link></h2>
        <p className="property-location">{location || "Location unavailable"}</p>
      </div>
    </article>
  );
}
