import { useState } from "react";
import { firstPhotoUrl } from "../utils/photos";

const numberFormat = new Intl.NumberFormat("en-US");
const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
});

function formatNumber(value, formatter = numberFormat) {
  if ((typeof value !== "string" && typeof value !== "number") ||
      String(value).trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0) return null;
  return formatter.format(Number(value));
}

function textOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default function PropertyCard({ property }) {
  const photoUrl = firstPhotoUrl(property.L_Photos);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const address = textOrEmpty(property.L_Address) || "Address unavailable";
  const location = [property.L_City, property.L_State].map(textOrEmpty).filter(Boolean).join(", ");

  return (
    <article className="property-card">
      <div className="property-photo">
        {photoUrl && failedPhoto !== photoUrl ? (
          <img src={photoUrl} alt={`Property at ${address}`} loading="lazy"
            onError={() => setFailedPhoto(photoUrl)} />
        ) : (
          <div className="photo-placeholder">
            <span aria-hidden="true">⌂</span>
            <span>Photo unavailable</span>
          </div>
        )}
      </div>
      <div className="property-content">
        <p className="property-price">
  {Number(property.L_SystemPrice) > 0 ? formatNumber(property.L_SystemPrice, priceFormat): "Price unavailable"}</p>
        <h2>{address}</h2>
        <p className="property-location">{location || "Location unavailable"}</p>
        <dl className="property-facts">
          <div><dt>Beds</dt><dd>{formatNumber(property.L_Keyword2) ?? "—"}</dd></div>
          <div><dt>Baths</dt><dd>{formatNumber(property.LM_Dec_3) ?? "—"}</dd></div>
          <div><dt>Sq ft</dt><dd>{formatNumber(property.LM_Int2_3) ?? "—"}</dd></div>
        </dl>
      </div>
    </article>
  );
}
