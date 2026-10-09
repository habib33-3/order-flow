/* eslint-disable no-console */
import { disconnectSeedDatabase, runSeed } from "./seed/index";

runSeed()
    .catch((error) => {
        console.error("\n❌ Database seed failed!");
        console.error(error);

        process.exitCode = 1;
    })
    .finally(async () => {
        console.log("\n🔌 Disconnecting from database...");

        await disconnectSeedDatabase();

        console.log("✅ Database disconnected.");
    });
