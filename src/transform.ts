/*
 * When I looked at the raw data, I noticed a few recurring problems:
 * some documents used different field names than what the schema expects,
 * and some numeric fields had random words in them instead of actual numbers.
 *
 * This script goes through each document and fixes those issues before
 * saving them back to the same collection with the same _id.
 *
 * For yearFounded, the data sometimes uses "yearCreated" or "yearsFounded"
 * so we check all three and take the first valid one we find.
 * If none of them have a real number, we fall back to 1600.
 *
 * Same idea for headquarters — sometimes it shows up as "hqAddress".
 * And for brandName, one document had it buried inside a nested "brand" object.
 *
 * Any fields that don't belong in the schema get removed after the fix.
 */

import mongoose from 'mongoose';
import { Brand, MIN_YEAR_FOUNDED } from './brand.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pleny-brands';

// Schema minimum value for numberOfLocations
const MIN_LOCATIONS = 1;

// helper functions to parse and validate fields
function parseInteger(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (isNaN(num)) return null;
  return num;
}
function parseString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return null;
}

// main transformation function
async function transformBrands(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // use the raw collection to read documents as required for transformation
  const collection = mongoose.connection.db!.collection('brands');
  const rawDocs = await collection.find({}).toArray();

  console.log(`Found ${rawDocs.length} brand documents to transform\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const raw of rawDocs) {
    const docId = raw._id;
    console.log(`Processing _id: ${docId} ---`);

    
    const brandName =
      parseString(raw.brandName) ??
      parseString(raw.brand?.name) ??
      null;

    if (!brandName) {
      console.warn(`No valid brandName found — skipping document`);
      errorCount++;
      continue;
    }

    // primary field: yearFounded
    // alternate field names seen in the data: yearCreated, yearsFounded
    let yearFounded =
      parseInteger(raw.yearFounded) ??
      parseInteger(raw.yearCreated) ??
      parseInteger(raw.yearsFounded) ??
      null;

    const currentYear = new Date().getFullYear();

    // validate range; fall back to schema minimum if out of range or missing
    if (
      yearFounded === null ||
      yearFounded < MIN_YEAR_FOUNDED ||
      yearFounded > currentYear
    ) {
      console.log(`yearFounded invalid/missing — using minimum: ${MIN_YEAR_FOUNDED}`);
      yearFounded = MIN_YEAR_FOUNDED;
    }

    // primary field: headquarters
    // alternate field name seen in the data: hqAddress
    const headquarters =
      parseString(raw.headquarters) ??
      parseString(raw.hqAddress) ??
      null;

    if (!headquarters) {
      console.warn(`No valid headquarters found — skipping document`);
      errorCount++;
      continue;
    }

    // primary field: numberOfLocations
    // no alternate field name observed in data
    let numberOfLocations = parseInteger(raw.numberOfLocations);

    if (numberOfLocations === null || numberOfLocations < MIN_LOCATIONS) {
      console.log(`numberOfLocations invalid/missing — using minimum: ${MIN_LOCATIONS}`);
      numberOfLocations = MIN_LOCATIONS;
    }

    // ── Build the corrected document ───────────────────────────────────────
    const correctedData = {
      brandName,
      yearFounded,
      headquarters,
      numberOfLocations,
    };

    console.log('Corrected data:', correctedData);

    // Validate against Mongoose schema before saving
    const brandDoc = new Brand({ _id: docId, ...correctedData });
    const validationError = brandDoc.validateSync();
    if (validationError) {
      console.error(`Validation failed:`, validationError.errors);
      errorCount++;
      continue;
    }

    // save in-place: update the SAME document with SAME _id
    // only set the 4 schema fields + timestamps; $unset removes stale/wrong fields
    await collection.updateOne(
      { _id: docId },
      {
        $set: correctedData,
        // remove non-schema fields that were in the raw data
        $unset: {
          yearCreated: '',
          yearsFounded: '',
          hqAddress: '',
          brand: '',
        },
      },
    );

    console.log(`Updated successfully`);
    successCount++;
  }

  console.log(`Transformation complete: ${successCount} updated, ${errorCount} skipped`);
  await mongoose.disconnect();
}

transformBrands().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
