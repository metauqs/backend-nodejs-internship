const products = [
  { id: 1, name: "Keyboard", price: 50, stock: 10 },
  { id: 2, name: "Mouse", price: 25, stock: 4 },
  { id: 3, name: "Monitor", price: 200, stock: 7 }
];

class ShoppingCart {
  constructor(catalog) {
    this.catalog = catalog;
    this.items = [];
  }

  // add a product
  addToCart(productId, quantity) {
    let product = null;
    for (let i = 0; i < this.catalog.length; i++) {
      if (this.catalog[i].id === productId) {
        product = this.catalog[i];
        break;
      }
    }

    if (!product) {
      console.log("Product not found");
      return;
    }

    let existingItem = null;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].productId === productId) {
        existingItem = this.items[i];
        break;
      }
    }

    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + quantity > product.stock) {
      console.log(`Not enough stock for ${product.name}`);
      return;
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productId: productId, quantity: quantity });
    }
  }

  // remove a product
  removeFromCart(productId) {
    const newItems = [];
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].productId !== productId) {
        newItems.push(this.items[i]);
      }
    }
    this.items = newItems;
  }

  // change the quantity of an existing cart item
  updateQuantity(productId, quantity) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].productId === productId) {
        this.items[i].quantity = quantity;
        break;
      }
    }
  }

  // calculate the total price of all cart items
  getCartTotal() {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      let product = null;
      for (let j = 0; j < this.catalog.length; j++) {
        if (this.catalog[j].id === item.productId) {
          product = this.catalog[j];
          break;
        }
      }

      total = total + product.price * item.quantity;
    }
    return total;
  }

  // apply a percentage discount to the total
  applyDiscount(percent) {
    const total = this.getCartTotal();
    return total - (total * percent) / 100;
  }

  // return a complete summary of the cart
  getCartSummary() {
    const items = [];
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      let product = null;
      for (let j = 0; j < this.catalog.length; j++) {
        if (this.catalog[j].id === item.productId) {
          product = this.catalog[j];
          break;
        }
      }

      items.push({
        name: product.name,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      });
    }

    return {
      items: items,
      total: this.getCartTotal()
    };
  }
}

const cart = new ShoppingCart(products);
cart.addToCart(1, 2);
cart.addToCart(2, 3);
cart.addToCart(1, 1);

console.log("Cart summary:", cart.getCartSummary());
console.log("Cart total:", cart.getCartTotal());
console.log("Total after 10% discount:", cart.applyDiscount(10));

cart.updateQuantity(2, 4);
console.log("After updating mouse quantity:", cart.getCartSummary());

cart.removeFromCart(1);
console.log("After removing keyboard:", cart.getCartSummary());

cart.addToCart(3, 100);