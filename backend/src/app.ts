import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

import User from "./models/User";
import List from "./models/List";
import Item from "./models/Item";
import { authMiddleware } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.get("/", (req, res) => {
    res.send("API works");
});

// ================= SOCKET =================

io.on("connection", (socket) => {
    socket.on("join-user", (userId) => {
        socket.join(userId);
    });

    socket.on("join-list", (listId) => {
        socket.join(listId);
    });
});

// ================= AUTH =================

app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send("All fields are required");
    }

    const existsEmail = await User.findOne({ email });
    if (existsEmail) return res.status(400).send("User already exists");

    const existsName = await User.findOne({ name });
    if (existsName) return res.status(400).send("Username already taken");

    const user = await User.create({ name, email, password });

    res.json(user);
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("All fields are required");
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    if (user.password !== password)
        return res.status(400).send("Wrong password");

    res.json({
        token: user._id.toString(),
        user
    });
});

// ================= LISTS =================

app.get("/lists", authMiddleware, async (req: any, res) => {
    const lists = await List.find({
        members: req.userId
    }).populate("owner", "name");

    res.json(lists);
});

app.post("/lists", authMiddleware, async (req: any, res) => {
    const name = req.body.name?.trim();

    if (!name) {
        return res.status(400).send("List name is required");
    }

    const exists = await List.findOne({
        name,
        members: req.userId
    });

    if (exists) {
        return res.status(400).send("List with the same name already exists");
    }

    const list = await List.create({
        name,
        members: [req.userId],
        owner: req.userId
    });

    res.json(list);
});

app.delete("/lists/:id", authMiddleware, async (req, res) => {
    await List.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
});

// ================= INVITE USER =================

app.post("/lists/:id/add-user", authMiddleware, async (req, res) => {
    const { userEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).send("User not found");

    const list = await List.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { members: user._id } },
        { new: true }
    ).populate("owner", "name");

    if (!list) return res.status(404).send("List not found");

    io.to(user._id.toString()).emit("new-list", list);
    io.to(req.params.id).emit("list-updated", list);

    res.json(list);
});

// ================= ITEMS =================

app.get("/items/:listId", authMiddleware, async (req, res) => {
    const items = await Item.find({ listId: req.params.listId });
    res.json(items);
});

app.post("/items", authMiddleware, async (req, res) => {
    const name = req.body.name?.trim();
    if (!name) {
        return res.status(400).send("Item name is required");
    }

    const item = await Item.create(req.body);

    io.to(req.body.listId).emit("new-item", item);

    res.json(item);
});

app.delete("/items/:id", authMiddleware, async (req, res) => {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (item?.listId) {
        io.to(item.listId.toString()).emit("delete-item", item._id);
    }

    res.sendStatus(200);
});

// ================= START =================

mongoose.connect("mongodb://mongo:27017/buybuddy");

server.listen(3000, () => {
    console.log("Backend running on 3000");
});