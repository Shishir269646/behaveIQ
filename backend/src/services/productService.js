// src/services/productService.js

/**
 * @file This service is a placeholder for a real product database or external product catalog service.
 * In a production application, this would typically interact with your e-commerce platform's API,
 * a dedicated product microservice, or a product information management (PIM) system.
 *
 * Current Implementation: Uses hardcoded mock data for demonstration and initial development purposes.
 *
 * To Integrate with a Real Product Source:
 * 1. Replace the 'products' array with calls to your external product API or database.
 * 2. Adjust 'searchProducts' and 'getProductById' to query the real data source.
 * 3. Consider caching mechanisms (e.g., using cacheService) for performance if frequently accessed.
 */

const products = [
    { id: 'prod1', name: 'Premium Wireless Headphones', category: 'Electronics', price: 199.99, description: 'High-fidelity sound with noise cancellation.' },
    { id: 'prod2', name: 'Ergonomic Office Chair', category: 'Furniture', price: 349.00, description: 'Designed for comfort and posture support.' },
    { id: 'prod3', name: 'Organic Green Tea (20 bags)', category: 'Groceries', price: 12.50, description: 'Sustainably sourced, rich in antioxidants.' },
    { id: 'prod4', name: 'Smart Home Hub', category: 'Electronics', price: 89.99, description: 'Connects all your smart devices for seamless control.' },
    { id: 'prod5', name: 'Ultra-Soft Bath Towel Set', category: 'Home Goods', price: 45.00, description: 'Luxurious and highly absorbent cotton towels.' },
    { id: 'prod6', name: 'Adventure Backpack', category: 'Outdoors', price: 75.00, description: 'Durable and spacious for all your travel needs.' },
    { id: 'prod7', name: 'Noise-Cancelling Earbuds', category: 'Electronics', price: 120.00, description: 'Compact design with powerful audio.' },
    { id: 'prod8', name: 'Digital Drawing Tablet', category: 'Electronics', price: 299.00, description: 'Precision drawing for digital artists.' },
];

const searchProducts = async (query) => {
    if (!query) {
        return products;
    }

    const lowercasedQuery = query.toLowerCase();
    return products.filter(product =>
        product.name.toLowerCase().includes(lowercasedQuery) ||
        product.description.toLowerCase().includes(lowercasedQuery) ||
        product.category.toLowerCase().includes(lowercasedQuery)
    );
};

const getProductById = async (productId) => {
    return products.find(product => product.id === productId);
};

module.exports = {
    searchProducts,
    getProductById
};
