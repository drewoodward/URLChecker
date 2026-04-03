
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkUrl") {
        console.log("Service worker received URL:", request.url);

        fetch('http://localhost:8000/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: request.url })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API response:", data);
            sendResponse({ data: data });
        })
        .catch(error => {
            console.error('API Error:', error);
            sendResponse({ error: error.toString() });
        });

        // Return true to indicate that the response will be sent asynchronously
        return true; 
    }
});