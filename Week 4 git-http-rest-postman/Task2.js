const products = [
  { id: 1, name: "Keyboard", price: 50, stock: 10 },
  { id: 2, name: "Mouse", price: 25, stock: 4 },
  { id: 3, name: "Monitor", price: 200, stock: 7 }
];

// add a new product
function addProduct(productList, newProduct) {
  const result = [];
  for (let i = 0; i < productList.length; i++) {
    result.push(productList[i]);
  }
  result.push(newProduct);
  return result;
}

// update product stock
function updateStock(productList, id, newStock) {
  const result = [];
  for (let i = 0; i < productList.length; i++) {
    const product = productList[i];
    if (product.id === id) {
      result.push({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: newStock
      });
    } else {
      result.push(product);
    }
  }
  return result;
}

// update product price
function updatePrice(productList, id, newPrice) {
  const result = [];
  for (let i = 0; i < productList.length; i++) {
    const product = productList[i];
    if (product.id === id) {
      result.push({
        id: product.id,
        name: product.name,
        price: newPrice,
        stock: product.stock
      });
    } else {
      result.push(product);
    }
  }
  return result;
}

// remove a product by id
function removeProduct(productList, id) {
  const result = [];
  for (let i = 0; i < productList.length; i++) {
    if (productList[i].id !== id) {
      result.push(productList[i]);
    }
  }
  return result;
}

// search products by name
function searchByName(productList, name) {
  const result = [];
  const searchTerm = name.toLowerCase();
  for (let i = 0; i < productList.length; i++) {
    const productName = productList[i].name.toLowerCase();
    if (productName.includes(searchTerm)) {
      result.push(productList[i]);
    }
  }
  return result;
}

// return products below a given stock quantity
function getLowStock(productList, threshold) {
  const result = [];
  for (let i = 0; i < productList.length; i++) {
    if (productList[i].stock < threshold) {
      result.push(productList[i]);
    }
  }
  return result;
}

// calculate total inventory value
function getTotalValue(productList) {
  let total = 0;
  for (let i = 0; i < productList.length; i++) {
    total = total + productList[i].price * productList[i].stock;
  }
  return total;
}

let inventory = addProduct(products, { id: 4, name: "Webcam", price: 60, stock: 15 });
inventory = updateStock(inventory, 2, 12);
inventory = updatePrice(inventory, 1, 45);

console.log("Inventory after changes:", inventory);
console.log("Search 'mo':", searchByName(inventory, "mo"));
console.log("Low stock (below 10):", getLowStock(inventory, 10));
console.log("Total inventory value:", getTotalValue(inventory));

inventory = removeProduct(inventory, 3);
console.log("After removing id 3:", inventory);
console.log("Original products array unchanged:", products);