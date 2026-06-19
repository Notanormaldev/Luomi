import app from "./src/app.js";
import connecttodb from "./src/config/db.js";
import { startCleanupJob } from "./src/services/cleanup.service.js";

connecttodb()

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`[Luomi API] Running on port ${PORT} | ENV: ${process.env.NODE_ENVIRONMENT}`);
    startCleanupJob();
})


// ─── Graceful Shutdown ──────────────────────────────────────────────────────────
// AWS Auto Scaling sends SIGTERM when terminating an instance.
// We give in-flight requests up to 10 seconds to finish before hard-exiting.
// Without this, active requests get dropped mid-way during scale-in events.
function gracefulShutdown(signal) {
    console.log(`[Luomi API] Received ${signal}. Shutting down gracefully...`);
    server.close((err) => {
        if (err) {
            console.error('[Luomi API] Error during shutdown:', err.message);
            process.exit(1);
        }
        console.log('[Luomi API] All connections closed. Exiting.');
        process.exit(0);
    });

    // Force exit after 10 seconds if connections don't drain
    setTimeout(() => {
        console.error('[Luomi API] Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // AWS scale-in / ECS stop
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C in dev
process.on('uncaughtException', (err) => {
    console.error('[Luomi API] Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    console.error('[Luomi API] Unhandled Rejection:', reason);
    // Don't exit — log and continue; prevents crashes from async edge cases
});