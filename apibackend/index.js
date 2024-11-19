import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./userRouter.js";
import {verifyToken} from "./utils/middleware.js";

dotenv.config()
try{
    await mongoose.connect(process.env.MONGO_URL)
    console.log("mongodb connect succesfully")

}catch(error){
    console.log(error)
}

const app=express()
app.use(cors({
    origin: 'http://localhost:3000', // Frontend URL (React default port)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true, // Enable cookies if needed
  }));

app.use(cookieParser())
app.use(express.json())


app.use("/api/user",userRouter)

app.use((err,req,res,next)=>{
    const statuscode=err.statuscode ||500
    const mesg=err.message || "something went worng on bakend"
    return res.status(statuscode).json({
        success:false,
        statuscode,
        mesg,
    })
})
app.listen(8000,()=>{
    console.log("server is connected at port 8000")
})