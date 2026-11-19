import { useState } from "react";
import { parsePhotos } from "../utils/photos";

export default function PropertyImageCarousel({ photos, address }) {
  const images = parsePhotos(photos);
  const [index, setIndex] = useState(0);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const current = index % (images.length || 1);
  const photo = images[current];

  function changePhoto(event, step) {
    event.stopPropagation();
    setIndex((current + step + images.length) % images.length);
  }

  return (
    <div className="property-photo property-carousel">
      {photo && failedPhoto !== photo ? (
        <img src={photo} alt={`Property at ${address}`} loading="lazy" onError={() => setFailedPhoto(photo)} />
      ) : (
        <div className="photo-placeholder"><span aria-hidden="true">⌂</span><span>Photo unavailable</span></div>
      )}
      {images.length > 1 && <>
        <button className="photo-previous" aria-label="Previous photo" onClick={event => changePhoto(event, -1)}>‹</button>
        <button className="photo-next" aria-label="Next photo" onClick={event => changePhoto(event, 1)}>›</button>
      </>}
      {images.length > 0 && <span className="photo-counter">{current + 1} / {images.length}</span>}
    </div>
  );
}
