const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Your Name Here'
    },
    about: {
        type: String,
        default: 'Welcome to my personal blog. I\'m a passionate developer creating beautiful web applications and sharing my journey in tech.'
    },
    bio: {
        type: String,
        default: 'Welcome to my personal blog.'
    },
    status: {
        type: String,
        default: 'Exploring & Creating'
    },
    image: {
        type: String, // Base64
        default: null
    },
    github: String,
    linkedin: String,
    twitter: String,
    email: String
});

profileSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
    }
});

module.exports = mongoose.model('Profile', profileSchema);
