const express = require('express');
const app = express();

app.use(express.json());

const users = [];
app.post('/user', (req, res) => {
  users.push(req.body);
  res.json({ message: 'Data received successfully' });
});
// app.get('/', (req, res) => {
// req.body;
// });
app.get('/', (req, res) => {
  res.json(users);
});
app.delete('/user/:id', (req, res) => {
  const userId = req.params.id;
delete users[userId];
  res.json({ message: 'User deleted successfully' });
});


module.exports = app;