import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in env!");
  process.exit(1);
}

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('products', ProductSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const product = await Product.findOne({ variants: { $exists: true, $not: { $size: 0 } } });
  if (product) {
    console.log(`Product Title: ${product.title}`);
    console.log(`First variant raw object:`, product.variants[0]);
    console.log(`First variant keys:`, Object.keys(product.variants[0].toObject ? product.variants[0].toObject() : product.variants[0]));
  } else {
    console.log("No product with variants found!");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
