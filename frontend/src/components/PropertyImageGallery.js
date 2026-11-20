import { useEffect, useRef, useState } from "react";
import { parsePhotos } from "../utils/photos";

export default function PropertyImageGallery({ photos, address }) {
  const images = parsePhotos(photos);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const lightbox = useRef(null);
  const mainButton = useRef(null);
  const current = index % (images.length || 1);

  useEffect(() => {
    if (!open) return;
    const opener = mainButton.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightbox.current.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  function changePhoto(step) {
    setIndex(value => (value + step + images.length) % images.length);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      changePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
    if (event.key === "Tab") {
      const buttons = Array.from(lightbox.current.querySelectorAll("button"));
      const next = buttons.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1);
      event.preventDefault();
      buttons[(next + buttons.length) % buttons.length].focus();
    }
  }

  if (!images.length) return <div className="gallery-empty photo-placeholder">Photo unavailable</div>;

  return (
    <section className="property-gallery" aria-label="Property photos">
      <div className="gallery-main-wrapper">
        <button ref={mainButton} className="gallery-main" aria-label="Open photo lightbox" onClick={() => setOpen(true)}>
          <img src={images[current]} alt={`Property at ${address}, ${current + 1} of ${images.length}`} />
        </button>
        {images.length > 1 && <>
          <button className="photo-previous" aria-label="Previous photo" onClick={() => changePhoto(-1)}>‹</button>
          <button className="photo-next" aria-label="Next photo" onClick={() => changePhoto(1)}>›</button>
        </>}
      </div>
      <div className="gallery-thumbnails" aria-label="Photo thumbnails">
        {images.map((photo, photoIndex) => (
          <button key={`${photo}-${photoIndex}`} aria-label={`View photo ${photoIndex + 1}`}
            aria-pressed={current === photoIndex} onClick={() => setIndex(photoIndex)}>
            <img src={photo} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Property photo lightbox"
          ref={lightbox} tabIndex={-1} onKeyDown={handleKeyDown}
          onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <button className="lightbox-close" aria-label="Close lightbox" onClick={() => setOpen(false)}>×</button>
          {images.length > 1 && <button className="photo-previous" aria-label="Previous photo" onClick={() => changePhoto(-1)}>‹</button>}
          <img src={images[current]} alt={`Property at ${address}, ${current + 1} of ${images.length}`} />
          {images.length > 1 && <button className="photo-next" aria-label="Next photo" onClick={() => changePhoto(1)}>›</button>}
          <span className="photo-counter">{current + 1} / {images.length}</span>
        </div>
      )}
    </section>
  );
}
