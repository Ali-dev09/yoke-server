import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import Product from '../schemas/Product.mjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

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
  console.log(username, password, secret)

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
      const productId = req.params.productId;
      if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid product ID format' });
      }

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // If admin wants to update the image
      if (req.body.image) {
        // Delete old image from ImageKit if it has a fileId
        if (product.imageId) {
          await imagekit.deleteFile(product.imageId);
        }

        // Upload new image
        const uploadResponse = await imagekit.upload({
          file: req.body.image, // base64 string or file
          fileName: `${product.id}`
        });

        product.image = uploadResponse.url;
        product.imageId = uploadResponse.fileId; // save fileId for future deletions
      }

      // Update other fields
      const fieldsToUpdate = ['name','price','description','origin','hasSizes','sizes','category','stock'];
      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) product[field] = req.body[field];
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
      res.status(500).json({ error: 'Server error', details: err.message }
                           );
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






export default router;
