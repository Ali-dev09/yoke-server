import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    default: 'No description provided',
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  origin: {
    type: String,
    default: 'Unknown origin',
    trim: true
  },
  hasSizes: {
    type: Boolean,
    default: false
  },
  sizes: {
    type: [String],
    default: [],
    validate: {
      validator: function(sizes) {
        return !this.hasSizes || sizes.length > 0;
      },
      message: 'At least one size is required when hasSizes is true'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  stock: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const NewProduct = mongoose.model('NewProduct', productSchema);


export default NewProduct