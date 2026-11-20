function validCoordinate(value, limit) {
  return (typeof value === "string" || typeof value === "number") &&
    String(value).trim() !== "" && Number.isFinite(Number(value)) &&
    Number(value) !== 0 && Math.abs(Number(value)) <= limit;
}

export default function PropertyMap({ latitude, longitude }) {
  if (!validCoordinate(latitude, 90) || !validCoordinate(longitude, 180)) return null;
  const location = `${Number(latitude)},${Number(longitude)}`;
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  return (
    <section className="property-map">
      <h2>Location</h2>
      {apiKey && <iframe title="Property location" loading="lazy" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${location}&zoom=15`} />}
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${location}`} target="_blank" rel="noopener noreferrer">Get Directions</a>
    </section>
  );
}
