import mongoose from "mongoose";
import orderModel from "../models/order.model.js";

class OrderDao {
  /**
   * Fetches orders that contain products belonging to a specific seller.
   * Only includes the items within those orders that belong to the seller.
   */
  async getOrdersForSeller(sellerId) {
    return await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $match: {
          "productDetails.seller": new mongoose.Types.ObjectId(sellerId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "buyerDetails"
        }
      },
      { $unwind: { path: "$buyerDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          buyer: {
            $first: {
              _id: "$buyerDetails._id",
              fullname: "$buyerDetails.fullname",
              email: "$buyerDetails.email",
              contact: "$buyerDetails.contact",
              profilepic: "$buyerDetails.profilepic"
            }
          },
          items: {
            $push: {
              product: "$productDetails",
              selectedVariant: "$items.selectedVariant",
              quantity: "$items.quantity",
              price: "$items.price"
            }
          },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
  }
}

export default new OrderDao();
