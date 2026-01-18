// ... (imports) ...
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path'); // Add path module

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Load models
const User = require('../models/User');
const Website = require('../models/Website');
const Experiment = require('../models/Experiment');
const Persona = require('../models/Persona');
const Session = require('../models/Session');
const Event = require('../models/Event');
const ClickEvent = require('../models/ClickEvent');

// Read JSON files
const users = JSON.parse(
    fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8')
);
const websites = JSON.parse(
    fs.readFileSync(`${__dirname}/data/websites.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
    try {
        console.log('Seeding users...');
        for (const userData of users) { // Changed 'user' to 'userData' to avoid confusion
            // Hash password explicitly before saving
            const hashedPassword = await bcrypt.hash(userData.password, 10); // 10 is the salt rounds
            
            await User.findOneAndUpdate(
                { email: userData.email },
                { ...userData, password: hashedPassword }, // Overwrite password with hashed version
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
        console.log('Users seeded successfully.');

        // Seed websites for the admin user if they don't have any
// ... (rest of the file)
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        if (adminUser) {
            const websiteCount = await Website.countDocuments({ userId: adminUser._id });
            let websiteId;
            if (websiteCount === 0) {
                const sampleWebsites = websites.map(website => ({ ...website, userId: adminUser._id }));
                const createdWebsites = await Website.create(sampleWebsites);
                console.log('Sample websites seeded for admin user.');
                if (createdWebsites.length > 0) {
                    websiteId = createdWebsites[0]._id;
                    console.log('---');
                    console.log('🎉 Your API Key for the demo project is:');
                    console.log(createdWebsites[0].apiKey);
                    console.log('---');
                }
            } else {
                const existingWebsite = await Website.findOne({ userId: adminUser._id });
                if (existingWebsite) {
                    websiteId = existingWebsite._id;
                    console.log('---');
                    console.log('🔑 Your existing API Key for the demo project is:');
                    console.log(existingWebsite.apiKey);
                    console.log('---');
                }
            }
            if (websiteId) {
                const personas = [
                  {
                    "websiteId": websiteId,
                    "name": "Budget Buyer",
                    "description": "This persona is price sensitive and looks for deals.",
                    "clusterData": {
                      "clusterId": 1,
                      "avgTimeSpent": 120,
                      "avgScrollDepth": 0.6,
                      "avgClickRate": 0.1,
                      "avgPageViews": 3,
                      "commonPages": ["/pricing", "/deals"],
                      "commonDevices": ["mobile"],
                      "behaviorPattern": {
                        "exploreMore": false,
                        "quickDecision": false,
                        "priceConscious": true,
                        "featureFocused": false
                      },
                      "confidence": 0.85,
                      "characteristics": ["Price Sensitive", "Looks for Deals"]
                    },
                    "stats": {
                      "sessionCount": 100,
                      "totalConversions": 10,
                      "conversionRate": 0.1,
                      "avgIntentScore": 0.4
                    }
                  },
                  {
                    "websiteId": websiteId,
                    "name": "Feature Explorer",
                    "description": "This persona is interested in the product features.",
                    "clusterData": {
                      "clusterId": 2,
                      "avgTimeSpent": 240,
                      "avgScrollDepth": 0.8,
                      "avgClickRate": 0.3,
                      "avgPageViews": 5,
                      "commonPages": ["/features", "/docs"],
                      "commonDevices": ["desktop"],
                      "behaviorPattern": {
                        "exploreMore": true,
                        "quickDecision": false,
                        "priceConscious": false,
                        "featureFocused": true
                      },
                      "confidence": 0.9,
                      "characteristics": ["Feature Oriented", "Researches a lot"]
                    },
                    "stats": {
                      "sessionCount": 50,
                      "totalConversions": 15,
                      "conversionRate": 0.3,
                      "avgIntentScore": 0.7
                    }
                  }
                ];
                await Persona.create(personas);
                console.log('Sample personas seeded for admin user.');
            }
        }
        
        console.log('Data Imported...');
    } catch (err) {
        console.error('Error during data import:', err);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await mongoose.connection.collection('users').dropIndexes();
        console.log('User indexes dropped...');
    } catch (error) {
        console.warn('Could not drop user indexes (likely none existed or collection empty):', error.message);
    }
    await User.deleteMany();
    await Website.deleteMany();
    await Experiment.deleteMany();
    await Persona.deleteMany();
    await Session.deleteMany();
    await Event.deleteMany();
    await ClickEvent.deleteMany();
    console.log('Data Destroyed...');
};

// Connect to DB and run seeder
const runSeeder = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected to seeder...');

        const arg = process.argv.find(arg => arg === '-i' || arg === '-d');

        if (arg === '-i') {
            await importData();
        } else if (arg === '-d') {
            await deleteData();
        } else {
            console.log('Please specify -i for import or -d for delete');
        }
        process.exit(0);
    } catch (err) {
        console.error(`Error in seeder: ${err.message}`);
        process.exit(1);
    }
};

runSeeder();