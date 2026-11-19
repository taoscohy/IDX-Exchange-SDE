# IDX Exchange — Week 8

Property detail pages build on the existing listings, filters, pagination, and
Express/MySQL APIs from Weeks 1–7. Work is on
`feat/week-8-Property-Detail-Page–End-to-End`. No Week 9–12 features are included.

## Run locally

Use the existing backend `.env` and MySQL database. Start Docker Desktop, then:

```sh
docker start idx-mysql-local
```

Start the backend in one terminal:

```sh
cd backend
npm ci
npm run dev
```

Start React in another terminal:

```sh
cd frontend
npm ci
npm start
```

Open http://localhost:3000. React uses port 3000 and proxies `/api` to Express
on port 5000. Keep port 3000 available. The existing backend `.env` supplies
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` (`rets`).

## Google Maps setup — requires your account

1. Sign in to https://console.cloud.google.com and create a project.
2. Link a billing account as required by Google's setup process.
3. Under **APIs & Services → Library**, enable **Maps Embed API**.
4. Under **APIs & Services → Credentials**, create an API key.
5. Set its application restriction to **Websites**, allowing
   `http://localhost:3000/*`. Set its API restriction to **Maps Embed API** only.
6. Create `frontend/.env` and add your real key:

   ```dotenv
   REACT_APP_GOOGLE_MAPS_API_KEY=your_key
   ```

7. Restart `npm start` after editing `.env` (or rebuild for a production build).

No API key was created or supplied. `.env` is already ignored by Git. The iframe
appears only when the key and both valid coordinates are present. With valid
coordinates but no key, Get Directions still works. Coordinates must be finite,
within latitude/longitude ranges, and not blank or zero. Numeric and string zero
values are treated as missing location data, so no map or directions link appears.

Google references: [API key setup and restrictions](https://developers.google.com/maps/documentation/embed/get-api-key)
and [iframe embedding](https://developers.google.com/maps/documentation/embed/embedding-map).

## Week 8 changes

| Files | Change and reason |
| --- | --- |
| `frontend/package.json`, `frontend/package-lock.json` | Add React Router 6, compatible with the existing React 18 setup. |
| `frontend/src/App.js` | Route `/` to listings and `/property/:id` to details. |
| `frontend/src/components/PropertyCard.js` | Card clicks navigate; the address remains a keyboard-accessible link. |
| `frontend/src/components/PropertyImageCarousel.js` | Card photos cycle with previous/next buttons and an X / Y counter. Arrows stop propagation to the card. |
| `frontend/src/components/PropertyImageGallery.js` | Main image, horizontally scrollable thumbnails, and full-screen lightbox with button and keyboard navigation. |
| `frontend/src/components/PropertyMap.js` | Embed the coordinate-based Google map without a Maps package; provide directions in a new tab. |
| `frontend/src/pages/PropertyDetailPage.js` | Fetch and display property details and open houses with loading, error, empty, and back-navigation states. |
| `frontend/src/api/client.js` | Reuse existing request/error handling for the two Week 4 endpoints; preserve cancellation. |
| `frontend/src/utils/photos.js` | Extend the existing safe parser to return all valid HTTP(S) photos, or an empty array for malformed JSON. |
| `frontend/src/utils/format.js` | Share the existing card number/currency formatting with the detail page. |
| `frontend/src/styles.css` | Add carousel controls, gallery/lightbox layout, detail styling, and thumbnail overflow. |
| `frontend/src/pages/ListingsPage.test.js` | Wrap existing tests in router context. |
| `frontend/src/pages/PropertyDetailPage.test.js` | Check the Week 8 navigation, photos, keyboard behavior, map URLs, remarks, and error cases. |
| `README.md` | Current setup, implementation notes, and verification status. |

The backend is unchanged. The detail page uses actual schema fields:
`L_SystemPrice`, `L_Address`, `L_City`, `L_State`, `L_Zip`, `L_Keyword2` (beds),
`LM_Dec_3` (baths), `LM_Int2_3` (sq ft), `YearBuilt`, and `L_Remarks`.
Property details include listing ID, type, status, lot acres (`LotSizeAcres`,
preserving the database's four decimal places), garage
spaces, subdivision, school district, flooring, heating, and cooling.

Open houses come from `/api/properties/:id/openhouses`. Their dates use
`OpenHouseDate`; times use `OH_StartTime` and `OH_EndTime`, formatted as AM/PM
without shifting the property's local event time. Failed open-house requests
show an error rather than incorrectly claiming there are no scheduled events.

## Debug challenges

- **Missing remarks:** `OpenHouseRemarks` is inside `all_data`, not a top-level
  response field. The React `OpenHouse` component parses the JSON with
  `try/catch`, also accepts an already-parsed object, and displays nonempty remarks.
- **Escape not firing:** a plain div does not receive keyboard focus. The
  lightbox has `tabIndex={-1}` and receives focus through a ref when opened.
  Its key handler handles Escape and left/right arrows, and keeps Tab focus
  inside the modal. Closing restores focus to the main-image button.

## Verification

```sh
cd backend
npm test -- --runInBand --watchman=false

cd ../frontend
CI=true npm test -- --watchAll=false --runInBand --watchman=false
CI=true npm run build
```

Verified during this implementation:

- 65 frontend tests passed, including all 52 existing regression tests and focused
  checks for lot acres and missing/zero coordinates.
- 32 existing backend tests passed.
- Production build compiled successfully; `git diff --check` passed.
- Real detail and open-house requests through the React proxy returned HTTP 200.
- `/api/properties/invalid-id` and its open-house endpoint returned HTTP 404.
- Direct browser-style requests (`Accept: text/html`) to property URLs, including
  `/property/invalid-id`, returned the React HTML with HTTP 200. React then
  handles the API response and displays the appropriate page or error.

| Week 8 checkpoint | Verified | Remaining manual check |
| --- | --- | --- |
| Listings → detail → back | DOM interaction test verifies URL changes, card click, and back button. Existing filters/pagination tests pass. | Visual browser flow. |
| Carousel and gallery, multiple/single photos | DOM tests verify wraparound, counters, stopped card navigation, thumbnail selection, one-photo behavior, and malformed-photo placeholders. Real API samples include both photo counts. | Real photo rendering and horizontal thumbnail scrolling. |
| Lightbox opens, navigates, closes | DOM tests verify focus, left/right buttons and keys, Escape, backdrop click, image click staying open, and restored focus. CSS provides a fixed full-screen overlay. | Visual full-screen layout. |
| Map and directions | DOM test verifies iframe coordinates, zoom, invalid/missing coordinate handling, and directions URL with `_blank`. | Live map and external directions page after Google key setup. |
| Open-house remarks | DOM tests verify JSON/object remarks, malformed JSON, date/time formatting, empty events, and request errors. Real API confirms remarks in `all_data`. | Visual rendering of a real event. |

The latest backend test run passed all 32 tests. Live browser verification was
attempted again: Chrome access timed out twice, and the in-app browser was
unavailable. No visual browser verification is claimed.
No Google Maps key was configured, so the live iframe remains unverified.

Useful local examples from the existing database:

- http://localhost:3000/property/1175978785 — 34 photos and an open house with remarks.
- http://localhost:3000/property/1114880309 — one photo and no open houses.
- http://localhost:3000/property/1000291026 — multiple photos and no open houses.
- http://localhost:3000/property/invalid-id — expected error panel.

The imported open-house events are dated September 2026; they are displayed as
returned by the existing API. No future-date filtering was added.
