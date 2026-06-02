import mongoose from "mongoose";
import cartModel from "../models/cart.model.js";

class CartDao {
  /**
   * Fetches the user's cart, populated with product details and
   * computed pricing logic based on selected variants using an aggregation pipeline.
   */
  async getCartWithPricing(userId) {
    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      // Unwind items to process individually. Preserve empty arrays for empty carts.
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
      
      // Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      // Unwind the product array (will be empty if product was deleted)
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Filter out valid items and keep empty carts
      {
        $match: {
          $or: [
            { "items": { $exists: false } },
            { "items": null },
            { "productDetails": { $exists: true, $ne: null } }
          ]
        }
      },

      // Determine the selected variant details if any
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
      
      // Calculate unit price and currency
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

      // Calculate total per item
      {
        $addFields: {
          "items.itemTotal": {
            $multiply: ["$items.unitPrice", { $ifNull: ["$items.quantity", 0] }]
          }
        }
      },

      // Group back into a single cart object
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
      
      // Finalize the structure
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

    const result = await cartModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      // If user has no cart, return an empty initialized structure
      return {
        user: userId,
        items: [],
        subtotal: 0,
        currency: 'INR',
        total: 0
      };
    }

    return result[0];
  }
}

export default new CartDao();
