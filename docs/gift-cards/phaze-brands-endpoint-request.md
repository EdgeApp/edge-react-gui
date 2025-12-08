# Request: Lightweight Brands Summary Endpoint

## Background

We're integrating the Phaze Non-Custodial API into the Edge Wallet for gift card purchases. The marketplace UI displays a grid of available gift card brands that users can browse and search.

## Current Situation

The `/gift-cards/full/:country` endpoint returns all brand data for a country:

| Metric | Value |
|--------|-------|
| Response Size | **4.24 MB** |
| Response Time | **~1.16 seconds** |
| Brand Count | 1,586 brands (US) |

This endpoint returns the complete brand object for each gift card, including large HTML fields (`productDescription`, `termsAndConditions`, `howToUse`) that aren't needed for the marketplace grid view.

## Request

We'd like to request a new lightweight endpoint that returns only the fields needed for displaying the marketplace grid:

### Proposed Endpoint

```
GET /gift-cards/brands/:country
```

### Proposed Response Schema

```json
{
  "country": "USA",
  "countryCode": "US",
  "totalCount": 1586,
  "brands": [
    {
      "brandName": "Walmart",
      "productId": 103188010383,
      "productImage": "https://...",
      "currency": "USD",
      "valueRestrictions": { "maxVal": 500, "minVal": 5 },
      "denominations": [],
      "categories": ["ecommerce", "retail", ...],
      "discount": 0
    }
  ]
}
```

### Fields Needed

| Field | Purpose |
|-------|---------|
| `brandName` | Display name in grid tile |
| `productId` | Unique identifier for navigation to detail view |
| `productImage` | Thumbnail for grid tile |
| `currency` | Display price range (e.g., "5 USD - 500 USD") |
| `valueRestrictions` | Display price range for variable-amount cards |
| `denominations` | Display price range for fixed-denomination cards |
| `categories` | Enable category filtering |
| `discount` | Optional: Show discount badge |

### Fields NOT Needed for Grid View

These large HTML fields can be fetched later when the user taps a specific brand:

- `productDescription`
- `termsAndConditions`
- `howToUse`
- `expiryAndValidity`
- `countryName` (redundant with response-level `country`)
- `deliveryFeeInPercentage`
- `deliveryFlatFee`
- `deliveryFlatFeeCurrency`

## Expected Benefits

- **~90% payload reduction**: Estimated ~400KB vs 4.24MB
- **Faster initial load**: Better UX for marketplace browsing
- **Reduced bandwidth**: Important for mobile users
- **Lower memory usage**: Better performance on mobile devices

## Alternative Approaches

If a new endpoint isn't feasible, we could also work with:

1. **Query parameter for sparse fields**: `GET /gift-cards/full/:country?fields=brandName,productId,productImage,currency,valueRestrictions,denominations,categories,discount`

2. **Separate detail endpoint**: Keep using `/gift-cards/full/:country` for summary, add `GET /gift-cards/brand/:productId` for full details when user selects a brand.

## Contact

Please let us know if you have questions or need additional context about our use case.

