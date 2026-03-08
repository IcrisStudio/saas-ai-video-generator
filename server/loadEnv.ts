/**
 * Load env before any other server code so GROQ_API_KEY, R2_*, etc. are set.
 * Must be the first import in server.ts.
 */
import dotenv from "dotenv";
import path from "path";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });
dotenv.config({ path: path.join(root, ".env.development.local"), override: true });
