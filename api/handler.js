require('dotenv').config({ path: '.env', override: false });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

let app;

async function initializeApp() {
    if (app) return app;

    app = express();

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hahiyekoko09_db_user:z74erY1p5bLBJDeC@personal-blog.nciaftc.mongodb.net/?appName=personal-blog';
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
    const ACCESS_KEY = process.env.ACCESS_KEY || '102258';
    const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret';

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Connect to MongoDB once
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(MONGODB_URI, { 
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000 
            });
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err.message);
        }
    }

    // Serve static files
    app.use(express.static(path.join(__dirname, '..')));

    // Simple health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
    });

    // Fallback - serve index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    });

    return app;
}

module.exports = async (req, res) => {
    try {
        const app = await initializeApp();
        app(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
