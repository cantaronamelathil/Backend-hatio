import express from "express";
import {signup,signin,listTodo,createTodo,updatetodo,deleteTodo,editTodo,logout,summaryCreate,exportSummaryLocally} from "./userController.js"
// import { verifyToken } from "./utils/verifyUser.js";
import {verifyToken} from "./utils/middleware.js"
const router=express.Router();

router.post("/signup",signup)
router.post("/signin",signin)
router.post("/logout",verifyToken,logout)
router.get('/listTodo', verifyToken, listTodo);
router.post('/createTodo', verifyToken, createTodo);
router.delete('/deleteTodo/:todoID', verifyToken, deleteTodo);
router.put('/editTodo/:todoID', verifyToken, editTodo);
router.patch('/updateTodo/:todoID', verifyToken, updatetodo);
 router.post('/summarycreate', verifyToken, summaryCreate);
router.post('/export-summary', verifyToken, exportSummaryLocally);
export default router;