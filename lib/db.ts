import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URL;
if (!uri) throw new Error("MONGODB_URL is not set in .env");

// Reuse one client across hot reloads in development.
const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };

export const client = globalForMongo._mongoClient ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") globalForMongo._mongoClient = client;

export const db = client.db("music-app");
