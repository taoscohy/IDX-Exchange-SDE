import express from "express";
import pool from "../db.js";

const router = express.Router();

// Check that a query parameter contains a valid, positive number
function validNumber(value) {
  return typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0;
}

router.get("/", async (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const city = req.query.city;
  const zipcode = req.query.zipcode;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const beds = req.query.beds;
  const baths = req.query.baths;
 

  // Check pagination before running any database queries
  if ((req.query.limit !== undefined && !validNumber(req.query.limit)) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: "limit must be an integer between 1 and 100" });
  }

  if ((req.query.offset !== undefined && !validNumber(req.query.offset)) ||
      !Number.isSafeInteger(offset)) {
    return res.status(400).json({ error: "offset must be a positive whole integer" });
  }

  // Validate property filters
  if (city !== undefined &&
      (typeof city !== "string" || !city.trim() || city.length > 100)) {
    return res.status(400).json({ error: "city cannot be empty (max 100 characters)" });
  }

  if (zipcode !== undefined &&
      (typeof zipcode !== "string" || !/^\d{5}(-\d{4})?$/.test(zipcode.trim()))) {
    return res.status(400).json({ error: "zipcode must be a valid US ZIP code" });
  }

  // Check all four numeric filters using the same validation
  const numericFilters = { minPrice, maxPrice, beds, baths };

  for (const [name, value] of Object.entries(numericFilters)) {
    if (value !== undefined && !validNumber(value)) {
      return res.status(400).json({
        error: `${name} must be a valid, positive number`
      });
    }
  }

  if (beds !== undefined && !Number.isSafeInteger(Number(beds))) {
    return res.status(400).json({ error: "beds must be a whole number" });
  }

  if (minPrice !== undefined && maxPrice !== undefined &&
      Number(minPrice) > Number(maxPrice)) {
    return res.status(400).json({
      error: "minPrice cannot be greater than maxPrice"
    });
  }

  // Build the filters based on what the user searches for
  const conditions = [];
  const values = [];

  // Add conditions for provided filters
  if (city !== undefined) {
    // Ignore differences in capitalization and extra spaces
    conditions.push("LOWER(TRIM(L_City)) = LOWER(TRIM(?))");
    values.push(city);
  }

  if (zipcode !== undefined) {
    conditions.push("L_Zip = ?");
    values.push(zipcode);
  }

  if (minPrice !== undefined) {
    conditions.push("L_SystemPrice >= ?");
    values.push(Number(minPrice));
  }

  if (maxPrice !== undefined) {
    conditions.push("L_SystemPrice <= ?");
    values.push(Number(maxPrice));
  }

  if (beds !== undefined) {
    conditions.push("L_Keyword2 >= ?");
    values.push(Number(beds));
  }

  if (baths !== undefined) {
    conditions.push("LM_Dec_3 >= ?");
    values.push(Number(baths));
  }

  // Combine the filters with AND, or leave WHERE out if there are none
  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    // Count all properties that match the filters
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM rets_property ${where}`,
      values
    );

    // Get just the properties needed for the current page
    const [results] = await pool.execute(
      `SELECT L_ListingID, L_Address, L_City, L_SystemPrice
       FROM rets_property
       ${where}
       ORDER BY L_ListingID
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    res.json({ total, limit, offset, results });
  } catch (error) {
    console.error("Failed to fetch properties:", error.message);
    res.status(500).json({ error: "Failed to retrieve properties" });
  }
});

// Both tables use VARCHAR(255); preserve leading zeros and alphanumeric IDs.
router.param("listingId", (req, res, next, listingId) => {
  if (!/^[A-Za-z0-9_-]{1,255}$/.test(listingId)) {
    return res.status(400).json({
      error: "listingId must contain 1 to 255 letters, digits, underscores, or hyphens"
    });
  }
  next();
});

router.get("/:listingId/openhouses", async (req, res) => {
  const [properties] = await pool.execute(
    "SELECT L_ListingID FROM rets_property WHERE L_ListingID = ? LIMIT 1",
    [req.params.listingId]
  );

  if (properties.length === 0) {
    return res.status(404).json({ error: "Property not found" });
  }

  const [events] = await pool.execute(
    `SELECT * FROM rets_openhouse WHERE L_ListingID = ?
     ORDER BY OpenHouseDate ASC, OH_StartTime ASC, id ASC`,
    [req.params.listingId]
  );
  res.json(events);
});

router.get("/:listingId", async (req, res) => {
  const [properties] = await pool.execute(
    "SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1",
    [req.params.listingId]
  );

  if (properties.length === 0) {
    return res.status(404).json({ error: "Property not found" });
  }
  res.json(properties[0]);
});

export default router;
