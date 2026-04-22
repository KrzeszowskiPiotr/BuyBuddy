import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send("No token");
    }

    req.userId = token;

    next();
};