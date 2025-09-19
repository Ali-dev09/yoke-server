import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv'
import NewProduct from './schemas/Product.mjs'
import productsRoute from './routers/products.mjs'
import adminRoute from './routers/admin.mjs'



dotenv.config()
const port = process.env.PORT || 3000;
const app = express();
const allowedHosts = true

app.use(cors({
  origin: true,
  credentials: true
}));



app.use(express.json({ limit: '50mb' }));



async function connectDBprev() {
  try {
    await mongoose.connect(process.env.URI);
    console.log('Connected to databse with end of true MongoDB ');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
}


connectDBprev();






app.use(productsRoute)
app.use(adminRoute)
// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});