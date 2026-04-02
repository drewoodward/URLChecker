document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('test-btn');
    const status = document.getElementById('status');
    const urlInput = document.getElementById('url-input');

    btn.addEventListener('click', () => {
        const urlToCheck = urlInput.value.trim();
        
        if (!urlToCheck) {
            status.innerText = "Please enter a URL.";
            return;
        }

        status.innerText = `Checking ${urlToCheck}...`;
        console.log("URL to check:", urlToCheck);

        chrome.runtime.sendMessage({ action: "checkUrl", url: urlToCheck }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);
                status.style.color = 'red';
                status.innerText = 'Error communicating with background script.';
                return;
            }

            if (response.error) {
                console.error('Error from background:', response.error);
                status.style.color = 'red';
                status.innerText = 'Error checking URL.';
            } else if (response.data) {
                const data = response.data;
                if (data.is_malicious) {
                    status.style.color = 'red';
                    status.innerText = `Warning! Malicious URL detected (Confidence: ${(data.confidence * 100).toFixed(2)}%)`;
                } else {
                    status.style.color = 'green';
                    status.innerText = `Safe! Confidence: ${(data.confidence * 100).toFixed(2)}%`;
                }
            }
        });
    });
});