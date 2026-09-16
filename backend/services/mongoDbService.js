import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://omthakkar168_db_user:tDeeFWVe5CUFtqUd@cluster0.mvos6zu.mongodb.net/gsfc_placement_db?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'gsfc_placement_db';

let client = null;
let db = null;
let isConnecting = false;

/**
 * Connect to MongoDB Atlas
 */
export async function connectMongoDB() {
  if (db) return db;
  if (isConnecting) return null;

  try {
    isConnecting = true;
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    console.log(`🍃 [MongoDB Atlas] Connected successfully to cloud database: ${DB_NAME}`);
    return db;
  } catch (err) {
    console.warn('⚠️ [MongoDB Atlas] Connection notice:', err.message);
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Get active MongoDB database instance
 */
export function getMongoDb() {
  return db;
}

/**
 * Sync / Backup a document into a MongoDB collection
 */
export async function syncToMongo(collectionName, document, filterQuery = null) {
  try {
    const mongoDb = db || await connectMongoDB();
    if (!mongoDb) return false;

    const collection = mongoDb.collection(collectionName);
    const filter = filterQuery || (document.id ? { id: document.id } : (document.email ? { email: document.email } : { _id: document._id }));

    await collection.updateOne(
      filter,
      { 
        $set: { 
          ...document, 
          synced_at: new Date() 
        } 
      },
      { upsert: true }
    );
    return true;
  } catch (e) {
    console.warn(`⚠️ [MongoDB Sync] Failed to sync document to ${collectionName}:`, e.message);
    return false;
  }
}

export default {
  connectMongoDB,
  getMongoDb,
  syncToMongo
};
