import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

// @ts-ignore
export default mongoose.model("List", listSchema);