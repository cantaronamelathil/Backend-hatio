import User from "./userModel.js";
import bcrypt from "bcryptjs";
import jwt from  "jsonwebtoken";
import {errorHandler} from "./utils/error.js";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
const { compareSync } = bcrypt;
dotenv.config()
// export const signup=async(req,res,next)=>{
//     const{username,email,password}=req.body;
//     const hashPassword = bcrypt.hashSync(password,10);
//     const user=new User({
//         username,
//         email,
//         password:hashPassword,});
//     try{
//       await user.save();
//       res.status(200).json(user)
//     }catch(error){
//         next(error)
//     }
// };

export const signup = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use.' });
        }

        // Hash the password
        const hashPassword = bcrypt.hashSync(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashPassword,
        });

        // Save the user to the database
        await user.save();

        // Generate a JWT token after successful signup
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Return success response along with the token
        res.status(200).json({
            message: 'User created successfully!',
            user: {
                username: user.username,
                email: user.email,
            },
            token,  // Include token in the response
        });
    } catch (error) {
        // Pass error to error handling middleware
        next(error);
    }
};


// export const signin = async(req,res,next)=>{
//     const {email,password}=req.body;
//     try{
//         const validUser = await User.findOne({email});
//         if(!validUser)return next(errorHandler(403,"Invalid Credentials"));
//             const validPassword = bcrypt.compareSync(password,validUser.password);
//         if(!validPassword)return next(errorHandler(404,'user not found'));
//             const token=jwt.sign({id:validUser._id},process.env.JWT_SECRET);
//         res
//             .cookie("access_token",token,{httpOnly:true})
//             .status(200)
//             .json({
//                 message: "Login successful",
//                 user: { username: validUser.username, email: validUser.email, },
//                 token: token,
//             });

//     }catch(error){
//         next(error)
//     }
// };

// worked
export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        
        const validUser = await User.findOne({ email });
        // Let's add detailed logging
        console.log('Login attempt:', {
            providedPassword: password,
            storedHash: validUser.password,
            matchResult: bcrypt.compare(password, validUser.password)
        });

        const validPassword = bcrypt.compare(password, validUser.password);
        
        if (!validPassword) {
            return res.status(401).json({ mesg: "Wrong credentials!" });
        }


        // Generate token
        const token = jwt.sign(
            { id: validUser._id }, 
            process.env.JWT_SECRET
        );

        // Remove password from response
        const { password: pass, ...rest } = validUser._doc;

        // Send response with cookie
        res
            .cookie('access_token', token, { httpOnly: true })
            .status(200)
            .json({
                token,
                user: rest
            });

    } catch (error) {
        res.status(500).json({ mesg: "Internal server error" });
    }
};
  

  export const logout = async(req,res,next)=>{
    try{
        res.clearCookie("access_token").status(200).json("user has been logged out");
    }
      catch(error){
        next(error);
    }
  
  }


export const listTodo = async (req, res, next) => {
    try {
        const userID = req.user?.id;
        const user = await User.findById(userID);
        if (!user) return next(errorHandler(404, "User not found"));

        res.status(200).json({
            message: "Tasks fetched successfully",
            username: user.username,
            tasks: user.tasks
        });
    } catch (error) {
        next(error);
    }
};

