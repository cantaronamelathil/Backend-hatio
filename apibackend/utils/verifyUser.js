import { errorHandler } from "./error.js";
import jwt from "jsonwebtoken";

export const verifyToken = (req,res,next)=>{
    const token=req.cookies?.access_token;
    console.log("Token:", token);
    if(!token)return next(errorHandler(404,"you are not authorised"));
    console.log("No token found in cookies.");
    jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if(err)return next(errorHandler(404,"forbidden"));
        console.log("JWT verification failed:", err.message);
        req.user=user;
        next();
    })
};




// import { errorHandler } from "./error.js";
// import jwt from "jsonwebtoken";

// export const verifyToken = (req, res, next) => {
//     const token = req.cookies?.access_token;
    
//     if (!token) {
//         console.log("Token not found in cookies.");
//         return next(errorHandler(401, "You are not authorised"));
//     }

//     console.log("Token found:", token);

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             console.log("JWT verification failed:", err.message);
//             return next(errorHandler(403, "Forbidden"));
//         }

//         console.log("Decoded user from JWT:", user);
//         req.user = user;  // Attach the user info from JWT to req.user
//         next();
//     });
// };
