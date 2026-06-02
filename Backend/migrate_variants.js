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

  const products = await Product.find({ variants: { $exists: true, $not: { $size: 0 } } });
  console.log(`Found ${products.length} products with variants.`);

  let updatedCount = 0;
  for (const product of products) {
    let changed = false;
    
    // Convert Mongoose document to plain array of variants to inspect and modify
    const variants = product.variants || [];
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i]._id) {
        variants[i]._id = new mongoose.Types.ObjectId();
        changed = true;
      }
    }

    if (changed) {
      product.markModified('variants');
      await product.save();
      console.log(`Added variant IDs to product: "${product.title}"`);
      updatedCount++;
    }
  }

  console.log(`\nMigration completed. Updated ${updatedCount} products.`);
  await mongoose.disconnect();
}

run().catch(console.error);
