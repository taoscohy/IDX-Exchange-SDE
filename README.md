# IDX Exchange — Property Search

A full-stack real estate search application built during my Software Development Engineering internship at IDX Exchange.

The application lets users browse property listings, search using multiple filters, and view detailed property information. It uses a React frontend, an Express REST API, and a MySQL database containing real estate listing data.

## Tech Stack

- **Frontend:** React, React Router, JavaScript, CSS
- **Backend:** Node.js, Express, MySQL2
- **Database:** MySQL 8, Docker
- **Testing:** Jest, React Testing Library, Supertest

## Features

- Search properties by city, ZIP code, price range, bedrooms, and bathrooms
- Sort listings by price, listing date, square footage, or bedrooms
- Browse results with pagination
- View property photos through an image carousel and full-screen gallery
- View property details, descriptions, and open house schedules
- Display property locations using Google Maps
- Handle loading states, invalid inputs, and API errors

## Getting Started

### Prerequisites

- Node.js and npm
- Docker Desktop
- MySQL 8
- The provided `rets_property` and `rets_openhouse` SQL files

### Database

Create a MySQL database named `rets` and import both SQL files. The application uses a local MySQL container named `idx-mysql-local`.

To start an existing container:

```bash
docker start idx-mysql-local
```

Database index scripts are available in `backend/sql/` for new database setups.

### Backend

From the project root:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rets
```

Start the server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The application runs at `http://localhost:3000`.

To enable property maps, add a Google Maps Embed API key to `frontend/.env`:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
```

Restrict the key to the Maps Embed API and your permitted website origins.

## API

The Express backend provides the following endpoints:

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Check database connectivity |
| `GET /api/properties` | Search, filter, sort, and paginate listings |
| `GET /api/properties/:id` | Get property details |
| `GET /api/properties/:id/openhouses` | Get open house information |

Example property search:

```http
GET /api/properties?city=Irvine&minPrice=300000&beds=3&limit=20&offset=0
```

The backend uses parameterized SQL queries for filter values and database indexes to improve search performance.

## Testing

Backend tests:

```bash
cd backend
npm test -- --runInBand --watchman=false
```

Frontend tests:

```bash
cd frontend
CI=true npm test -- --watchAll=false --runInBand --watchman=false
```

Production build:

```bash
cd frontend
npm run build
```

## Notes

- The application currently runs locally and requires the provided property data.
- Some listing photos may become unavailable when their source URLs expire.
- Embedded maps require a configured Google Maps API key and valid property coordinates.
