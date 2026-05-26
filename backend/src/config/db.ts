import mongoose from "mongoose";

export async function connectDb(){
    try {
     await mongoose.connect(process.env.MONGO_URI as string);
     console.log("Connected to MongoDB");   
    } catch (error) {
        console.log(error);
         process.exit(1);
    }
}