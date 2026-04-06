import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB_URL = process.env.DB_URL;

const connectDB = async function () {
    try {
        if (!DB_URL) {
            throw new Error("DB_URL missing in .env");
        }

        await mongoose.connect(DB_URL);
        console.log("DB server connected");

    } catch (error) {
        console.log("DB connection failed");
        console.log(error.message);
        process.exit(1);
    }
};

export default connectDB;