"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDB = connectDB;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
async function connectDB() {
    try {
        await prisma.$connect();
        console.log("✅ PostgreSQL connected successfully");
    }
    catch (error) {
        console.error("❌ Database connection error:", error);
        process.exit(1);
    }
}
