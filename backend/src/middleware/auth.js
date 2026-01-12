const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Website = require('../models/Website');
const mongoose = require('mongoose'); // Added for ObjectId usage

exports.protect = async (req, res, next) => {
  let token;

  console.log(`Auth middleware: Request to ${req.originalUrl}`);

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Auth middleware: Bearer token found.');
  } else if (req.headers['x-api-key']) {
    const apiKey = req.headers['x-api-key'];
    console.log('Auth middleware: X-API-Key found.');

    if (apiKey === process.env.DEMO_API_KEY) {
        console.log('Auth middleware: DEMO_API_KEY recognized. Proceeding with demo context.');
        req.website = {
            _id: new mongoose.Types.ObjectId('60d5ec49e4d1a60015b6d4e1'), // A consistent dummy ID
            name: 'BehaveIQ Demo Website',
            domain: 'http://localhost:3000',
            apiKey: process.env.DEMO_API_KEY,
            userId: null // No specific owner for the demo website in this virtual context
        };
        // Set req.user to the guest user for demo purposes
        req.user = await User.findOne({ email: 'guest@behaveiq.com' });
        if (!req.user) {
            console.error('Auth middleware: Guest user not found for DEMO_API_KEY. Please ensure seeding is correct.');
            return res.status(500).json({ success: false, message: 'Internal server error: Guest user not set up.' });
        }
        return next(); // Allow request to proceed
    }
    
    try {
      const website = await Website.findOne({ apiKey });
      if (!website) {
        if (req.originalUrl.startsWith('/api/identity')) {
            console.warn('Auth middleware: Invalid API Key provided for /api/identity. Website not found.');
            return res.status(403).json({ success: false, message: 'Forbidden: Invalid API Key or Website not found.' });
        }
        console.warn('Auth middleware: Invalid API Key - no website found. Allowing to proceed without specific website context.');
        req.website = null; // No website associated with this API key
        req.user = null; // No user associated
        return next(); // Allow request to proceed for guest/unidentified flow
      }
      req.user = await User.findById(website.userId); // req.user is the owner of the website
      req.website = website;
      if (!req.user) {
        console.warn('Auth middleware: User (owner) linked to API key website not found. Allowing to proceed with website context but no owner user.');
        // Still provide website context if found, but user (owner) is null
      }
      return next(); // Allow request to proceed
    } catch (err) {
      console.error('Auth middleware API key error:', err);
      // If there's an error during website lookup (e.g., DB error), treat as no website found
      req.website = null;
      req.user = null;
      return next(); // Allow request to proceed
    }
  }

  // If no Bearer token AND no X-API-Key is provided, check if it's an SDK-related path
  // This logic is simplified to allow most SDK tracking to proceed anonymously
  if (!token && !req.headers['x-api-key']) {
    const isSdkTrackingPath = req.originalUrl.startsWith('/api/behavior') ||
                              req.originalUrl.startsWith('/api/emotion') ||
                              req.originalUrl.startsWith('/api/identity') ||
                              req.originalUrl.startsWith('/api/sdk'); // Broad match for SDK endpoints

    if (isSdkTrackingPath) {
        if (req.originalUrl.startsWith('/api/identity')) {
            console.warn('Auth middleware: No API Key provided for /api/identity. Unauthorized.');
            return res.status(401).json({ success: false, message: 'Unauthorized: API Key is required for identity operations.' });
        }
        console.warn('Auth middleware: No token or API key provided for SDK tracking path. Allowing to proceed as anonymous.');
        req.website = null;
        req.user = null;
        return next(); // Allow request to proceed for guest/unidentified flow
    } else {
        console.warn('Auth middleware: No token or API key provided for non-SDK path. Unauthorized.');
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
  }


  try { // Bearer token authentication
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: JWT decoded:', decoded.id, decoded.role);
    req.user = await User.findById(decoded.id); // This is supposed to set req.user
    console.log('Auth middleware: JWT authenticated. req.user:', req.user ? req.user._id : 'null');
    if (!req.user) {
      console.warn('Auth middleware: User from JWT not found.');
      return res.status(401).json({ success: false, message: 'User from JWT not found' });
    }

    // Attempt to find a website associated with the authenticated user
    const userWebsite = await Website.findOne({ userId: req.user._id });
    if (userWebsite) {
      req.website = userWebsite;
      console.log('Auth middleware: Website found for authenticated user:', req.website._id);
    } else {
      req.website = null; // No website found for this user
      console.warn('Auth middleware: No website found for authenticated user.');
    }

    next();
  } catch (err) {
    console.error('Auth middleware JWT error:', err);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
