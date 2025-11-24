const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['image', 'document']
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    file: {
        type: String, // Base64 string
        required: true
    },
    originalFilename: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for formatted date to match existing frontend expectation if needed,
// but we can handle formatting in the frontend.
postSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
    }
});

module.exports = mongoose.model('Post', postSchema);
