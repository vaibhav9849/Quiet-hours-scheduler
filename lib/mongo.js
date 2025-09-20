import { MongoClient } from "mongodb";

let cached = global.mongoClientCache || { conn: null, promise: null };

export async function connectToDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  if (!cached.promise) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverApi: '1' });
    cached.promise = client.connect().then((client) => {
      return {
        client,
        db: client.db(process.env.MONGODB_DB || 'quiet-hours')
      };
    });
  }
  cached.conn = await cached.promise;
  global.mongoClientCache = cached;
  const db = cached.conn.db;
  // Ensure useful indexes (safe to call repeatedly)
  db.collection('blocks').createIndex({ email: 1, startTime: 1 });
  db.collection('blocks').createIndex({ startTime: 1 });
  return db;
}
