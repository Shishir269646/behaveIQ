"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const AppError_1 = __importDefault(require("../utils/AppError"));
class DeviceStitchingService {
    /**
     * Stitch devices together
     */
    async stitchDevices(fingerprint1, fingerprint2) {
        try {
            const device1 = await database_1.prisma.userDevice.findFirst({
                where: { fingerprint: fingerprint1 },
                include: { user: true }
            });
            const device2 = await database_1.prisma.userDevice.findFirst({
                where: { fingerprint: fingerprint2 },
                include: { user: true }
            });
            if (!device1 || !device2) {
                return { stitched: false, reason: 'device_not_found' };
            }
            if (device1.userId && device2.userId && device1.userId === device2.userId) {
                return { stitched: true, reason: 'already_stitched' };
            }
            const sessions1 = device1.userId ? await database_1.prisma.session.findMany({
                where: { userId: device1.userId },
                include: { locationInfo: true },
                take: 100
            }) : [];
            const sessions2 = device2.userId ? await database_1.prisma.session.findMany({
                where: { userId: device2.userId },
                include: { locationInfo: true },
                take: 100
            }) : [];
            const signals = this.calculateStitchingSignals(sessions1, sessions2);
            const confidence = this.calculateStitchingConfidence(signals);
            if (confidence > 0.8) {
                const masterUser = await this.mergeDevices(device1, device2, confidence);
                return { stitched: true, confidence, signals, masterUser };
            }
            return { stitched: false, confidence, signals };
        }
        catch (error) {
            console.error('Device stitching error:', error);
            throw new AppError_1.default('Device stitching failed', 500);
        }
    }
    calculateStitchingSignals(sessions1, sessions2) {
        const sameIP = this.checkIPOverlap(sessions1, sessions2);
        const temporalProximity = this.checkTemporalProximity(sessions1, sessions2);
        const behaviorSimilarity = false;
        return {
            sameIP,
            temporalProximity,
            behaviorSimilarity
        };
    }
    checkIPOverlap(sessions1, sessions2) {
        const ips1 = new Set(sessions1.map(s => s.locationInfo?.ip).filter(Boolean));
        const ips2 = new Set(sessions2.map(s => s.locationInfo?.ip).filter(Boolean));
        const overlap = [...ips1].filter(ip => ips2.has(ip));
        return overlap.length > 0;
    }
    checkTemporalProximity(sessions1, sessions2) {
        const threshold = 3600000;
        for (let s1 of sessions1) {
            for (let s2 of sessions2) {
                const timeDiff = Math.abs(s1.createdAt.getTime() - s2.createdAt.getTime());
                if (timeDiff < threshold) {
                    return true;
                }
            }
        }
        return false;
    }
    calculateStitchingConfidence(signals) {
        let score = 0;
        if (signals.sameIP)
            score += 0.4;
        if (signals.temporalProximity)
            score += 0.3;
        if (signals.behaviorSimilarity)
            score += 0.3;
        return score;
    }
    async mergeDevices(device1, device2, confidence) {
        const masterDevice = device1.userId ? device1 :
            device2.userId ? device2 :
                device1.firstSeen < device2.firstSeen ? device1 : device2;
        const slaveDevice = masterDevice === device1 ? device2 : device1;
        let masterUser;
        if (masterDevice.userId) {
            masterUser = await database_1.prisma.user.findUnique({ where: { id: masterDevice.userId } });
        }
        else {
            masterUser = await database_1.prisma.user.create({
                data: {
                    email: `${masterDevice.fingerprint}@placeholder.com`,
                    password: 'defaultpassword',
                    fullName: 'Anonymous User',
                    fingerprint: masterDevice.fingerprint,
                    lastActive: new Date(),
                }
            });
            await database_1.prisma.userDevice.update({
                where: { id: masterDevice.id },
                data: { userId: masterUser.id }
            });
        }
        const masterId = masterUser.id;
        // Update devices with stitching info
        const masterStitched = Array.isArray(masterDevice.stitchedWith) ? [...masterDevice.stitchedWith] : [];
        masterStitched.push({ fingerprint: slaveDevice.fingerprint, confidence, stitchedAt: new Date() });
        const slaveStitched = Array.isArray(slaveDevice.stitchedWith) ? [...slaveDevice.stitchedWith] : [];
        slaveStitched.push({ fingerprint: masterDevice.fingerprint, confidence, stitchedAt: new Date() });
        await database_1.prisma.userDevice.update({
            where: { id: masterDevice.id },
            data: { stitchedWith: masterStitched }
        });
        await database_1.prisma.userDevice.update({
            where: { id: slaveDevice.id },
            data: {
                userId: masterId,
                stitchedWith: slaveStitched
            }
        });
        await database_1.prisma.session.updateMany({
            where: { userId: slaveDevice.userId },
            data: { userId: masterId }
        });
        if (!device1.userId && masterDevice.id === device1.id) {
            await database_1.prisma.session.updateMany({
                where: { fingerprint: device1.fingerprint, userId: null },
                data: { userId: masterId }
            });
        }
        else if (!device2.userId && masterDevice.id === device2.id) {
            await database_1.prisma.session.updateMany({
                where: { fingerprint: device2.fingerprint, userId: null },
                data: { userId: masterId }
            });
        }
        return await database_1.prisma.user.findUnique({
            where: { id: masterId },
            include: { devices: true }
        });
    }
}
const deviceStitchingService = new DeviceStitchingService();
exports.default = deviceStitchingService;
