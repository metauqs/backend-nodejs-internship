const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
});

const Feed = mongoose.model('Feed', feedSchema);

module.exports = Feed;