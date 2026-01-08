# BehaveIQ SDK Demo Project

This project provides a simple, self-contained environment to test the BehaveIQ SDK with a demo website.

## How to Run

Follow these steps to get the demo project running:

### 1. Install Dependencies

Navigate to the `demo-project` directory in your terminal and install the required Node.js dependencies:

```bash
cd demo-project
npm install
```

### 2. Configure Your API Key

Before starting the server, you need to add your BehaveIQ API key to the demo page.

- Open the `demo.html` file inside the `demo-project` directory.
- Find the `<script>` tag at the bottom of the file.
- Replace the placeholder text `'YOUR_API_KEY'` with a real API key from one of your websites in the BehaveIQ dashboard.

```html
<script>
    if (window.BqSdk) {
        new window.BqSdk({
            apiKey: 'YOUR_API_KEY', // <-- REPLACE THIS
            apiUrl: 'http://localhost:5000/api'
        });
    }
</script>
```

### 3. Run the Server

Start the demo server with the following command:

```bash
npm start
```

You should see a message confirming that the server is running.

### 4. View the Demo

Open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)

You can now interact with the demo website. Any actions you take (page views, clicks, etc.) will be tracked by the SDK and sent to your BehaveIQ backend. You should be able to see these events appear in your BehaveIQ dashboard.
