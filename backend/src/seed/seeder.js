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
            if (websiteCount === 0) {
                const sampleWebsites = websites.map(website => ({ ...website, userId: adminUser._id }));
                const createdWebsites = await Website.create(sampleWebsites);
                console.log('Sample websites seeded for admin user.');
                if (createdWebsites.length > 0) {
                    console.log('---');
                    console.log('🎉 Your API Key for the demo project is:');
                    console.log(createdWebsites[0].apiKey);
                    console.log('---');
                }
            } else {
                const existingWebsite = await Website.findOne({ userId: adminUser._id });
                if (existingWebsite) {
                    console.log('---');
                    console.log('🔑 Your existing API Key for the demo project is:');
                    console.log(existingWebsite.apiKey);
                    console.log('---');
                }
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