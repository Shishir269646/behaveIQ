const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { prisma } = require('../config/database'); // Import prisma client

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Read JSON files
const usersData = JSON.parse(
    fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8')
);
const websitesData = JSON.parse(
    fs.readFileSync(`${__dirname}/data/websites.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
    try {
        console.log('Seeding users...');
        for (const userData of usersData) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create or update user, including nested relations
            await prisma.user.upsert({
                where: { email: userData.email },
                update: {
                    password: hashedPassword,
                    fullName: userData.fullName,
                    companyName: userData.companyName,
                    plan: userData.plan,
                    role: userData.role,
                    // No need to update createdAt/updatedAt directly on upsert
                    // Prisma handles it via @updatedAt
                },
                create: {
                    email: userData.email,
                    password: hashedPassword,
                    fullName: userData.fullName,
                    companyName: userData.companyName,
                    plan: userData.plan || 'free',
                    role: userData.role || 'user',
                    settings: { create: {} }, // Create default UserSettings
                    behavior: { create: {} }, // Create default UserBehavior
                    // Other relations like personaInfo, emotionalProfile, etc., can be created here
                    // if they are always present. Otherwise, they'll be created on demand.
                }
            });
        }
        console.log('Users seeded successfully.');

        // Seed websites for the admin user if they don't have any
        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@example.com' },
            include: { websites: true }
        });

        if (adminUser) {
            const websiteCount = adminUser.websites.length;
            let websiteId;
            let createdWebsite;

            if (websiteCount === 0) {
                // Create sample website with nested settings and stats
                const sampleWebsiteData = websitesData[0]; // Assuming one sample website
                createdWebsite = await prisma.website.create({
                    data: {
                        userId: adminUser.id,
                        name: sampleWebsiteData.name,
                        domain: sampleWebsiteData.domain,
                        apiKey: sampleWebsiteData.apiKey || require('uuid').v4(), // Generate if not present
                        isDemo: sampleWebsiteData.isDemo || false,
                        plan: sampleWebsiteData.plan || 'free',
                        industry: sampleWebsiteData.industry || 'general',
                        status: sampleWebsiteData.status || 'learning',
                        learningStartedAt: new Date(),
                        settings: { create: {} }, // Create default WebsiteSettings
                        stats: { create: {} },     // Create default WebsiteStats
                    }
                });
                websiteId = createdWebsite.id;
                console.log('Sample website seeded for admin user.');
                if (createdWebsite) {
                    console.log('---');
                    console.log('🎉 Your API Key for the demo project is:');
                    console.log(createdWebsite.apiKey);
                    console.log('---');
                }
            } else {
                const existingWebsite = adminUser.websites[0];
                if (existingWebsite) {
                    websiteId = existingWebsite.id;
                    console.log('---');
                    console.log('🔑 Your existing API Key for the demo project is:');
                    console.log(existingWebsite.apiKey);
                    console.log('---');
                }
            }

            if (websiteId) {
                const personasToSeed = [
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

                for (const personaData of personasToSeed) {
                    await prisma.persona.upsert({
                        where: { name_websiteId: { name: personaData.name, websiteId: websiteId } }, // Assuming name+websiteId is unique
                        update: {
                            description: personaData.description,
                            clusterData: {
                                upsert: {
                                    create: {
                                        clusterId: personaData.clusterData.clusterId,
                                        avgTimeSpent: personaData.clusterData.avgTimeSpent,
                                        avgScrollDepth: personaData.clusterData.avgScrollDepth,
                                        avgClickRate: personaData.clusterData.avgClickRate,
                                        avgPageViews: personaData.clusterData.avgPageViews,
                                        commonPages: personaData.clusterData.commonPages,
                                        commonDevices: personaData.clusterData.commonDevices,
                                        behaviorPattern: { create: personaData.clusterData.behaviorPattern },
                                        confidence: personaData.clusterData.confidence,
                                        characteristics: personaData.clusterData.characteristics,
                                    },
                                    update: {
                                        clusterId: personaData.clusterData.clusterId,
                                        avgTimeSpent: personaData.clusterData.avgTimeSpent,
                                        avgScrollDepth: personaData.clusterData.avgScrollDepth,
                                        avgClickRate: personaData.clusterData.avgClickRate,
                                        avgPageViews: personaData.clusterData.avgPageViews,
                                        commonPages: personaData.clusterData.commonPages,
                                        commonDevices: personaData.clusterData.commonDevices,
                                        behaviorPattern: { update: personaData.clusterData.behaviorPattern },
                                        confidence: personaData.clusterData.confidence,
                                        characteristics: personaData.clusterData.characteristics,
                                    }
                                }
                            },
                            stats: {
                                upsert: {
                                    create: personaData.stats,
                                    update: personaData.stats
                                }
                            }
                        },
                        create: {
                            websiteId: websiteId,
                            name: personaData.name,
                            description: personaData.description,
                            isAutoDiscovered: true,
                            clusterData: {
                                create: {
                                    clusterId: personaData.clusterData.clusterId,
                                    avgTimeSpent: personaData.clusterData.avgTimeSpent,
                                    avgScrollDepth: personaData.clusterData.avgScrollDepth,
                                    avgClickRate: personaData.clusterData.avgClickRate,
                                    avgPageViews: personaData.clusterData.avgPageViews,
                                    commonPages: personaData.clusterData.commonPages,
                                    commonDevices: personaData.clusterData.commonDevices,
                                    behaviorPattern: { create: personaData.clusterData.behaviorPattern },
                                    confidence: personaData.clusterData.confidence,
                                    characteristics: personaData.clusterData.characteristics,
                                }
                            },
                            stats: {
                                create: personaData.stats
                            }
                        }
                    });
                }
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
        // Order of deletion matters due to foreign key constraints
        await prisma.emotionChange.deleteMany();
        await prisma.userEmotionalProfile.deleteMany();
        await prisma.intentScoreChange.deleteMany();
        await prisma.sessionIntentScore.deleteMany();
        await prisma.sessionIntervention.deleteMany();
        await prisma.cartAction.deleteMany();
        await prisma.mouseMove.deleteMany();
        await prisma.click.deleteMany();
        await prisma.pageView.deleteMany();
        await prisma.sessionBehavior.deleteMany();
        await prisma.coordinates.deleteMany();
        await prisma.locationInfo.deleteMany();
        await prisma.deviceSessionInfo.deleteMany();
        await prisma.event.deleteMany(); // Event does not have dependencies on Session and Website.
        await prisma.session.deleteMany();

        await prisma.experimentVariation.deleteMany();
        await prisma.experimentResult.deleteMany();
        await prisma.experimentSettings.deleteMany();
        await prisma.experiment.deleteMany();

        await prisma.personalizationRule.deleteMany();
        await prisma.behaviorPattern.deleteMany();
        await prisma.personaClusterData.deleteMany();
        await prisma.personaStats.deleteMany();
        await prisma.persona.deleteMany();
        
        await prisma.emotionIntervention.deleteMany();
        await prisma.riskBasedActions.deleteMany();
        await prisma.fraudDetectionSettings.deleteMany();
        await prisma.websiteSettings.deleteMany();
        await prisma.websiteStats.deleteMany();
        await prisma.website.deleteMany();

        await prisma.userDevice.deleteMany();
        await prisma.userPersonaInfo.deleteMany();
        await prisma.userFraudScore.deleteMany();
        await prisma.userDiscount.deleteMany();
        await prisma.userBehavior.deleteMany();
        await prisma.userSettings.deleteMany();
        await prisma.user.deleteMany();

        console.log('Data Destroyed...');
    } catch (err) {
        console.error('Error during data deletion:', err);
        throw err;
    }
};

// Connect to DB and run seeder
const runSeeder = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL Connected to seeder via Prisma...');

        const arg = process.argv.find(arg => arg === '-i' || arg === '-d');

        if (arg === '-i') {
            await importData();
        } else if (arg === '-d') {
            await deleteData();
        } else {
            console.log('Please specify -i for import or -d for delete');
        }
        await prisma.$disconnect(); // Disconnect after seeding
        process.exit(0);
    } catch (err) {
        console.error(`Error in seeder: ${err.message}`);
        await prisma.$disconnect(); // Ensure disconnect on error
        process.exit(1);
    }
};

runSeeder();