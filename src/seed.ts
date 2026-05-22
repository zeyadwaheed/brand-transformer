import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { Brand } from './brand.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pleny-brands';

const currentYear = new Date().getFullYear();

// 10 seed documents covering different scenarios to make sure the schema handles edge cases
const seedCases = [
  {
    brandName: faker.company.name(),
    yearFounded: faker.number.int({ min: 1950, max: 2000 }),
    headquarters: faker.location.city() + ', ' + faker.location.country(),
    numberOfLocations: faker.number.int({ min: 500, max: 5000 }),
  },
  {
    brandName: faker.company.name(),
    yearFounded: faker.number.int({ min: 2005, max: 2020 }),
    headquarters: faker.location.city(),
    numberOfLocations: faker.number.int({ min: 1, max: 10 }),
  },
  {
    // earliest year the schema allows
    brandName: 'The Ancient House of ' + faker.word.noun(),
    yearFounded: 1600,
    headquarters: faker.location.city(),
    numberOfLocations: faker.number.int({ min: 1, max: 50 }),
  },
  {
    // most recent year allowed
    brandName: faker.company.name(),
    yearFounded: currentYear,
    headquarters: faker.location.city() + ', ' + faker.location.state(),
    numberOfLocations: 1,
  },
  {
    // minimum number of locations
    brandName: faker.company.name(),
    yearFounded: faker.number.int({ min: 1900, max: 2010 }),
    headquarters: faker.location.city(),
    numberOfLocations: 1,
  },
  {
    // very large chain
    brandName: faker.company.name() + ' Global',
    yearFounded: faker.number.int({ min: 1600, max: 1900 }),
    headquarters: faker.location.city() + ', USA',
    numberOfLocations: faker.number.int({ min: 10000, max: 50000 }),
  },
  {
    // special characters and accents in brand name
    brandName: 'Café Müller & Ünlü Co.',
    yearFounded: faker.number.int({ min: 1920, max: 1990 }),
    headquarters: 'Zürich',
    numberOfLocations: faker.number.int({ min: 10, max: 200 }),
  },
  {
    // Arabic characters in headquarters
    brandName: 'Al Baik Group',
    yearFounded: 1974,
    headquarters: 'جدة, Saudi Arabia',
    numberOfLocations: faker.number.int({ min: 100, max: 500 }),
  },
  {
    // very long headquarters name
    brandName: faker.company.name(),
    yearFounded: faker.number.int({ min: 1970, max: 2015 }),
    headquarters: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, Wales, United Kingdom',
    numberOfLocations: faker.number.int({ min: 5, max: 100 }),
  },
  {
    brandName: faker.company.name(),
    yearFounded: faker.number.int({ min: 1850, max: 1950 }),
    headquarters: faker.location.city() + ', ' + faker.location.country(),
    numberOfLocations: faker.number.int({ min: 100, max: 1000 }),
  },
];

async function seedBrands(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  let inserted = 0;

  for (let i = 0; i < seedCases.length; i++) {
    const data = seedCases[i];
    console.log(`Seeding Case ${i + 1}: ${data.brandName}`);

    const brand = new Brand(data);
    const err = brand.validateSync();
    if (err) {
      console.error(`Validation error: ${err.message}`);
      continue;
    }

    await brand.save();
    console.log(`Saved with _id: ${brand._id}`);
    inserted++;
  }

  console.log(`Seeding complete: ${inserted}/${seedCases.length} documents inserted`);
  await mongoose.disconnect();
}

seedBrands().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});