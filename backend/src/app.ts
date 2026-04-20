import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://mongo:27017/shop");

let items: string[] = [];

app.get("/", (req, res) => {
    res.send("Backend działa");
});

app.get("/items", (req, res) => {
    res.json(items);
});

app.post("/items", (req, res) => {
    items.push(req.body.name);
    res.send("OK");
});

app.listen(3000, () => console.log("Backend 3000"));