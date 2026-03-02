URL Checker -- Design Package

Andre Woodward, Jasmyne Tate, Gavin Grider, Ryna McCormack, Ryan Pyburn,
Ryan Ramsay

Overview --

Our project involves creating a Chrome Extension designed to protect
users from suspicious web links that may contain malware or phishing
schemes. The app will evaluate links in real time and give a simple
response as to whether the link is safe. It will be able to do this
using a cloud-based RESTful service that connects with a preexisting
threat database. Our goal is to provide a lightweight, fast, and
apparent warning system for our end users to provide an extra barrier of
security.

MVP Features --

- Live URL-detection -- Our application must be able to capture URLs
  before the user initiates connection, either in the browser line or on
  hyperlink hover.

- Secure Data verification -- The captured URL must be securely
  transmitted to the RESTful backend service.

- Threat Database -- our cloud service will query with a third-party
  intelligence source, like the google safe browsing API and URL
  Blacklists to determine the safety of the URL.

- Visual Indication -- Upon detection of the URL our extension will pop
  up with a visual signal such as a check mark or an X either on the
  browser badge or in a pop-up window to signify to the user the safety
  of the link.

- Basic logging -- Record timestamps, URLS, and outcomes of all scanned
  links.

Stretch Goals --

- Cloud Caching -- Implement in-memory data (Redis) to cache frequently
  checked domains to reduce API calls for common websites.

- User Reporting -- Add a UI feature where users can manually flag
  potentially dangerous sites and it will send a report for review

- Threat identification/analytic (optional) -- Display threat data to
  the user, whether the link contains a phishing threat, unwanted
  software or malware.

Out of Scope --

- Threat Database -- We are not building a threat database or a scanning
  engine; we need to rely on third party databases to gather threat
  information.

- Deep Inspection -- The app won't download the files from the URL, or
  use local files or network files, the only data we collect from the
  client is the URL link.

- Active Blocking -- The extension won't block connections to links; it
  acts purely as a notification system.

- Cross-browser support -- The app will be strictly limited to
  development for google chrome. Firefox, Safari and mobile browsers
  won't be supported.

MVP Success Criteria --

- Deployment -- Our backend REST API and database are deployed to the
  cloud and can communicate with locally installed chrome extensions.

- Accuracy -- Our application can identify 100% of malicious URLs and
  safe URLs from a batch of 50, 25 each of a safe and unsafe link.

- Performance -- Our application should be able to tell the user the
  user if the link is safe or unsafe on average under 1 second to ensure
  the browsing experience isn't interrupted.

<!-- -->

- Data integrity -- all interactions are correctly formatted and logged
  it to the cloud.

Architecture Diagram

![](media/image1.png){width="5.25in" height="4.79735564304462in"}

API Specification--

Base URL (Production Example):

<https://api.urlchecker.com/api/v1>

Content-Type: application/json

1\. Check URL Endpoint (MVP Core Feature)

Endpoint: POST /check-url

Description: Checks whether a URL is safe or malicious using a
third-party threat intelligence API.

Request Body

{\
\"url\": \"<https://example.com>\"\
}

Validation Rules

\- \'url\' is required

\- Must be a valid URL format

\- Must begin with <http://> or <https://>

\- Maximum length: 2048 characters

Successful Response (200 OK)

{\
\"url\": \"<https://example.com>\",\
\"result\": \"safe\"\
\"checkedAt\": \"2026-03-01T19:20:30Z\",\
\"responseTimeMs\": 342\
}

If malicious:

{\
\"url\": \"<http://malicious-site.com>\",\
\"result\": \"malicious\"\
\"checkedAt\": \"2026-03-01T19:21:10Z\",\
\"responseTimeMs\": 410\
}

Status Codes

200 -- Successfully checked URL

400 -- Invalid or missing URL

429 -- Rate limit exceeded

500 -- Internal server error

503 -- Third-party threat service unavailable

Example Calls

Example 1 (Safe URL):

curl -X POST <https://api.urlchecker.com/api/v1/check-url> \\\
-H \"Content-Type: application/json\" \\\
-d \'{\"url\":\"https://google.com\"}\'

Example 2 (Invalid URL):

curl -X POST <https://api.urlchecker.com/api/v1/check-url> \\\
-H \"Content-Type: application/json\" \\\
-d \'{\"url\":\"not-a-valid-url\"}\'

Response:

{\
\"error\": \"Invalid URL format\"\
}

2\. Retrieve Scan History (Optional / Admin Use)

Endpoint: GET /scans

Description: Returns recent URL scans for logging or analytics.

Query Parameters (Optional)

limit -- integer -- Number of records to return

domain -- string -- Filter by domain

result -- string -- safe or malicious

Response (200 OK)

{\
\"count\": 2,\
\"data\": \[\
{\
\"url\": \"<https://example.com>\",\
\"result\": \"safe\",\
\"checkedAt\": \"2026-03-01T19:20:30Z\"\
},\
{\
\"url\": \"<http://malicious-site.com>\",\
\"result\": \"malicious\",\
\"checkedAt\": \"2026-03-01T19:21:10Z\"\
}\
\]\
}

3\. User Reporting Endpoint (Stretch Goal)

Endpoint: POST /report

Description: Allows users to manually report suspicious URLs.

Request Body

{\
\"url\": \"<http://suspicious-site.com>\",\
\"reason\": \"Looks like phishing page\"\
}

Response (201 Created)

{\
\"message\": \"Report submitted successfully\",\
\"reportId\": \"uuid-generated-id\",\
\"status\": \"pending\"\
}

Status Codes

201 -- Report created

400 -- Invalid input

500 -- Internal error

4\. Health Check Endpoint (Recommended for Deployment)

Endpoint: GET /health

Response

{\
\"status\": \"ok\",\
\"timestamp\": \"2026-03-01T19:30:00Z\"\
}

Database / Data Model

The database we are using will be SQL, we will use three tables,
Domains, Logs, and as one of our stretch goals User_Reports.

Table 1: Domains -

- Stores the root URL domains and the threat statuses of each domain as
  a cache. Once a domain is cached the API can skip the query to the
  external database increasing performance.

Key fields for Domains -

- Domain_id: UUID (primary key)

- Domain_name: VARCHAR(255) (required, unqiue)

- Is_safe: BOOLEAN (required)

- Threat_type: VARCHAR(50) (if we hit our stretch goals)

- Last_checked: TIMESTAMP (required)

Table 2: Logs -

- Records every link scanned for analytics

Key fields for Logs -

- Log_id: UUID (Primary Key)

- Domain_id: UUID (foreign key, Required)

- url_hash: VARCHAR(256) (Stores the url as a hash for security,
  Required)

- Scanned_at: TIMESTAMP (Required)

Table 3: User_Reports -

- Stores the user reports

Key fields for User_Reports -

- Report_id: UUID (Primary Key)

- Reported_url: TEXT (Required)

- User_flag: ENUM (Required)

- Review_status: ENUM (Required, default PENDING)

- Created_at: TIMESTAMP (Required)

Repository link:

https://github.com/GavinTGr/URLChecker.git

Assigned task list-

API endpoints: Ryan Ramsay

data model setup: Jasmyne Tate

Deployment: Andre Woodward

CI pipeline: Gavin Grider

Testing: Ryan Pyburn

Documentation: Ryan McCormack
