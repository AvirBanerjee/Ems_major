import express from "express";
import dbconnect from "./config/dbconnect.js";
import User from "./models/user-model.js";
import Employ from "./models/employ.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import cors from "cors";


dotenv.config();

const app = express();

app.use(cors({
    origin: "*",
    credentials: true
  }));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DB connect
dbconnect();

//AUTH

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log(" Signup Request Body:", req.body);

        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            console.log(" Missing fields");
            return res.status(400).json({ error: "All fields required" });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(" User already exists:", email);
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            fullname: name,
            email,
            password: hashedPassword
        });

        console.log("User created:", user.email);

        res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (error) {
        console.log(" Signup Error:", error.message);
        res.status(500).json({
            error: error.message
        });
    }
});
// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET missing in .env");
        }

        const token = jwt.sign(
            { email: user.email, userid: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: "lax"
        });

        res.json({
            message: "Login successful",
            token
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//MIDDLEWARE

function isLoggedIn(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.user = data;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
//DASHBOARD 
app.get('/api/dashboard', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ email: req.user.email })
        .populate("employs");

    res.json({ user });
});

//Employ CRUD

// Create
app.post('/api/employ', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ email: req.user.email });

    const { fullname, email, completed, experience, isOnProject, description } = req.body;

    const employ = await Employ.create({
        fullname,
        email,
        completed: Number(completed),
        experience: Number(experience),
        isOnProject: Boolean(isOnProject),
        description
    });

    user.employs.push(employ._id);
    await user.save();

    res.status(201).json({
        message: "Employee created",
        employ
    });
});

// Get single
app.get('/api/employ/:id', isLoggedIn, async (req, res) => {
    const employ = await Employ.findById(req.params.id);

    if (!employ) {
        return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ employ });
});

// Update
app.put('/api/employ/:id', isLoggedIn, async (req, res) => {
    const { fullname, email, completed, experience, isOnProject, description } = req.body;

    const employ = await Employ.findByIdAndUpdate(
        req.params.id,
        {
            fullname,
            email,
            completed: Number(completed),
            experience: Number(experience),
            isOnProject: Boolean(isOnProject),
            description
        },
        { new: true }
    );

    res.json({
        message: "Employee updated",
        employ
    });
});

// Delete
app.delete('/api/employ/:id', isLoggedIn, async (req, res) => {
    const employ = await Employ.findByIdAndDelete(req.params.id);

    if (!employ) {
        return res.status(404).json({ error: "Employee not found" });
    }

    const user = await User.findOne({ email: req.user.email });

    user.employs.pull(req.params.id);
    await user.save();

    res.json({
        message: "Employee deleted"
    });
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});