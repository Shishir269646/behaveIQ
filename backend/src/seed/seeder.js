const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load models
const User = require('../models/User');
const Website = require('../models/Website');
const Experiment = require('../models/Experiment');
const Persona = require('../models/Persona');
const Session = require('../models/Session');
const Event = require('../models/Event');
const ClickEvent = require('../models/ClickEvent');
const Insight = require('../models/Insight');

// Read JSON files
const users = JSON.parse(
    fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8')
);
const websites = JSON.parse(
    fs.readFileSync(`${__dirname}/data/websites.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
    // Check if users already exist, if not, create them
    let createdUsers = await User.find();
    if (createdUsers.length === 0) {
        createdUsers = await User.create(users);
    }
    const adminUser = createdUsers[0]._id; // Assuming at least one user is created
    
    // Check if websites already exist for this user, if not, create them
    let existingWebsite = await Website.findOne({ userId: adminUser });
    if (!existingWebsite) {
        const sampleWebsites = websites.map(website => {
            return { ...website, userId: adminUser };
        });
        await Website.create(sampleWebsites);
    }
    
    console.log('Data Imported...');
};

// Delete data
const deleteData = async () => {
    await User.deleteMany();
    await Website.deleteMany();
    await Experiment.deleteMany();
    await Persona.deleteMany();
    await Session.deleteMany();
    await Event.deleteMany();
    await ClickEvent.deleteMany();
    await Insight.deleteMany();
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