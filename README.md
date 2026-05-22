# Brand Data Transformer

Node.js + TypeScript + Mongoose

## Setup

```bash
npm install
```

## How to Run

Since the raw data has inconsistent field names and wrong value types,
you need to run the scripts in this order:

```bash
# 1. Reset and import the raw data
npm run reset

# 2. Fix the 10 broken documents
npm run transform

# 3. Add 10 new valid documents
npm run seed

# 4. Export the final collection to brands-exported.json
npm run export
```

---

## What the Transform Script Does

The raw brands.json we received had several data quality issues —
some fields were misnamed, some values were Latin words instead of
numbers, and some fields were missing entirely.

The transform script handles each field like this:

| Field | Looks for | Falls back to | If still missing |
|-------|-----------|---------------|-----------------|
| `brandName` | `brandName` | `brand.name` | skip document |
| `yearFounded` | `yearFounded` | `yearCreated`, `yearsFounded` | use 1600 |
| `headquarters` | `headquarters` | `hqAddress` | skip document |
| `numberOfLocations` | `numberOfLocations` | — | use 1 |

After fixing each document, any leftover wrong field names are
removed so the final documents are clean.
