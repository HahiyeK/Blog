require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hahiyekoko09_db_user:z74erY1p5bLBJDeC@personal-blog.nciaftc.mongodb.net/?appName=personal-blog';

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
        mongoose.disconnect();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Make sure MongoDB is running on your system.');
        process.exit(1);
    });
