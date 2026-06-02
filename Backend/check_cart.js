import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cartModel from "./src/models/cart.model.js";
import productModel from "./src/models/product.model.js";
import cartDao from "./src/dao/cart.dao.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in env!");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const carts = await cartModel.find({});
  console.log(`Found ${carts.length} carts.`);
  for (const cart of carts) {
    console.log(`Cart User: ${cart.user}`);
    console.log(`Cart Raw Items:`, JSON.stringify(cart.items, null, 2));
    
    try {
      // Test the fix by applying the check
      const pipeline = [
        { $match: { user: new mongoose.Types.ObjectId(cart.user) } },
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "items": { $exists: false } },
              { "items": null },
              { "productDetails": { $exists: true, $ne: null } }
            ]
          }
        },
        {
          $addFields: {
            "items.variantData": {
              $let: {
                vars: {
                  variantMatch: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: { $ifNull: ["$productDetails.variants", []] },
                          as: "v",
                          cond: { $eq: ["$$v._id", "$items.selectedVariant"] }
                        }
                      },
                      0
                    ]
                  }
                },
                in: {
                  $cond: {
                    if: { $ne: ["$$variantMatch", null] },
                    then: {
                      _id: "$$variantMatch._id",
                      attributes: "$$variantMatch.attributes",
                      images: "$$variantMatch.images",
                      stock: "$$variantMatch.stock",
                      price: "$$variantMatch.price"
                    },
                    else: null
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            "items.unitPrice": {
              $cond: {
                if: { $ne: ["$items.variantData.price.amount", null] },
                then: "$items.variantData.price.amount",
                else: { $ifNull: ["$productDetails.price.amount", 0] }
              }
            },
            "items.currency": {
              $cond: {
                if: { $ne: ["$items.variantData.price.currency", null] },
                then: "$items.variantData.price.currency",
                else: { $ifNull: ["$productDetails.price.currency", "INR"] }
              }
            }
          }
        },
        {
          $addFields: {
            "items.itemTotal": {
              $multiply: ["$items.unitPrice", { $ifNull: ["$items.quantity", 0] }]
            }
          }
        },
        {
          $group: {
            _id: "$_id",
            user: { $first: "$user" },
            items: {
              $push: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [{ $ifNull: ["$items", null] }, null] },
                      { $ne: [{ $ifNull: ["$items.product", null] }, null] }
                    ]
                  },
                  then: {
                    product: {
                      _id: "$productDetails._id",
                      title: "$productDetails.title",
                      images: "$productDetails.images",
                      stock: "$productDetails.stock",
                      price: "$productDetails.price",
                      variants: "$productDetails.variants"
                    },
                    selectedVariant: "$items.selectedVariant",
                    variantData: "$items.variantData",
                    quantity: "$items.quantity",
                    unitPrice: "$items.unitPrice",
                    currency: "$items.currency",
                    itemTotal: "$items.itemTotal"
                  },
                  else: "$$REMOVE"
                }
              }
            },
            subtotal: { $sum: "$items.itemTotal" },
            firstCurrency: { $first: "$items.currency" }
          }
        },
        {
          $addFields: {
            total: "$subtotal",
            currency: { $ifNull: ["$firstCurrency", "INR"] }
          }
        },
        {
          $project: {
            firstCurrency: 0
          }
        }
      ];
      const result = await mongoose.connection.db.collection("carts").aggregate(pipeline).toArray();
      console.log(`Priced Cart (Tested Fix):`, JSON.stringify(result[0], null, 2));
    } catch (err) {
      console.error("Error running test pipeline", err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
