import express from 'express';
import NewProduct from '../schemas/Product.mjs';
import ImageKit from "imagekit";
import Product from '../schemas/Products.mjs';
const escapeStringRegexp = (await import('escape-string-regexp')).default;

const router = express.Router();

// إعداد ImageKit
const imagekit = new ImageKit({
  publicKey: 'public_e8C36zxt8yS/VbH1AehiM/ubTo4=',
  privateKey: 'private_zL4Pmw+kwXnx/FcUg+0/9xzFjKg=',
  urlEndpoint: 'https://ik.imagekit.io/fh8ayieth9'
});

// إضافة منتج جديد
router.post('/add/product', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }
    const uploadedImage = req.body.image;
    const upladres = await imagekit.upload({
      file: uploadedImage,
      fileName: req.body.name,
      folder:'products'
    })
    const imageUrl = upladres.url;
    let product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: imageUrl,
      origin: req.body.origin,
      hasSizes: req.body.hasSizes,
      sizes: req.body.sizes,
      category: req.body.category,
    })
    await product.save();
    res.status(201).json({
      message: 'Product added successfully',
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        image: imageUrl ,
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

// جميع المنتجات
router.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// منتجات للاستكشاف (10 بس)
router.get('/products/explore', async (req, res) => {
  try {
    const products = await Product.find().limit(10);
    res.json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// حسب الفئة
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
    'أخرى',
    "الكل",
    "ادوات احتياطية كاملة"
  ];

  try {
    const categoryName = req.params.categoryName;
    if (!allowedCategories.includes(categoryName)) {
      return res.status(400).json({ error: 'Invalid category name' });
    }
    const products = await Product.find({ category: categoryName });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// منتج واحد حسب ID
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// البحث
router.get('/search/:searchValue', async (req, res) => {
  try {
    const searchValue = decodeURIComponent(req.params.searchValue);
    console.log(searchValue);

    if (!searchValue || typeof searchValue !== 'string') {
      return res.status(400).json({ error: 'Invalid search value' });
    }

    const sanitizedSearch = escapeStringRegexp(searchValue);
    const searchRegex = new RegExp(sanitizedSearch, 'iu');

    const products = await Product.find({
      name: { $regex: searchRegex }
    }).limit(20);

    res.json(products);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// المنتجات بدون صور (للتجربة)
router.get('/products/name', async (req, res) => {
  try {
    const products = await Product.find({}, { image: 0 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ تحويل صورة منتج واحد من Base64 إلى ImageKit 

router.get('/convert', async (req, res) => {
  try {
    const converteds = [];
    const products = await NewProduct.find();
    console.log(`📦 Found ${products.length} products`);

    for (const product of products) {
      if (!product.image) continue;

      try {
        const base64Data = product.image.includes(',')
          ? product.image.split(',')[1]
          : product.image;

        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imageName = `${product._id}`;

        const uploadRes = await imagekit.upload({
          file: imageBuffer,
          fileName: imageName,
          folder: 'yokestore_products'
        });

        // Create a product object for response only
        const productData = {
          name: product.name,
          price: product.price,
          description: product.description,
          image: uploadRes.url,
          imageId: uploadRes.fileId,
          origin: product.origin,
          hasSizes: product.hasSizes,
          sizes: product.sizes,
          category: product.category,
          stock: product.stock
        };

        converteds.push(productData);
        const updatedproduct = new Product(productData);
        await updatedproduct.save();
        console.log(`📸 Converted image for ${product.name}: ${uploadRes.url}`);
      } catch (err) {
        console.error(`❌ Failed to convert product ${product._id}:`, err);
      }
    }

    res.json({ 
      message: 'Conversion completed', 
      products: converteds
    });

  } catch (err) {
    console.error("❌ Conversion error:", err);
    res.status(500).json({ error: "Server error", details: err.message }  
                                );
  }
});

router.get('/update-fileIds', async (req, res) => {
  try {
    const products = await NewProduct.find();
    console.log(`📦 Found ${products.length} products`);

    const updatedProducts = [];

    for (const product of products) {
      if (!product.image || !product.image.url) continue;

      try {
        // 1️⃣ Download existing image
        const response = await fetch(product.image.url);
        const buffer = Buffer.from(await response.arrayBuffer());

        // 2️⃣ Upload to ImageKit to get fileId
        const uploadRes = await imagekit.upload({
          file: buffer,
          fileName: `${product._id}.png`,
          folder: 'yokestore_products'
        });

        // 3️⃣ Update product with new fileId (and optional new URL)
        product.image.fileId = uploadRes.fileId;
        product.image.url = uploadRes.url; // optional
        await product.save();

        updatedProducts.push({
          name: product.name,
          url: product.image.url,
          fileId: product.image.fileId
        });

        console.log(`✅ Updated ${product.name}`);
      } catch (err) {
        console.error(`❌ Failed ${product.name}:`, err);
      }
    }

    res.json({
      message: 'All products updated with fileId',
      updatedProducts
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});



export default router;


