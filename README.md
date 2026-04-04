# URLChecker
CSCI4170 - Cloud Computing group project focusing on a cloud based application that checks for abnormalities or viruses in URL's.

Our project involves creating a Chrome Extension designed to protect users from suspicious web links that may contain malware or phishing schemes. The app will evaluate links in real time and give a simple response as to whether the link is safe. It will be able to do this using a cloud-based RESTful service that connects with a preexisting threat database. Our goal is to provide a lightweight, fast, and apparent warning system for our end users to provide an extra barrier of security.

## Features
- **Real-Time URL Checking**: Instantly evaluate if a URL is malicious or safe.
- **Scan History**: View your recent scan history directly in the extension popup to keep track of previously checked links.

## Setup and Installation

### 1. Backend Server Setup (Node.js & Firebase)

The backend uses Express.js and connects to Firebase Firestore to log URL scans.

**Firebase Configuration:**
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create/select your project.
2. Make sure **Firestore Database** is enabled.
3. Navigate to **Project Settings** > **Service accounts**.
4. Click **Generate new private key**.
5. Save the downloaded JSON file as `serviceAccountKey.json` inside the `server/` directory.
   > *Note: Never commit `serviceAccountKey.json` to version control! Ensure it is in your `.gitignore`.*

**Running the Server:**
1. Open your terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   node index.js
   ```
The server will now be running on `http://localhost:8000`.

### 2. Client Setup (Chrome Extension)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `client` folder from this repository.
5. The extension should now be loaded and ready to interact with the backend server.
