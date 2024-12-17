/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

export default class DatabaseConnection {
  constructor() {
    return new Proxy(this, {
      get(target: any, prop: any) {
        const originalMethod = target[prop];

        if (typeof originalMethod === "function") {
          return async function (...args: any[]) {
            await target.checkDatabaseConnection();

            return originalMethod.apply(target, args);
          };
        }

        return originalMethod;
      },
    });
  }

  private async checkDatabaseConnection() {
    let cached = (global as any).mongoose;

    if (!cached) {
      cached = (global as any).mongoose = { conn: null, promise: null };
    }

    if (cached.conn) {
      return cached.conn;
    }

    if (
      !process.env.DB_USER ||
      !process.env.DB_PASSWORD ||
      !process.env.DB_NAME
    ) {
      throw new Error(
        "Please define the database parameters [DB_USER, DB_PASSWORD, DB_NAME] environment variable inside .env.local"
      );
    }

    const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_NAME}?retryWrites=true&w=majority`;

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        return mongoose;
      });
    }
    cached.conn = await cached.promise;
    return cached.conn;
  }
}
