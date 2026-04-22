import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true }
});

// @ts-ignore
export default mongoose.model("User", UserSchema);