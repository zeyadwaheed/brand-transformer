// Export all brand documents from MongoDB to a JSON file for backup or analysis.

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pleny-brands';

async function exportBrands(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.db!.collection('brands');
  const allBrands = await collection.find({}).toArray();

  const outputPath = path.join(__dirname, '..', 'brands-exported.json');
  fs.writeFileSync(outputPath, JSON.stringify(allBrands, null, 2));

  console.log(`Exported ${allBrands.length} brands to: ${outputPath}`);
  await mongoose.disconnect();
}

exportBrands().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
