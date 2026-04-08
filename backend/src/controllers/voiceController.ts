import { Request, Response } from 'express';
import * as productService from '../services/productService';
import { asyncHandler } from '../utils/helpers';

/**
 * Search products by voice query
 */
export const searchByVoice = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.body;

    const results = await productService.searchProducts(query);

    res.json({
      success: true,
      data: {
        query,
        results
      }
    });
});
