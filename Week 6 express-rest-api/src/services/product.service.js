const store = require('../data/store');
const ApiError = require('../utils/ApiError');


const getAll = ({ category, minPrice, maxPrice } = {}) => {
  let results = store.products;

  if (category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === String(category).toLowerCase()
    );
  }
  if (minPrice !== undefined) {
    const min = Number(minPrice);
    results = results.filter((p) => p.price >= min);
  }
  if (maxPrice !== undefined) {
    const max = Number(maxPrice);
    results = results.filter((p) => p.price <= max);
  }

  return results;
};

const getById = (id) => {
  const product = store.products.find((p) => p.id === id);
  if (!product) {
    throw ApiError.notFound(`Product with id '${id}' not found`);
  }
  return product;
};

const create = (data) => {
  const duplicate = store.products.some(
    (p) => p.name.toLowerCase() === data.name.toLowerCase()
  );
  if (duplicate) {
    throw ApiError.conflict(`Product with name '${data.name}' already exists`);
  }

  const now = new Date().toISOString();
  const newProduct = {
    id: store.generateId(),
    name: data.name,
    price: data.price,
    quantity: data.quantity,
    category: data.category || 'uncategorized',
    createdAt: now,
    updatedAt: now,
  };

  store.products = [...store.products, newProduct];
  return newProduct;
};

const replace = (id, data) => {
  const index = store.products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw ApiError.notFound(`Product with id '${id}' not found`);
  }

  const duplicate = store.products.some(
    (p) => p.id !== id && p.name.toLowerCase() === data.name.toLowerCase()
  );
  if (duplicate) {
    throw ApiError.conflict(`Product with name '${data.name}' already exists`);
  }

  const updated = {
    ...store.products[index],
    name: data.name,
    price: data.price,
    quantity: data.quantity,
    category: data.category || 'uncategorized',
    updatedAt: new Date().toISOString(),
  };

  const next = [...store.products];
  next[index] = updated;
  store.products = next;
  return updated;
};

const update = (id, data) => {
  const index = store.products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw ApiError.notFound(`Product with id '${id}' not found`);
  }

  if (data.name) {
    const duplicate = store.products.some(
      (p) => p.id !== id && p.name.toLowerCase() === data.name.toLowerCase()
    );
    if (duplicate) {
      throw ApiError.conflict(`Product with name '${data.name}' already exists`);
    }
  }

  const updated = {
    ...store.products[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const next = [...store.products];
  next[index] = updated;
  store.products = next;
  return updated;
};

const remove = (id) => {
  const exists = store.products.some((p) => p.id === id);
  if (!exists) {
    throw ApiError.notFound(`Product with id '${id}' not found`);
  }
  store.products = store.products.filter((p) => p.id !== id);
};

module.exports = { getAll, getById, create, replace, update, remove };
