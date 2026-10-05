import { randomBytes } from "node:crypto";

process.env.JWT_SECRET ??= randomBytes(32).toString("hex");
process.env.AI_KEY_SECRET ??= randomBytes(32).toString("hex");
