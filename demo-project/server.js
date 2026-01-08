const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3050;

// Serve the demo.html file at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// Serve the SDK directory from the parent folder
app.use('/sdk', express.static(path.join(__dirname, '../sdk')));

// Start the server
app.listen(PORT, () => {
    console.log(`BehaveIQ Demo Server is running on http://localhost:${PORT}`);
    console.log('Serving demo.html and the BehaveIQ SDK.');
});
