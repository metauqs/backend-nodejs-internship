const express = require('express');
const app = express();
const multer = require('multer');
const uploadToImagekit = require('./services/imagekit.storage.services');
const feedSchema = require('./models/feedSchema');
const upload = multer({ storage: multer.memoryStorage() });
//post
app.post('/upload', upload.single("image"), async (req, res) => {
console.log(req.body); console.log(req.file);
const result = await uploadToImagekit(req.file.buffer)
const post = await feedSchema.create({
    image: result.url,
    caption: req.body.caption
});
res.status(200).json({message: "Post created successfully", post: post})
})
 //get
app.get('/feed', async (req, res) => {
    const feed = await feedSchema.find();
    res.status(200).json({message: "Feed fetched successfully", feed: feed})
})
module.exports = app;