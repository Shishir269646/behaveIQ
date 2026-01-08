// src/controllers/deviceController.js
const deviceStitchingService = require('../services/deviceStitchingService');
const Device = require('../models/Device');

const stitchDevices = async (req, res) => {
  try {
    const { fingerprint1, fingerprint2 } = req.body;

    const result = await deviceStitchingService.stitchDevices(
      fingerprint1,
      fingerprint2
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Device stitching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;

    const devices = await Device.find({ userId });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



module.exports = {
  stitchDevices,
  getUserDevices
};