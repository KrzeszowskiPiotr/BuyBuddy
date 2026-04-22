import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log("HEADERS:", req.headers);

    const token = req.headers.authorization;

    if (!token) {
        console.log("NO TOKEN");
        return res.status(401).send("No token");
    }

    if (token !== "fake-jwt") {
        console.log("BAD TOKEN:", token);
        return res.status(401).send("Invalid token");
    }

    console.log("✅ AUTH OK");

    next();
};