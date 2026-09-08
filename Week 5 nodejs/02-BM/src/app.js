const express = require('express');
const User = require('./models/user_model');
const app = express();

app.use(express.json());//middleware
//POST
app.post('/users', async (req, res) => {
  try {
    const data = req.body;
    const newUser = await User.create(data); 
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error creating user'});
  }
});
//GET
app.get('/users', async (req, res) => {
    try{
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users'});
    }
});
//PATCH
app.patch('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error updating user'});
    }
});
//DELETE
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully'});
    } catch (error) {
        res.status(400).json({ message: 'Error deleting user'});
    }
});
module.exports = app;