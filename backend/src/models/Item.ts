import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: "List" }
});

export default mongoose.model("Item", itemSchema);