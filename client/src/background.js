chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkUrl") {
        console.log("Service worker received URL:", request.url);

        fetch('https://urlchecker-backend-758639415294.us-east4.run.app/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: request.url })
        })
        .then(async response => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                sendResponse({ error: data.error || `HTTP ${response.status}`, status: response.status });
                return;
            }
            console.log("API response:", data);
            sendResponse({ data: data });
        })
        .catch(error => {
            console.error('API Error:', error);
            sendResponse({ error: error.toString(), status: 0 });
        });

    } else if (request.action === "getHistory") {
        console.log("Service worker fetching history");

        fetch('https://urlchecker-backend-758639415294.us-east4.run.app/history')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("History API response:", data);
            sendResponse({ data: data });
        })
        .catch(error => {
            console.error('History API Error:', error);
            sendResponse({ error: error.toString() });
        });
    }

    // Return true to indicate that the response will be sent asynchronously
    return true;
});