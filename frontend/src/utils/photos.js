export function parsePhotos(photos) {
  if (typeof photos === "string") {
    try {
      photos = JSON.parse(photos);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(photos)) return [];

  const urls = [];
  for (const photo of photos) {
    if (typeof photo !== "string" || !photo.trim()) continue;
    try {
      const url = new URL(photo.trim());
      if (url.protocol === "https:" || url.protocol === "http:") urls.push(url.href);
    } catch {
      // Skip unusable entries so a later valid photo can still be displayed.
    }
  }
  return urls;
}

export function firstPhotoUrl(photos) {
  return parsePhotos(photos)[0] ?? null;
}
