# Product-Level Metafields Guide

This document lists all the metafields that need to be created at the **Product** level for the product page sections to work properly.

## 📋 Metafields to Create

### 1. **Product Badge Label**
- **Namespace & Key:** `custom.badge_label`
- **Type:** Single line text
- **Description:** Badge text displayed on the product image (e.g., "High-End Series", "New Arrival", "Best Seller")
- **Used in:** `snippets/product-details.liquid`
- **Example:** "High-End Series"

---

### 2. **Warranty Information**
- **Namespace & Key:** `custom.warranty`
- **Type:** Single line text
- **Description:** Warranty information displayed in the product details section
- **Used in:** `snippets/product-details.liquid`
- **Example:** "2 Year Warranty"

---

### 3. **Return Policy**
- **Namespace & Key:** `custom.return_policy`
- **Type:** Single line text
- **Description:** Return policy information displayed in the product details section
- **Used in:** `snippets/product-details.liquid`
- **Example:** "7 Day Return"

---

### 4. **Delivery Information**
- **Namespace & Key:** `custom.delivery`
- **Type:** Single line text
- **Description:** Delivery information displayed in the product details section
- **Used in:** `snippets/product-details.liquid`
- **Example:** "Fast Delivery"

---

### 5. **Product Rating**
- **Namespace & Key:** `reviews.rating`
- **Type:** Number (decimal) or Rating
- **Description:** Average product rating (0-5 scale, can include decimals like 4.5)
- **Used in:** `snippets/product-details.liquid`
- **Example:** 4.8

---

### 6. **Review Count**
- **Namespace & Key:** `reviews.rating_count`
- **Type:** Number (integer)
- **Description:** Total number of reviews for the product
- **Used in:** `snippets/product-details.liquid`
- **Example:** 1240

---

### 7. **Build Specifications** (JSON Metafield)
- **Namespace & Key:** `custom.build_specifications`
- **Type:** JSON
- **Description:** Technical specifications related to build and layout
- **Used in:** `snippets/technical-specifications.liquid`
- **JSON Structure:**
```json
{
  "form_factor": "Full-size (104 keys)",
  "chassis": "Aircraft-grade Aluminum",
  "keycaps": "Double-shot PBT",
  "dimensions": "450 x 150 x 40 mm",
  "weight": "1.2 kg"
}
```
- **Fields:**
  - `form_factor` (optional)
  - `chassis` (optional)
  - `keycaps` (optional)
  - `dimensions` (optional)
  - `weight` (optional)

---

### 8. **Performance Specifications** (JSON Metafield)
- **Namespace & Key:** `custom.performance_specifications`
- **Type:** JSON
- **Description:** Technical specifications related to performance
- **Used in:** `snippets/technical-specifications.liquid`
- **JSON Structure:**
```json
{
  "switch_type": "SteelSeries OmniPoint",
  "actuation": "0.4mm to 3.6mm",
  "response_time": "0.7ms",
  "polling_rate": "1000 Hz",
  "durability": "100 million keystrokes"
}
```
- **Fields:**
  - `switch_type` (optional)
  - `actuation` (optional)
  - `response_time` (optional)
  - `polling_rate` (optional)
  - `durability` (optional)

---

### 9. **Complete Your Setup Products**
- **Namespace & Key:** `custom.complete_your_setup`
- **Type:** List of product references
- **Description:** Related products to display in the "Complete Your Setup" section (up to 3 products)
- **Used in:** `snippets/complete-your-setup.liquid`
- **Note:** Select up to 3 products that complement the main product

---

## 🛠️ How to Create These Metafields in Shopify

### Steps:
1. Go to **Settings** → **Custom data** → **Products**
2. Click **Add definition**
3. For each metafield above:
   - Enter the **Name** (e.g., "Badge Label")
   - Select the **Type** (Single line text, Number, JSON, List of products)
   - Enter the **Namespace and key** (e.g., `custom.badge_label`)
   - Save

### Important Notes:

#### For JSON Metafields:
- When creating `build_specifications` and `performance_specifications`, use **JSON** type
- The JSON structure is flexible - you can include any fields you need
- Only fields that exist in the JSON will be displayed

#### For Product References:
- When creating `complete_your_setup`, use **List of products** type
- You can select multiple products (up to 3 will be displayed)
- Products are displayed in the order they're added

#### For Reviews:
- The `reviews.rating` and `reviews.rating_count` metafields can be:
  - Manually entered
  - Populated by a review app
  - Synced from an external review system

---

## 📝 Quick Reference Table

| Metafield | Type | Required | Used In |
|-----------|------|----------|---------|
| `custom.badge_label` | Single line text | No | Product Details |
| `custom.warranty` | Single line text | No | Product Details |
| `custom.return_policy` | Single line text | No | Product Details |
| `custom.delivery` | Single line text | No | Product Details |
| `reviews.rating` | Number (decimal) | No | Product Details |
| `reviews.rating_count` | Number (integer) | No | Product Details |
| `custom.build_specifications` | JSON | No | Technical Specs |
| `custom.performance_specifications` | JSON | No | Technical Specs |
| `custom.complete_your_setup` | List of products | No | Complete Setup |

---

## ✅ Testing Checklist

After creating the metafields:
- [ ] Add badge label to a test product
- [ ] Add warranty, return policy, and delivery info
- [ ] Add rating and review count
- [ ] Create JSON metafields with sample data
- [ ] Add related products to complete your setup
- [ ] Verify all sections display correctly on the product page

---

## 💡 Tips

1. **All metafields are optional** - The sections will work even if metafields are empty
2. **JSON metafields are flexible** - Add any fields you need, the code will display them if they exist
3. **Product references** - You can add more than 3 products, but only the first 3 will be displayed
4. **Namespace consistency** - Use `custom.` namespace for your custom metafields and `reviews.` for review-related data

