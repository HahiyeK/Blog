require('dotenv').config({ path: '.env', override: false });
// Silently ignore missing .env file on production
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const Post = require('./models/Post');
const Profile = require('./models/Profile');
const User = require('./models/User');
const Skill = require('./models/Skill');
const Project = require('./models/Project');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hahiyekoko09_db_user:z74erY1p5bLBJDeC@personal-blog.nciaftc.mongodb.net/?appName=personal-blog';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ACCESS_KEY = process.env.ACCESS_KEY || '102258';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for Base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        // Initialize default profile if none exists
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

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, accessKey } = req.body;

        console.log('=== Register attempt ===');
        console.log('Received:', { username, email, password: password ? '***' : 'missing', accessKey });

        // Validate required fields
        if (!username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        // Validate access key
        if (accessKey !== ACCESS_KEY) {
            console.log('Invalid access key:', accessKey, 'Expected:', ACCESS_KEY);
            return res.status(403).json({ message: 'Invalid access key' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Create new user document
        console.log('Creating new user...');
        const user = new User({
            username,
            email,
            password
        });

        // Save user (this will trigger the pre-save hook to hash the password)
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser._id);

        // Generate JWT token
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
        
        // Better error message for duplicate key errors
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

        // Find user by username or email - need to explicitly select password field
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful:', user._id);

        // Generate JWT token
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

// Logout (client-side token removal, but endpoint for consistency)
app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Profile and Post Routes (Protected)

// API Routes

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
        // We assume there's only one profile, so we update the first one found
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
        // Transform dates to match frontend expectation if needed, 
        // but we'll handle date formatting on the frontend now to be cleaner.
        // However, to minimize frontend breakage, let's map it here or update frontend.
        // Let's send raw data and update frontend to format it.
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

// Skills Routes

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

// Projects Routes

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

// Fallback route - serve index.html for SPA routing (only for non-API, non-static routes)
app.get('*', (req, res) => {
    // Only serve index.html for actual page routes, not for static files
    const ext = path.extname(req.path);
    if (!ext || ext === '.html') {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).send('Not found');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
