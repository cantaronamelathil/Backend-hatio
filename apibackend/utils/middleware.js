import jwt from "jsonwebtoken";
import { errorHandler } from "./error.js";

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) {
        return next(errorHandler(401, "Access Denied: No Token Provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded token payload to req.user
        next();
    } catch (err) {
        return next(errorHandler(403, "Invalid or Expired Token"));
    }
};