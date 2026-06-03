import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productmodel from './src/models/product.model.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const product = await productmodel.findOne({ variants: { $exists: true, $not: { $size: 0 } } });
  if (product) {
    const firstVarId = product.variants[0]._id.toString();
    console.log("Testing with variant ID:", firstVarId);
    
    // Check if .id method exists
    console.log("Type of variants.id:", typeof product.variants.id);
    
    try {
      const v = product.variants.id(firstVarId);
      console.log("Result of variants.id(firstVarId):", v ? v._id : 'Not Found');
    } catch(err) {
      console.error("Error calling product.variants.id:", err);
    }
  } else {
    console.log("No product with variants found.");
  }
  await mongoose.disconnect();
}

run().catch(console.error);
