// src/controllers/voiceController.js
const productService = require('../services/productService'); // New Import

const searchByVoice = async (req, res) => {
  try {
    const { query, userId } = req.body;

    // Use the productService to search for products
    const results = await productService.searchProducts(query);

    res.json({
      success: true,
      data: {
        query,
        results
      }
    });
  } catch (error) {
    console.error('Voice search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Remove the hardcoded searchProducts function
// async function searchProducts(query) {
//   const products = [
//     { id: 1, name: 'Classic T-Shirt', category: 'Apparel', price: 25 },
//     { id: 2, name: 'Wireless Headphones', category: 'Electronics', price: 150 },
//     { id: 3, name: 'Coffee Mug', category: 'Home Goods', price: 15 },
//     { id: 4, name: 'Running Shoes', category: 'Footwear', price: 120 },
//     { id: 5, name: 'Leather Wallet', category: 'Accessories', price: 50 },
//     { id: 6, name: 'Smartwatch', category: 'Electronics', price: 250 },
//     { id: 7, name: 'Yoga Mat', category: 'Sports', price: 40 },
//     { id: 8, name: 'Desk Lamp', category: 'Home Goods', price: 60 },
//     { id: 9, name: 'Gaming Mouse', category: 'Electronics', price: 80 },
//     { id: 10, name: 'Sunscreen', category: 'Beauty', price: 20 }
//   ];

//   if (!query) {
//     return products;
//   }

//   const lowercasedQuery = query.toLowerCase();
//   return products.filter(product =>
//     product.name.toLowerCase().includes(lowercasedQuery) ||
//     product.category.toLowerCase().includes(lowercasedQuery)
//   );
// }


module.exports = {
  searchByVoice
};