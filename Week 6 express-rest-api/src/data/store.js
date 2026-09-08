
const { v4: uuidv4 } = require('uuid');

let products = [
  {
    id: uuidv4(),
    name: 'Wireless Mouse',
    price: 19.99,
    quantity: 150,
    category: 'electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Mechanical Keyboard',
    price: 79.5,
    quantity: 60,
    category: 'electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

module.exports = {
  get products() {
    return products;
  },
  set products(next) {
    products = next;
  },
  generateId: () => uuidv4(),
};
