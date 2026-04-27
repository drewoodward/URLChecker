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

## API Usage

The system exposes two HTTP services. Most clients will only need the backend.

- **Backend (Express + Firestore + URLhaus)**: `https://urlchecker-backend-758639415294.us-east4.run.app`
- **ML service (FastAPI + LightGBM)**: `https://urlchecker-ml-758639415294.us-east4.run.app`

If you're running locally, replace the hosts with `http://localhost:8000` (backend) and `http://127.0.0.1:8000` (ML service).

### Backend

#### `POST /check`

Run a URL through the ML model, query URLhaus, and log the result to Firestore.

**Request**

```bash
curl -X POST https://urlchecker-backend-758639415294.us-east4.run.app/check \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response (200)**

```json
{
  "is_malicious": false,
  "confidence": 0.987,
  "scanId": "8f3c1b2e9a4d5f6789abcd01",
  "urlhaus": {
    "found": false,
    "queryStatus": "no_results"
  }
}
```

When URLhaus has a hit, `urlhaus` includes `status`, `threat`, `tags`, `dateAdded`, `blacklists`, `payloads`, and `reference`.

**Errors**

| Status | When | Body |
|--------|------|------|
| `400`  | Missing or non-`http(s)` URL | `{ "error": "Invalid URL" }` |
| `502`  | ML service unreachable | `{ "error": "Prediction service unavailable" }` |

#### `GET /history`

Return the 5 most recent scans, newest first.

**Request**

```bash
curl https://urlchecker-backend-758639415294.us-east4.run.app/history
```

**Response (200)**

```json
[
  {
    "id": "8f3c1b2e9a4d5f6789abcd01",
    "url": "https://example.com",
    "is_malicious": false,
    "confidence": 0.987,
    "urlhaus": { "found": false, "queryStatus": "no_results" },
    "timestamp": { "_seconds": 1714060800, "_nanoseconds": 0 }
  }
]
```

### ML service

The ML service is normally called by the backend, but you can hit it directly for debugging.

#### `POST /predict`

**Request**

```bash
curl -X POST https://urlchecker-ml-758639415294.us-east4.run.app/predict \
  -H "Content-Type: application/json" \
  -d '{"url": "http://192.168.0.1/login.php?account=verify"}'
```

**Response (200)**

```json
{
  "url": "http://192.168.0.1/login.php?account=verify",
  "label": "phishing",
  "is_malicious": true,
  "confidence": 0.91,
  "scores": {
    "benign": 0.04,
    "defacement": 0.02,
    "phishing": 0.91,
    "malware": 0.03
  }
}
```

`label` is one of `benign`, `defacement`, `phishing`, `malware`. `is_malicious` is `true` for any non-`benign` label.

#### `GET /health`

```bash
curl https://urlchecker-ml-758639415294.us-east4.run.app/health
# {"status":"ok"}
```

### JavaScript example

```js
const res = await fetch('https://urlchecker-backend-758639415294.us-east4.run.app/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' }),
});
const data = await res.json();
console.log(data.is_malicious, data.confidence);
```
