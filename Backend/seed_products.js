import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productmodel from './src/models/product.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in env!");
  process.exit(1);
}

const SELLER_ID = '6a16b743d83d89a4ed34db41'; // harshpatelpc2005@gmail.com (seller role)

const PRODUCTS_DATA = [
  // 1. shirt
  {
    title: "Relaxed Fit Linen Blend Shirt",
    description: "Breathable linen-cotton blend shirt with a clean camp collar and relaxed silhouette, perfect for warm weather styling. Soft pre-washed texture.",
    images: [{ url: "/images/products/shirt_1.png" }],
    price: { amount: 2499, currency: "INR" },
    stock: 80,
    genderCategory: "men",
    subCategory: "shirt",
    variants: [
      { attributes: { size: "S", color: "Off-White" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/shirt_1.png" }] },
      { attributes: { size: "M", color: "Off-White" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/shirt_1.png" }] },
      { attributes: { size: "L", color: "Off-White" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/shirt_1.png" }] },
      { attributes: { size: "XL", color: "Off-White" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/shirt_1.png" }] }
    ]
  },
  {
    title: "Cropped Poplin Shirt",
    description: "Boxy, cropped button-up shirt crafted from crisp organic cotton poplin. Features wide cuffs, a classic pointed collar, and a modern drape.",
    images: [{ url: "/images/products/shirt_2.png" }],
    price: { amount: 2299, currency: "INR" },
    stock: 60,
    genderCategory: "women",
    subCategory: "shirt",
    variants: [
      { attributes: { size: "S", color: "Sky Blue" }, stock: 15, price: { amount: 2299, currency: "INR" }, images: [{ url: "/images/products/shirt_2.png" }] },
      { attributes: { size: "M", color: "Sky Blue" }, stock: 15, price: { amount: 2299, currency: "INR" }, images: [{ url: "/images/products/shirt_2.png" }] },
      { attributes: { size: "L", color: "Sky Blue" }, stock: 15, price: { amount: 2299, currency: "INR" }, images: [{ url: "/images/products/shirt_2.png" }] },
      { attributes: { size: "XL", color: "Sky Blue" }, stock: 15, price: { amount: 2299, currency: "INR" }, images: [{ url: "/images/products/shirt_2.png" }] }
    ]
  },

  // 2. t-shirt
  {
    title: "Oversized Heavyweight Tee",
    description: "Made from 280 GSM ultra-soft combed cotton. Dropped shoulders, boxy fit, and a tight ribbed collar that holds its shape.",
    images: [{ url: "/images/products/tshirt_1.png" }],
    price: { amount: 1499, currency: "INR" },
    stock: 120,
    genderCategory: "unisex",
    subCategory: "t-shirt",
    variants: [
      { attributes: { size: "S", color: "Stark White" }, stock: 30, price: { amount: 1499, currency: "INR" }, images: [{ url: "/images/products/tshirt_1.png" }] },
      { attributes: { size: "M", color: "Stark White" }, stock: 30, price: { amount: 1499, currency: "INR" }, images: [{ url: "/images/products/tshirt_1.png" }] },
      { attributes: { size: "L", color: "Stark White" }, stock: 30, price: { amount: 1499, currency: "INR" }, images: [{ url: "/images/products/tshirt_1.png" }] },
      { attributes: { size: "XL", color: "Stark White" }, stock: 30, price: { amount: 1499, currency: "INR" }, images: [{ url: "/images/products/tshirt_1.png" }] }
    ]
  },
  {
    title: "Acid Wash Boxy Tee",
    description: "Vintage-inspired mineral washed tee with a relaxed fit. Each piece features a unique faded grey wash pattern.",
    images: [{ url: "/images/products/tshirt_2.png" }],
    price: { amount: 1699, currency: "INR" },
    stock: 100,
    genderCategory: "men",
    subCategory: "t-shirt",
    variants: [
      { attributes: { size: "S", color: "Mineral Black" }, stock: 25, price: { amount: 1699, currency: "INR" }, images: [{ url: "/images/products/tshirt_2.png" }] },
      { attributes: { size: "M", color: "Mineral Black" }, stock: 25, price: { amount: 1699, currency: "INR" }, images: [{ url: "/images/products/tshirt_2.png" }] },
      { attributes: { size: "L", color: "Mineral Black" }, stock: 25, price: { amount: 1699, currency: "INR" }, images: [{ url: "/images/products/tshirt_2.png" }] },
      { attributes: { size: "XL", color: "Mineral Black" }, stock: 25, price: { amount: 1699, currency: "INR" }, images: [{ url: "/images/products/tshirt_2.png" }] }
    ]
  },

  // 3. pants
  {
    title: "Wide Leg Pleated Trousers",
    description: "Relaxed pleated pants featuring a fluid drape, double front pleats, and a wide-leg cut. Ideal for smart-casual styling.",
    images: [{ url: "/images/products/pants_1.png" }],
    price: { amount: 3499, currency: "INR" },
    stock: 70,
    genderCategory: "men",
    subCategory: "pants",
    variants: [
      { attributes: { size: "S", color: "Warm Sand" }, stock: 15, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/pants_1.png" }] },
      { attributes: { size: "M", color: "Warm Sand" }, stock: 20, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/pants_1.png" }] },
      { attributes: { size: "L", color: "Warm Sand" }, stock: 20, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/pants_1.png" }] },
      { attributes: { size: "XL", color: "Warm Sand" }, stock: 15, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/pants_1.png" }] }
    ]
  },
  {
    title: "Ribbed Knit Wide-Leg Pants",
    description: "Super soft, elasticated high-waist knit pants with a flowy, relaxed wide-leg silhouette. Ultra comfort design.",
    images: [{ url: "/images/products/pants_2.png" }],
    price: { amount: 2999, currency: "INR" },
    stock: 60,
    genderCategory: "women",
    subCategory: "pants",
    variants: [
      { attributes: { size: "S", color: "Oatmeal" }, stock: 15, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/pants_2.png" }] },
      { attributes: { size: "M", color: "Oatmeal" }, stock: 15, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/pants_2.png" }] },
      { attributes: { size: "L", color: "Oatmeal" }, stock: 15, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/pants_2.png" }] },
      { attributes: { size: "XL", color: "Oatmeal" }, stock: 15, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/pants_2.png" }] }
    ]
  },

  // 4. cargos
  {
    title: "Utility Parachute Cargos",
    description: "Oversized tactical cargo trousers with adjustable toggle hems and waist. Features 6 functional pockets in a lightweight, durable nylon-blend ripstop fabric.",
    images: [{ url: "/images/products/cargos_1.png" }],
    price: { amount: 3999, currency: "INR" },
    stock: 90,
    genderCategory: "unisex",
    subCategory: "cargos",
    variants: [
      { attributes: { size: "S", color: "Olive Green" }, stock: 20, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/cargos_1.png" }] },
      { attributes: { size: "M", color: "Olive Green" }, stock: 25, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/cargos_1.png" }] },
      { attributes: { size: "L", color: "Olive Green" }, stock: 25, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/cargos_1.png" }] },
      { attributes: { size: "XL", color: "Olive Green" }, stock: 20, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/cargos_1.png" }] }
    ]
  },
  {
    title: "Modular Technical Cargos",
    description: "Structured canvas cargo pants with functional pocket arrays and knee paneling. Heavy cotton build for a rugged drape.",
    images: [{ url: "/images/products/cargos_2.png" }],
    price: { amount: 3799, currency: "INR" },
    stock: 80,
    genderCategory: "men",
    subCategory: "cargos",
    variants: [
      { attributes: { size: "S", color: "Shadow Black" }, stock: 20, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/cargos_2.png" }] },
      { attributes: { size: "M", color: "Shadow Black" }, stock: 20, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/cargos_2.png" }] },
      { attributes: { size: "L", color: "Shadow Black" }, stock: 20, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/cargos_2.png" }] },
      { attributes: { size: "XL", color: "Shadow Black" }, stock: 20, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/cargos_2.png" }] }
    ]
  },

  // 5. polos
  {
    title: "Bouclé Knit Polo Shirt",
    description: "Textured bouclé stitch polo with a relaxed open collar (no buttons). Soft knit texture provides a refined retro summer look.",
    images: [{ url: "/images/products/polos_1.png" }],
    price: { amount: 2499, currency: "INR" },
    stock: 80,
    genderCategory: "men",
    subCategory: "polos",
    variants: [
      { attributes: { size: "S", color: "Cream" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/polos_1.png" }] },
      { attributes: { size: "M", color: "Cream" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/polos_1.png" }] },
      { attributes: { size: "L", color: "Cream" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/polos_1.png" }] },
      { attributes: { size: "XL", color: "Cream" }, stock: 20, price: { amount: 2499, currency: "INR" }, images: [{ url: "/images/products/polos_1.png" }] }
    ]
  },
  {
    title: "Ribbed Mercerized Polo",
    description: "Premium slim-fit polo knitted from mercerized cotton for a subtle sheen and silky drape. Detailed ribbed cuffs.",
    images: [{ url: "/images/products/polos_2.png" }],
    price: { amount: 2799, currency: "INR" },
    stock: 75,
    genderCategory: "men",
    subCategory: "polos",
    variants: [
      { attributes: { size: "S", color: "Slate Grey" }, stock: 15, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/polos_2.png" }] },
      { attributes: { size: "M", color: "Slate Grey" }, stock: 20, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/polos_2.png" }] },
      { attributes: { size: "L", color: "Slate Grey" }, stock: 20, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/polos_2.png" }] },
      { attributes: { size: "XL", color: "Slate Grey" }, stock: 20, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/polos_2.png" }] }
    ]
  },

  // 6. plus size
  {
    title: "Plus Oversized Canvas Shacket",
    description: "Comfort-fit heavy cotton canvas overshirt. Double chest pockets, relaxed drop shoulders, designed for clean layered styling.",
    images: [{ url: "/images/products/plus_size_1.png" }],
    price: { amount: 3299, currency: "INR" },
    stock: 60,
    genderCategory: "unisex",
    subCategory: "plus size",
    variants: [
      { attributes: { size: "2XL", color: "Forest Green" }, stock: 15, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/plus_size_1.png" }] },
      { attributes: { size: "3XL", color: "Forest Green" }, stock: 15, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/plus_size_1.png" }] },
      { attributes: { size: "4XL", color: "Forest Green" }, stock: 15, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/plus_size_1.png" }] },
      { attributes: { size: "5XL", color: "Forest Green" }, stock: 15, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/plus_size_1.png" }] }
    ]
  },
  {
    title: "Plus Flowy Satin Shirt",
    description: "Graceful satin button-up with a draped relaxed silhouette, elongated cuffs, and a curved hem. High-end aesthetic.",
    images: [{ url: "/images/products/plus_size_2.png" }],
    price: { amount: 2999, currency: "INR" },
    stock: 50,
    genderCategory: "women",
    subCategory: "plus size",
    variants: [
      { attributes: { size: "2XL", color: "Emerald" }, stock: 10, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/plus_size_2.png" }] },
      { attributes: { size: "3XL", color: "Emerald" }, stock: 15, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/plus_size_2.png" }] },
      { attributes: { size: "4XL", color: "Emerald" }, stock: 15, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/plus_size_2.png" }] },
      { attributes: { size: "5XL", color: "Emerald" }, stock: 10, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/plus_size_2.png" }] }
    ]
  },

  // 7. trouser
  {
    title: "Smart Tailored Trouser",
    description: "Slim-straight tailored trouser crafted from a refined wool blend. Side adjusters, hook-and-bar closure, clean crease lines.",
    images: [{ url: "/images/products/trouser_1.png" }],
    price: { amount: 3999, currency: "INR" },
    stock: 75,
    genderCategory: "men",
    subCategory: "trouser",
    variants: [
      { attributes: { size: "S", color: "Charcoal" }, stock: 15, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/trouser_1.png" }] },
      { attributes: { size: "M", color: "Charcoal" }, stock: 20, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/trouser_1.png" }] },
      { attributes: { size: "L", color: "Charcoal" }, stock: 20, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/trouser_1.png" }] },
      { attributes: { size: "XL", color: "Charcoal" }, stock: 20, price: { amount: 3999, currency: "INR" }, images: [{ url: "/images/products/trouser_1.png" }] }
    ]
  },
  {
    title: "High-Waist Wide-Leg Trouser",
    description: "Elegant high-rise trouser with deep front pleats and puddle-length wide legs. Tailored waist contrast.",
    images: [{ url: "/images/products/trouser_2.png" }],
    price: { amount: 3799, currency: "INR" },
    stock: 65,
    genderCategory: "women",
    subCategory: "trouser",
    variants: [
      { attributes: { size: "S", color: "Truffle Brown" }, stock: 15, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/trouser_2.png" }] },
      { attributes: { size: "M", color: "Truffle Brown" }, stock: 20, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/trouser_2.png" }] },
      { attributes: { size: "L", color: "Truffle Brown" }, stock: 15, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/trouser_2.png" }] },
      { attributes: { size: "XL", color: "Truffle Brown" }, stock: 15, price: { amount: 3799, currency: "INR" }, images: [{ url: "/images/products/trouser_2.png" }] }
    ]
  },

  // 8. jeans
  {
    title: "Japanese Selvedge Denim",
    description: "Crafted from 14oz raw Japanese selvedge denim. Straight leg, mid-rise, five-pocket design. Breaks in uniquely to your body.",
    images: [{ url: "/images/products/jeans_1.png" }],
    price: { amount: 4999, currency: "INR" },
    stock: 80,
    genderCategory: "men",
    subCategory: "jeans",
    variants: [
      { attributes: { size: "S", color: "Indigo Blue" }, stock: 20, price: { amount: 4999, currency: "INR" }, images: [{ url: "/images/products/jeans_1.png" }] },
      { attributes: { size: "M", color: "Indigo Blue" }, stock: 20, price: { amount: 4999, currency: "INR" }, images: [{ url: "/images/products/jeans_1.png" }] },
      { attributes: { size: "L", color: "Indigo Blue" }, stock: 20, price: { amount: 4999, currency: "INR" }, images: [{ url: "/images/products/jeans_1.png" }] },
      { attributes: { size: "XL", color: "Indigo Blue" }, stock: 20, price: { amount: 4999, currency: "INR" }, images: [{ url: "/images/products/jeans_1.png" }] }
    ]
  },
  {
    title: "Wide Leg Carpenter Jeans",
    description: "Relaxed fit jeans featuring carpenter utility details, loops, and a washed vintage light-blue denim finish.",
    images: [{ url: "/images/products/jeans_2.png" }],
    price: { amount: 3499, currency: "INR" },
    stock: 80,
    genderCategory: "women",
    subCategory: "jeans",
    variants: [
      { attributes: { size: "S", color: "Light Wash" }, stock: 20, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/jeans_2.png" }] },
      { attributes: { size: "M", color: "Light Wash" }, stock: 20, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/jeans_2.png" }] },
      { attributes: { size: "L", color: "Light Wash" }, stock: 20, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/jeans_2.png" }] },
      { attributes: { size: "XL", color: "Light Wash" }, stock: 20, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/jeans_2.png" }] }
    ]
  },

  // 9. hoodies (Note: downloaded as .jpg)
  {
    title: "Ultra-Heavy Boxy Hoodie",
    description: "450 GSM French Terry cotton hoodie with a double-layered hood (no drawstrings) and a cropped boxy cut.",
    images: [{ url: "/images/products/hoodies_1.jpg" }],
    price: { amount: 3499, currency: "INR" },
    stock: 100,
    genderCategory: "unisex",
    subCategory: "hoodies",
    variants: [
      { attributes: { size: "S", color: "Onyx Black" }, stock: 25, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/hoodies_1.jpg" }] },
      { attributes: { size: "M", color: "Onyx Black" }, stock: 25, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/hoodies_1.jpg" }] },
      { attributes: { size: "L", color: "Onyx Black" }, stock: 25, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/hoodies_1.jpg" }] },
      { attributes: { size: "XL", color: "Onyx Black" }, stock: 25, price: { amount: 3499, currency: "INR" }, images: [{ url: "/images/products/hoodies_1.jpg" }] }
    ]
  },
  {
    title: "Washed French Terry Hoodie",
    description: "Acid-washed relaxed pullover hoodie with kangaroo pockets and distressed ribbed trims for a worn-in street look.",
    images: [{ url: "/images/products/hoodies_2.jpg" }],
    price: { amount: 3299, currency: "INR" },
    stock: 90,
    genderCategory: "men",
    subCategory: "hoodies",
    variants: [
      { attributes: { size: "S", color: "Vintage Grey" }, stock: 20, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/hoodies_2.jpg" }] },
      { attributes: { size: "M", color: "Vintage Grey" }, stock: 25, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/hoodies_2.jpg" }] },
      { attributes: { size: "L", color: "Vintage Grey" }, stock: 25, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/hoodies_2.jpg" }] },
      { attributes: { size: "XL", color: "Vintage Grey" }, stock: 20, price: { amount: 3299, currency: "INR" }, images: [{ url: "/images/products/hoodies_2.jpg" }] }
    ]
  },

  // 10. shorts (Note: downloaded as .jpg)
  {
    title: "Linen Drawstring Shorts",
    description: "Lightweight, breathable linen-blend shorts with an elasticated waistband and adjustable flat drawstrings.",
    images: [{ url: "/images/products/shorts_1.jpg" }],
    price: { amount: 1999, currency: "INR" },
    stock: 90,
    genderCategory: "men",
    subCategory: "shorts",
    variants: [
      { attributes: { size: "S", color: "Ecrù" }, stock: 20, price: { amount: 1999, currency: "INR" }, images: [{ url: "/images/products/shorts_1.jpg" }] },
      { attributes: { size: "M", color: "Ecrù" }, stock: 25, price: { amount: 1999, currency: "INR" }, images: [{ url: "/images/products/shorts_1.jpg" }] },
      { attributes: { size: "L", color: "Ecrù" }, stock: 25, price: { amount: 1999, currency: "INR" }, images: [{ url: "/images/products/shorts_1.jpg" }] },
      { attributes: { size: "XL", color: "Ecrù" }, stock: 20, price: { amount: 1999, currency: "INR" }, images: [{ url: "/images/products/shorts_1.jpg" }] }
    ]
  },
  {
    title: "Heavy Fleece Lounge Shorts",
    description: "Cozy heavy fleece shorts with raw edge hems, deep side pockets, and an athletic relaxed fit.",
    images: [{ url: "/images/products/shorts_2.jpg" }],
    price: { amount: 1799, currency: "INR" },
    stock: 100,
    genderCategory: "unisex",
    subCategory: "shorts",
    variants: [
      { attributes: { size: "S", color: "Heather Grey" }, stock: 25, price: { amount: 1799, currency: "INR" }, images: [{ url: "/images/products/shorts_2.jpg" }] },
      { attributes: { size: "M", color: "Heather Grey" }, stock: 25, price: { amount: 1799, currency: "INR" }, images: [{ url: "/images/products/shorts_2.jpg" }] },
      { attributes: { size: "L", color: "Heather Grey" }, stock: 25, price: { amount: 1799, currency: "INR" }, images: [{ url: "/images/products/shorts_2.jpg" }] },
      { attributes: { size: "XL", color: "Heather Grey" }, stock: 25, price: { amount: 1799, currency: "INR" }, images: [{ url: "/images/products/shorts_2.jpg" }] }
    ]
  },

  // 11. activewear (Note: downloaded as .jpg)
  {
    title: "Technical Trail Windbreaker",
    description: "Water-repellent, windproof technical active jacket with heat-sealed zippers and breathable mesh back vents.",
    images: [{ url: "/images/products/activewear_1.jpg" }],
    price: { amount: 4499, currency: "INR" },
    stock: 70,
    genderCategory: "men",
    subCategory: "activewear",
    variants: [
      { attributes: { size: "S", color: "Cobalt Blue" }, stock: 15, price: { amount: 4499, currency: "INR" }, images: [{ url: "/images/products/activewear_1.jpg" }] },
      { attributes: { size: "M", color: "Cobalt Blue" }, stock: 20, price: { amount: 4499, currency: "INR" }, images: [{ url: "/images/products/activewear_1.jpg" }] },
      { attributes: { size: "L", color: "Cobalt Blue" }, stock: 20, price: { amount: 4499, currency: "INR" }, images: [{ url: "/images/products/activewear_1.jpg" }] },
      { attributes: { size: "XL", color: "Cobalt Blue" }, stock: 15, price: { amount: 4499, currency: "INR" }, images: [{ url: "/images/products/activewear_1.jpg" }] }
    ]
  },
  {
    title: "Sculpt High-Waisted Leggings",
    description: "Form-fitting compression leggings with moisture-wicking technology and a supportive high-rise ribbed waistband.",
    images: [{ url: "/images/products/activewear_2.jpg" }],
    price: { amount: 2999, currency: "INR" },
    stock: 80,
    genderCategory: "women",
    subCategory: "activewear",
    variants: [
      { attributes: { size: "S", color: "Matte Black" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/activewear_2.jpg" }] },
      { attributes: { size: "M", color: "Matte Black" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/activewear_2.jpg" }] },
      { attributes: { size: "L", color: "Matte Black" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/activewear_2.jpg" }] },
      { attributes: { size: "XL", color: "Matte Black" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/activewear_2.jpg" }] }
    ]
  },

  // 12. sweatshirts (Note: downloaded as .jpg)
  {
    title: "Oversized Crewneck Sweatshirt",
    description: "Heavy organic cotton loopback fleece crewneck with dropped shoulders and ribbed cuffs. Clean minimalist staple.",
    images: [{ url: "/images/products/sweatshirts_1.jpg" }],
    price: { amount: 2799, currency: "INR" },
    stock: 90,
    genderCategory: "unisex",
    subCategory: "sweatshirts",
    variants: [
      { attributes: { size: "S", color: "Chalk Cream" }, stock: 20, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_1.jpg" }] },
      { attributes: { size: "M", color: "Chalk Cream" }, stock: 25, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_1.jpg" }] },
      { attributes: { size: "L", color: "Chalk Cream" }, stock: 25, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_1.jpg" }] },
      { attributes: { size: "XL", color: "Chalk Cream" }, stock: 20, price: { amount: 2799, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_1.jpg" }] }
    ]
  },
  {
    title: "Mock-Neck Ribbed Sweatshirt",
    description: "Semi-formal mock-neck sweatshirt with a ribbed collar and cuffs, crafted from ultra-soft interlock cotton.",
    images: [{ url: "/images/products/sweatshirts_2.jpg" }],
    price: { amount: 2999, currency: "INR" },
    stock: 80,
    genderCategory: "men",
    subCategory: "sweatshirts",
    variants: [
      { attributes: { size: "S", color: "Mélange Grey" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_2.jpg" }] },
      { attributes: { size: "M", color: "Mélange Grey" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_2.jpg" }] },
      { attributes: { size: "L", color: "Mélange Grey" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_2.jpg" }] },
      { attributes: { size: "XL", color: "Mélange Grey" }, stock: 20, price: { amount: 2999, currency: "INR" }, images: [{ url: "/images/products/sweatshirts_2.jpg" }] }
    ]
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  // Models definitions
  const CartSchema = new mongoose.Schema({}, { strict: false });
  const Cart = mongoose.model('carts', CartSchema);

  const WishlistSchema = new mongoose.Schema({}, { strict: false });
  const Wishlist = mongoose.model('wishlists', WishlistSchema);

  const OrderSchema = new mongoose.Schema({}, { strict: false });
  const Order = mongoose.model('orders', OrderSchema);

  // 1. Wipe collections to avoid invalid/cheap references
  console.log("Wiping collections...");
  await productmodel.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Order.deleteMany({});
  console.log("✓ Collections wiped successfully.");

  // 2. Prepare and insert products
  const productsToInsert = PRODUCTS_DATA.map(p => ({
    ...p,
    seller: new mongoose.Types.ObjectId(SELLER_ID)
  }));

  console.log(`Inserting ${productsToInsert.length} premium products...`);
  const result = await productmodel.insertMany(productsToInsert);
  console.log(`✓ Seeded ${result.length} products successfully!`);

  await mongoose.disconnect();
}

seed().catch(console.error);
