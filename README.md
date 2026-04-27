# URLChecker
CSCI4170 - Cloud Computing group project focusing on a cloud based application that checks for abnormalities or viruses in URL's.

Our project involves creating a browser extension (Chrome and Firefox) designed to protect users from suspicious web links that may contain malware or phishing schemes. The app will evaluate links in real time and give a simple response as to whether the link is safe. It will be able to do this using a cloud-based RESTful service that connects with a preexisting threat database. The system also uses a machine learning model to classify URLs and enhance detection accuracy. Our goal is to provide a lightweight, fast, and apparent warning system for our end users to provide an extra barrier of security.

The extension is built with the [WXT](https://wxt.dev) framework, which produces builds for both Chrome (Manifest V3) and Firefox (Manifest V2 by default) from a single codebase.

## Features
- **Real-Time URL Checking**: Instantly evaluate if a URL is malicious or safe.
- **Scan History**: View your recent scan history directly in the extension popup to keep track of previously checked links.

## Setup and Installation

## Prerequisites
- Node.js 18+ and npm installed
- Python 3 and pip installed
- Google Chrome and/or Mozilla Firefox

### 1. Backend Server Setup (Node.js & Firebase)

The backend uses Express.js and connects to Firebase Firestore to log URL scans.

**Firebase Configuration:**
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create/select your project.
2. Make sure **Firestore Database** is enabled.
3. Navigate to **Project Settings** > **Service accounts**.
4. Click **Generate new private key**.
5. Save the downloaded JSON file as `serviceAccountKey.json` inside the `server/` directory.
   > *Note: Never commit `serviceAccountKey.json` to version control! Ensure it is in your `.gitignore`.*

**Running the backend locally is optional and only needed for development**

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

**Running the ML Service (Python FastAPI):**
1. Open your terminal and navigate to `ml-service` directory:
   ```bash
   cd ml-service
   ```
2.  Install the necessary dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start server:
   ```bash
   uvicorn main:app --reload
   ```
The ML service will now be running on `http://127.0.0.1:8000`

### 2. Client Setup (Browser Extension)

The client is a [WXT](https://wxt.dev) project that builds the same source for Chrome and Firefox.

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```

#### Development (with hot reload)

- Chrome:
  ```bash
  npm run dev
  ```
- Firefox:
  ```bash
  npm run dev:firefox
  ```

WXT will launch the selected browser with the extension already loaded.

#### Production builds

- Chrome:
  ```bash
  npm run build           # outputs to dist/chrome-mv3
  npm run zip             # outputs a zip in dist/
  ```
- Firefox:
  ```bash
  npm run build:firefox   # outputs to dist/firefox-mv2
  npm run zip:firefox     # outputs a zip + sources zip in dist/
  ```

#### Loading an unpacked build manually

- Chrome: navigate to `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select `client/dist/chrome-mv3`.
- Firefox: navigate to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select the `manifest.json` inside `client/dist/firefox-mv2`.
