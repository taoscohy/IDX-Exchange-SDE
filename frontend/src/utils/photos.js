export function firstPhotoUrl(photos) {
  if (typeof photos === "string") {
    try {
      photos = JSON.parse(photos);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(photos)) return null;

  for (const photo of photos) {
    if (typeof photo !== "string" || !photo.trim()) continue;
    try {
      const url = new URL(photo.trim());
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {
      // Skip unusable entries so a later valid photo can still be displayed.
    }
  }
  return null;
}
