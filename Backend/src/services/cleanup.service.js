import orderModel from "../models/order.model.js";

/**
 * Periodically deletes pending Razorpay orders that have not been paid
 * within 10 minutes of their creation.
 */
export function startCleanupJob() {
  console.log("[Cleanup] Razorpay pending orders cleanup job initialized.");
  
  // Run once immediately on server startup
  cleanupPendingOrders();

  // Run every 5 minutes
  setInterval(cleanupPendingOrders, 5 * 60 * 1000);
}

async function cleanupPendingOrders() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const result = await orderModel.deleteMany({
      paymentMethod: "Razorpay",
      status: "pending",
      paymentStatus: "pending",
      createdAt: { $lt: tenMinutesAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`[Cleanup] Successfully deleted ${result.deletedCount} expired pending Razorpay orders.`);
    }
  } catch (error) {
    console.error("[Cleanup Error] Failed to delete expired pending Razorpay orders:", error);
  }
}
