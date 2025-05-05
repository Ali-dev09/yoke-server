
import express from 'express'
import NewProduct from '../schemas/Product.mjs'
const escapeStringRegexp = (await import('escape-string-regexp')).default;

const router = express.Router()

router.post('/add/product', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }
    const product = new NewProduct(req.body);
    await product.save();
    res.status(201).json({
      message: 'Product added successfully',
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image ? 'Image uploaded' : null,
        sizes: product.sizes
      }
    });
  } catch (err) {
    console.error('Error adding product:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation error', details: errors });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/api/products', async (req, res) => {
  try {
    const products = await NewProduct.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message })
  }
});

router.get('/products/explore', async (req, res) => {
  try {
    const products = await NewProduct.find().limit(10);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/category/:categoryName', async (req, res) => {
  const allowedCategories = [
    'ادوات احتياطية مولدات',
    'ادوات احتياطية 5 كي في',
    'ادوات احتياطية كامة',
    'ادوات احتياطية زراعي',
    'ادوات احتياطية حاشوشة',
    'ادوات احتياطية ميشار',
    'ماطور غسالة',
    'ماطور ماء',
    'أخرى'
  ];

  try {
    const categoryName = req.params.categoryName;
    if (!allowedCategories.includes(categoryName)) {
      return res.status(400).json({ error: 'Invalid category name' });
    }
    const products = await NewProduct.find({ category: categoryName });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    const product = await NewProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product endpoint



router.get('/search/:searchValue', async (req, res) => {
  try {
     const searchValue = decodeURIComponent(req.params.searchValue);
    console.log(searchValue)

    if (!searchValue || typeof searchValue !== 'string') {
      return res.status(400).json({ error: 'Invalid search value' });
    }

    // Escape and use regex for case-insensitive, unicode-aware search
    const sanitizedSearch = escapeStringRegexp(searchValue);
    const searchRegex = new RegExp(sanitizedSearch, 'iu');

    const products = await NewProduct.find({
      name: { $regex: searchRegex }
    }).limit(20);

    res.json(products);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/products/name',async (req,res) => {
  const products = await NewProduct.find({} , {image:0})
  res.json(products)
})


export default router;
