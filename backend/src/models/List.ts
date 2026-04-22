import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    name: { type: String, required: true },

    members: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

export default mongoose.model("List", listSchema);