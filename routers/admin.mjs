import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import Product from '../schemas/Products.mjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import ImageKit from "imagekit";

dotenv.config()

const imagekit = new ImageKit({
  publicKey: process.env.PUBLICKEY,
  privateKey: process.env.PRIVATEKEY,
  urlEndpoint: process.env.URLENDPOINT
});

const router = express.Router()



function checkAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Split and get the token part
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Assuming you're using a secret for JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Add your JWT secret here
    req.user = decoded; // Add decoded data to the request object if needed
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

//leaderstore
//$2a$20$vyDuPmYb6N9yZVDNJckcneb7TRD2wWMQOnM98SlfZko8B7MhUDRJy

//mohqa-c$%
//$2y$19$a3pTYbYTQNJYZSYFwGnQ/OdzKcpkF8XimFd5SYOnEE/Ik4ezNqxea


//lightbeans
//$2y$19$v/3.T3biPChhL2m0N54P9.JItu2HA8iJfoWDCtNt7HulMVh2dhfrO

const secretKey = process.env.JWT

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  secret: String
});


const Admin = mongoose.model('Admin', adminSchema);



router.post('/admin/login', async (req, res) => {
  const { username, password, secret } = req.body;
  

  if (!username || !password || !secret) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 🔧 Compare input with stored hashed password and secret
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    const isSecretValid = await bcrypt.compare(secret, admin.secret);

    if (!isPasswordValid || !isSecretValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }else{
    const token = jwt.sign({ username: admin.username }, secretKey, { expiresIn: '30m' })
    res.json({ message: 'Login successful', token: token });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/products', async (req, res) =>{
  try{
    const products = await Product.find({} , {name:1 , category:1})
    res.json(products)
  }catch(err){
    res.status(500).json({message: 'server error'})
  }
})



router.put('/product/:productId', async (req, res) => {
  try {
    const formData = req.body;
    const productId = req.params.productId;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // 🔁 Handle image update only if a new image is provided and it’s different
    if (formData.image && formData.image !== product.image) {
      // 🗑 Delete old image from ImageKit
      if (product.imageId) {
        try {
          await imagekit.deleteFile(product.imageId);
        } catch (err) {
          console.warn("Failed to delete old image from ImageKit:", err.message);
        }
      }

      // ⬆️ Upload new image
      const uploadResponse = await imagekit.upload({
        file: formData.image, // base64 string
        fileName: `${productId}`,
        folder:"yokestore-_products"
      });

      product.image = uploadResponse.url;
      product.imageId = uploadResponse.fileId;
    }

    // 📝 Update other fields
    const fieldsToUpdate = [
      'name', 'price', 'description', 'origin', 'hasSizes',
      'sizes', 'category', 'stock'
    ];

    fieldsToUpdate.forEach(field => {
      if (formData[field] !== undefined) {
        product[field] = formData[field];
      }
    });

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: err.message });
    }
    console.error("Update error:", err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Delete product endpoint
router.delete('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



router.get('/admin/products' , async (req, res) =>{
  const products = await  Product.find({} , {_id:1})
  res.json(products)
})


export default router;
