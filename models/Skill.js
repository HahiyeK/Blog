const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['frontend', 'backend', 'tools', 'other'],
            default: 'other'
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
