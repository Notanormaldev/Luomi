import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productmodel from './src/models/product.model.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const product = await productmodel.findOne({ variants: { $exists: true, $not: { $size: 0 } } });
  if (product) {
    console.log(`Product: ${product.title}`);
    console.log(`Variants list:`, JSON.stringify(product.variants, null, 2));
  } else {
    console.log("No product with variants found.");
  }
  await mongoose.disconnect();
}

run().catch(console.error);
