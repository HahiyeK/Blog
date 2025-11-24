require('dotenv').config({ path: '.env', override: false });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const Post = require('../models/Post');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Project = require('../models/Project');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hahiyekoko09_db_user:z74erY1p5bLBJDeC@personal-blog.nciaftc.mongodb.net/?appName=personal-blog';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ACCESS_KEY = process.env.ACCESS_KEY || '102258';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await Profile.countDocuments();
        if (count === 0) {
            await Profile.create({});
            console.log('Default profile created');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// API Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, accessKey } = req.body;

        console.log('=== Register attempt ===');
        console.log('Received:', { username, email, password: password ? '***' : 'missing', accessKey });

        if (!username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        if (accessKey !== ACCESS_KEY) {
            console.log('Invalid access key:', accessKey, 'Expected:', ACCESS_KEY);
            return res.status(403).json({ message: 'Invalid access key' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        console.log('Creating new user...');
        const user = new User({
            username,
            email,
            password
        });

        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser._id);

        const token = jwt.sign(
            { id: savedUser._id, username: savedUser.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Registration successful for user:', savedUser.username);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { 
                id: savedUser._id, 
                username: savedUser.username, 
                email: savedUser.email 
            }
        });
    } catch (error) {
        console.error('=== Registration Error ===');
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Full error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        
        res.status(500).json({ message: 'Error registering user: ' + error.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Login attempt:', { username });

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful:', user._id);

        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Error logging in: ' + error.message });
    }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying token' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Get Profile
app.get('/api/profile', async (req, res) => {
    try {
        const profile = await Profile.findOne();
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Profile (Protected)
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const profile = await Profile.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get All Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Post (Protected)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const newPost = new Post(req.body);
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete Post (Protected)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all skills
app.get('/api/skills', async (req, res) => {
    try {
        const skills = await Skill.find().sort({ category: 1, name: 1 });
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add skill (Protected)
app.post('/api/skills', authenticateToken, async (req, res) => {
    try {
        const skill = new Skill(req.body);
        const savedSkill = await skill.save();
        res.status(201).json(savedSkill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete skill (Protected)
app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Skill deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add project (Protected)
app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const project = new Project(req.body);
        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update project (Protected)
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete project (Protected)
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fallback route - serve index.html for SPA routing
app.get('*', (req, res) => {
    const ext = path.extname(req.path);
    if (!ext || ext === '.html') {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    } else {
        res.status(404).send('Not found');
    }
});

module.exports = app;
