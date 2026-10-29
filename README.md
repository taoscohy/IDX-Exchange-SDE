# IDX Exchange — Week 5

React listings frontend with the existing Express/MySQL backend. This implements
the first page of listings only: no filter form, pagination controls, detail UI,
routing, carousel, or maps.

## Run locally

Use Node.js and npm (verified with Node 24.21.0 and npm 11.19.0). Start Docker
Desktop and unpause it if necessary. The existing database and backend `.env`
must already be configured; no credentials belong in the frontend.

Start the existing MySQL container:

```sh
docker start idx-mysql-local
```

In one terminal:

```sh
cd /Users/taoscohy/Desktop/IDX/backend
npm ci
npm run dev
```

In another terminal:

```sh
cd /Users/taoscohy/Desktop/IDX/frontend
npm ci
npm start
```

Open http://localhost:3000, or on macOS:

```sh
open http://localhost:3000
```

The frontend start script sets port 3000. Keep this port available; decline any
Create React App prompt to use another port. Express listens on port 5000.
The backend uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`
from its existing private `.env`; `DB_NAME` should identify the `rets` database.

## How the code works

1. `src/index.js` mounts `App`, which provides the header, footer, and ListingsPage.
2. `ListingsPage` runs a `useEffect` on mount to call `fetchProperties`. It uses the
   backend's defaults (`limit=20`, `offset=0`). Only an explicit retry starts a new
   request; ordinary renders do not refetch.
3. `useState` stores the response, loading flag, error message, and retry counter.
   Updating state tells React to render the appropriate UI. The effect's cleanup
   aborts its request; guards prevent late responses from updating an unmounted page.
4. `fetchProperties(params, { signal })` encodes optional parameters with
   `URLSearchParams`, uses `fetch`, checks the HTTP status, parses JSON, and checks
   the response shape. It throws useful errors for network failures, HTTP errors,
   malformed JSON, and unexpected responses. Abort errors remain cancellations.
   Supported backend parameters are `city`, `zipcode`, `minPrice`, `maxPrice`,
   `beds`, `baths`, `limit`, and `offset`. There is no filter UI in Week 5.
5. The development server forwards `/api` requests to port 5000 using the
   `proxy` setting in `frontend/package.json`. Relative URLs let React call the
   backend through the same browser origin. This proxy is development-only;
   production hosting would need to route `/api` to Express separately.
6. Each result is passed as the `property` prop to a reusable `PropertyCard`.
   `L_ListingID` is its React key. The card formats prices as USD and numbers with
   separators; unknown numeric values show an em dash, while a real zero stays zero.
7. `firstPhotoUrl` safely parses JSON strings with `try/catch`, also accepts
   already-parsed arrays, skips invalid entries, and returns the first HTTP(S)
   image URL. Missing or malformed photos show a local CSS placeholder. An image
   `onError` handler switches failed downloads to the same placeholder without a
   loop or another external placeholder request.
8. While fetching, a status panel displays loading. Failures show an alert and
   a Try again button. Successful empty results show a dedicated empty state.
   Successful results display the returned count and a responsive card grid.

The existing search SELECT was extended with the five missing card columns.
Its validation, filters, ordering, pagination defaults, and response envelope
remain intact. Existing detail and open-house routes were not changed.

## Files

| File | Purpose |
| --- | --- |
| `.gitignore` | Excludes generated frontend builds and coverage. |
| `README.md` | Run instructions, explanation, and verification record. |
| `backend/routes/properties.js` | Adds required card columns to the existing search SELECT. |
| `backend/tests/properties.test.js` | Checks that the search query includes the new columns. |
| `frontend/package.json` | Create React App (`react-scripts`) scripts, React dependencies, and proxy. |
| `frontend/package-lock.json` | Reproducible dependency versions. |
| `frontend/public/index.html` | Accessible HTML entry document and page metadata. |
| `frontend/src/index.js` | React root and global stylesheet import. |
| `frontend/src/App.js` | Header, skip link, listings page, and footer. |
| `frontend/src/styles.css` | Responsive grid, cards, hover, status panels, and reduced-motion support. |
| `frontend/src/api/client.js` | Reusable API request and error handling. |
| `frontend/src/api/client.test.js` | Query encoding, cancellation, response validation, and request failure tests. |
| `frontend/src/pages/ListingsPage.js` | Fetch lifecycle, count, loading, errors, retry, empty state, and grid. |
| `frontend/src/pages/ListingsPage.test.js` | Page states, cleanup, formatting, and failed-image behavior tests. |
| `frontend/src/components/PropertyCard.js` | Reusable card displaying all required property fields. |
| `frontend/src/utils/photos.js` | Defensive first-photo selection. |
| `frontend/src/utils/photos.test.js` | Null, empty, malformed, parsed, and invalid-URL photo cases. |

## Checks

```sh
cd /Users/taoscohy/Desktop/IDX/backend
npm test -- --runInBand --watchman=false

cd /Users/taoscohy/Desktop/IDX/frontend
CI=true npm test -- --watchAll=false --runInBand --watchman=false
CI=true npm run build

curl http://localhost:3000/api/health
curl http://localhost:3000/api/properties
```

Verified October 26, 2026:

- 32 backend regression tests passed, including detail and open-house behavior.
- 27 frontend tests passed. Test fixtures are isolated to test files; the app
  itself always requests real API data.
- Production build and development compilation succeeded.
- React development server started on port 3000.
- `/api/health` through port 3000 returned database connected.
- `/api/properties` through port 3000 returned HTTP 200, total 55,212, limit 20,
  offset 0, and 20 real rows with all eight required display fields.
- Three sampled first-photo URLs returned HTTP 200 and `image/jpeg`.
- `git diff --check` passed.

The initial test attempts hit sandbox restrictions on Watchman and local server
binding. Disabling Watchman and rerunning with local networking allowed resolved
these environment failures. A frontend query-string compatibility test initially
failed; switching from `URLSearchParams.size` to `toString()` fixed it.

Create React App is used as required by the internship. Its older toolchain emits
dependency and Node/webpack deprecation notices; these did not prevent compilation
or tests. Reference: https://create-react-app.dev/docs/proxying-api-requests-in-development/

Browser visual verification remains outstanding: no connected browser was
available, and native Safari access was not approved. Consequently, desktop/mobile
layout, visual hover appearance, photo display in an actual browser, and the
browser console have not been manually verified. Automated DOM tests passed
without React warnings. To finish that manual review, open the app, inspect the
cards and count, resize to mobile width, and inspect the browser console. Stop
Express and reload to exercise the error panel; restart Express and use Try again.

## Acceptance status

- Implemented and checked: frontend startup/build, real API proxy integration,
  returned card data, count, API errors, loading/empty states, cleanup, malformed
  photo parsing, and broken-image fallback (automated DOM tests).
- Implemented, awaiting visual browser confirmation: responsive desktop/mobile
  layout, rendered real photos, and hover effect.
- Existing backend regression suite passes.
- Work is on `feature/week5-React-Setup-and-Listings-Page`. This branch already
  existed at the same commit as `develop`; it was checked out before edits.
  No commits, pushes, merges, or pull requests were made.