export const createTodo = async (req, res, next) => {
    try {
        const userID = req.user?.id;
        const { text } = req.body;
        
        const user = await User.findById(userID);
        if (!user) return next(errorHandler(404, "User not found"));
        if (!text) return next(errorHandler(400, "Text is required"));

        user.tasks.push({ text });
        await user.save();

        res.status(201).json({
            message: "Task created successfully",
            tasks: user.tasks
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTodo = async (req, res, next) => {
    try {
        const userID = req.user?.id;
        const { todoID } = req.params;
        
        const user = await User.findById(userID);
        if (!user) return next(errorHandler(404, "User not found"));

        user.tasks = user.tasks.filter(task => task._id.toString() !== todoID);
        await user.save();

        res.status(200).json({
            message: "Task deleted successfully",
            tasks: user.tasks
        });
    } catch (error) {
        next(error);
    }
};

export const editTodo = async (req, res, next) => {
    try {
        const userID = req.user?.id;
        const { todoID } = req.params;
        const { text } = req.body;

        const user = await User.findById(userID);
        if (!user) return next(errorHandler(404, "User not found"));

        const updatedTasks = user.tasks.map(task => {
            if (task._id.toString() === todoID) {
                task.text = text;
            }
            return task;
        });

        user.tasks = updatedTasks;
        await user.save();

        res.status(200).json({
            message: "Task updated successfully",
            tasks: user.tasks
        });
    } catch (error) {
        next(error);
    }
};

export const updatetodo = async (req, res, next) => {
    try {
        const userID = req.user?.id;
        const { todoID } = req.params;
        const { completed } = req.body;

        const user = await User.findById(userID);
        if (!user) return next(errorHandler(404, "User not found"));

        const updatedTasks = user.tasks.map(task => {
            if (task._id.toString() === todoID) {
                task.completed = completed;
            }
            return task;
        });

        user.tasks = updatedTasks;
        await user.save();

        res.status(200).json({
            message: "Task status updated successfully",
            tasks: user.tasks
        });
    } catch (error) {
        next(error);
    }
};



export const summaryCreate = async (req, res) => {
    try {
        const userID = req.user?.id;
        const { projectTitle,token } = req.body;
        
        // Use environment variable for GitHub token
        
    
        
        if (!token) {
            return res.status(400).json({ error: 'GitHub token is required' });
        }

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const pendingTodos = user.tasks
            .filter(task => !task.completed)
            .map(task => task.text);

        const completedTodos = user.tasks
            .filter(task => task.completed)
            .map(task => task.text);

        const totalTasks = user.tasks.length;
        const completedTasksCount = completedTodos.length;
        const completionRate = totalTasks > 0 
            ? Math.round((completedTasksCount / totalTasks) * 100) 
            : 0;

        const summary = `Project completion rate: ${completionRate}% (${completedTasksCount}/${totalTasks} tasks completed)`;

        const content = `
        # ${projectTitle}
            
        ${summary}
            
        ## Pending Todos

        ${pendingTodos.map((todo) => `- [ ] ${todo}`).join('\n')}
            
        ## Completed Todos

        ${completedTodos.map((todo) => `- [x] ${todo}`).join('\n')}`;

        const response = await axios.post(
            'https://api.github.com/gists',
            {
                description: `Todo Summary for ${projectTitle}`,
                files: {
                    [`${projectTitle}-summary.md`]: { content },
                },
                public: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.status(200).json({ 
            gistUrl: response.data.html_url,
        });

    } catch (error) {
        console.error('Summary generation error:', error);
        return res.status(500).json({ 
            error: 'Failed to create summary',
            details: error.message 
        });
    }
};




export const exportSummaryLocally = async (req, res) => {
    try {
        const userID = req.user?.id;
        console.log('request:',req.body)
        console.log('Request Headers:', req.headers);
        const { projectTitle } = req.body;
        if (!projectTitle) {
            return res.status(400).json({ 
                error: 'Project title is required',
                receivedBody: req.body 
            });
        }
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const pendingTodos = user.tasks
            .filter(task => !task.completed)
            .map(task => task.text);

        const completedTodos = user.tasks
            .filter(task => task.completed)
            .map(task => task.text);

        const totalTasks = user.tasks.length;
        const completedTasksCount = completedTodos.length;
        const completionRate = totalTasks > 0 
            ? Math.round((completedTasksCount / totalTasks) * 100) 
            : 0;

        const summary = `Project completion rate: ${completionRate}% (${completedTasksCount}/${totalTasks} tasks completed)`;

        const content = `# ${projectTitle}
            
${summary}
            
## Pending Todos

${pendingTodos.map((todo) => `- [ ] ${todo}`).join('\n')}
            
## Completed Todos

${completedTodos.map((todo) => `- [x] ${todo}`).join('\n')}`;

        // Create a summaries directory if it doesn't exist
        const summariesDir = path.join(process.cwd(), 'summaries');
        await fs.mkdir(summariesDir, { recursive: true });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${projectTitle}-${timestamp}.md`;
        console.log('filepath:', filename)
        const filepath = path.join(summariesDir, filename);

        // Write the markdown file
        await fs.writeFile(filepath, content, 'utf8');

        return res.status(200).json({ 
            message: 'Summary exported successfully',
            filepath: filepath
        });

    } catch (error) {
        console.error('Summary export error:', error);
        return res.status(500).json({ 
            error: 'Failed to export summary',
            details: error.message 
        });
    }
};