import mongoose from "mongoose";

let isMongoEventsBound = false;

const bindMongoEvents = () => {
  if (isMongoEventsBound) return;

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  isMongoEventsBound = true;
};

const gracefulShutdown = async (signal) => {
  try {
    await mongoose.connection.close();
    console.log(`MongoDB connection closed on ${signal}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error while closing MongoDB on ${signal}:`, error.message);
    process.exit(1);
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  bindMongoEvents();

  mongoose.set("strictQuery", true);

  const connectionInstance = await mongoose.connect(mongoUri, {
    maxPoolSize: process.env.NODE_ENV === "production" ? 20 : 10,
    minPoolSize: process.env.NODE_ENV === "production" ? 5 : 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: process.env.NODE_ENV !== "production",
  });

  process.once("SIGINT", () => gracefulShutdown("SIGINT"));
  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

  console.log(
    `MongoDB connected: ${connectionInstance.connection.host}/${connectionInstance.connection.name}`,
  );

  return connectionInstance.connection;
};

export default connectDB;
