#!/bin/bash

# Test SKU Auto-Generation
# This script tests category-based SKU generation

API_BASE="http://localhost:3001/api"

echo "=== Testing SKU Auto-Generation ==="
echo ""

# Step 1: Login to get token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get categories
echo "Step 2: Fetching categories..."
CATEGORIES=$(curl -s -X GET "$API_BASE/products/categories" \
  -H "Authorization: Bearer $TOKEN")

# Extract first two category IDs
CATEGORY_1_ID=$(echo $CATEGORIES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CATEGORY_1_NAME=$(echo $CATEGORIES | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
CATEGORY_2_ID=$(echo $CATEGORIES | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
CATEGORY_2_NAME=$(echo $CATEGORIES | grep -o '"name":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)

echo "✅ Found categories:"
echo "   Category 1: $CATEGORY_1_NAME (ID: $CATEGORY_1_ID)"
echo "   Category 2: $CATEGORY_2_NAME (ID: $CATEGORY_2_ID)"
echo ""

# Step 3: Create product in Category 1 without SKU
echo "Step 3: Creating product in '$CATEGORY_1_NAME' WITHOUT SKU..."
PRODUCT_1=$(curl -s -X POST "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product 1\",
    \"categoryId\": \"$CATEGORY_1_ID\",
    \"costPrice\": 100,
    \"sellingPrice\": 150,
    \"quantity\": 10
  }")

PRODUCT_1_SKU=$(echo $PRODUCT_1 | grep -o '"sku":"[^"]*"' | cut -d'"' -f4)
echo "✅ Product 1 created with SKU: $PRODUCT_1_SKU"
echo ""

# Step 4: Create another product in same category without SKU
echo "Step 4: Creating another product in '$CATEGORY_1_NAME' WITHOUT SKU..."
PRODUCT_2=$(curl -s -X POST "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product 2\",
    \"categoryId\": \"$CATEGORY_1_ID\",
    \"costPrice\": 200,
    \"sellingPrice\": 250,
    \"quantity\": 5
  }")

PRODUCT_2_SKU=$(echo $PRODUCT_2 | grep -o '"sku":"[^"]*"' | cut -d'"' -f4)
echo "✅ Product 2 created with SKU: $PRODUCT_2_SKU"
echo ""

# Step 5: Create product in Category 2 without SKU
echo "Step 5: Creating product in '$CATEGORY_2_NAME' WITHOUT SKU..."
PRODUCT_3=$(curl -s -X POST "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product 3\",
    \"categoryId\": \"$CATEGORY_2_ID\",
    \"costPrice\": 300,
    \"sellingPrice\": 400,
    \"quantity\": 8
  }")

PRODUCT_3_SKU=$(echo $PRODUCT_3 | grep -o '"sku":"[^"]*"' | cut -d'"' -f4)
echo "✅ Product 3 created with SKU: $PRODUCT_3_SKU"
echo ""

# Step 6: Create product with manual SKU
echo "Step 6: Creating product with MANUAL SKU..."
PRODUCT_4=$(curl -s -X POST "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product 4\",
    \"sku\": \"MANUAL-SKU-001\",
    \"categoryId\": \"$CATEGORY_1_ID\",
    \"costPrice\": 400,
    \"sellingPrice\": 500,
    \"quantity\": 3
  }")

PRODUCT_4_SKU=$(echo $PRODUCT_4 | grep -o '"sku":"[^"]*"' | cut -d'"' -f4)
echo "✅ Product 4 created with SKU: $PRODUCT_4_SKU"
echo ""

# Summary
echo "=== TEST SUMMARY ==="
echo "Product 1 (Category: $CATEGORY_1_NAME): SKU = $PRODUCT_1_SKU"
echo "Product 2 (Category: $CATEGORY_1_NAME): SKU = $PRODUCT_2_SKU"
echo "Product 3 (Category: $CATEGORY_2_NAME): SKU = $PRODUCT_3_SKU"
echo "Product 4 (Manual SKU): SKU = $PRODUCT_4_SKU"
echo ""

# Validation
echo "=== VALIDATION ==="
if [[ $PRODUCT_1_SKU =~ ^[A-Z]{3}-[0-9]{4}$ ]]; then
  echo "✅ Product 1 SKU format is correct (PREFIX-SEQUENCE)"
else
  echo "❌ Product 1 SKU format is incorrect"
fi

if [[ $PRODUCT_2_SKU =~ ^[A-Z]{3}-[0-9]{4}$ ]]; then
  echo "✅ Product 2 SKU format is correct (PREFIX-SEQUENCE)"
else
  echo "❌ Product 2 SKU format is incorrect"
fi

if [[ $PRODUCT_3_SKU =~ ^[A-Z]{3}-[0-9]{4}$ ]]; then
  echo "✅ Product 3 SKU format is correct (PREFIX-SEQUENCE)"
else
  echo "❌ Product 3 SKU format is incorrect"
fi

if [ "$PRODUCT_4_SKU" == "MANUAL-SKU-001" ]; then
  echo "✅ Product 4 manual SKU preserved correctly"
else
  echo "❌ Product 4 manual SKU not preserved"
fi

# Check if Product 1 and 2 have same prefix (same category)
PREFIX_1=$(echo $PRODUCT_1_SKU | cut -d'-' -f1)
PREFIX_2=$(echo $PRODUCT_2_SKU | cut -d'-' -f1)
PREFIX_3=$(echo $PRODUCT_3_SKU | cut -d'-' -f1)

if [ "$PREFIX_1" == "$PREFIX_2" ]; then
  echo "✅ Products 1 & 2 have same prefix (same category)"
else
  echo "❌ Products 1 & 2 should have same prefix"
fi

if [ "$PREFIX_1" != "$PREFIX_3" ]; then
  echo "✅ Product 3 has different prefix (different category)"
else
  echo "❌ Product 3 should have different prefix"
fi

echo ""
echo "=== TEST COMPLETE ==="
