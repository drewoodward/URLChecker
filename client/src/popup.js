document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('test-btn');
    const status = document.getElementById('status');
    const urlInput = document.getElementById('url-input');
    const historyBtn = document.getElementById('history-btn');
    const historyList = document.getElementById('history-list');

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

    historyBtn.addEventListener('click', () => {
        historyList.innerHTML = 'Loading history...';

        chrome.runtime.sendMessage({ action: "getHistory" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);
                historyList.innerHTML = '<span style="color: red;">Error communicating with background script.</span>';
                return;
            }

            if (response.error) {
                console.error('Error from background:', response.error);
                historyList.innerHTML = '<span style="color: red;">Error loading history.</span>';
                return;
            }

            if (response.data) {
                const historyData = response.data;
                historyList.innerHTML = '';
                
                if (historyData.length === 0) {
                    historyList.innerHTML = '<p>No recent scans found.</p>';
                    return;
                }
                
                historyData.forEach(scan => {
                    const item = document.createElement('div');
                    item.className = 'history-item ' + (scan.is_malicious ? 'history-malicious' : 'history-safe');
                    
                    const urlSpan = document.createElement('span');
                    urlSpan.className = 'history-url';
                    urlSpan.textContent = scan.url;
                    
                    const infoSpan = document.createElement('span');
                    infoSpan.className = 'history-info';
                    const confidencePercent = (scan.confidence * 100).toFixed(1);
                    const statusText = scan.is_malicious ? 'Malicious' : 'Safe';
                    infoSpan.textContent = `Status: ${statusText} (${confidencePercent}%)`;
                    
                    item.appendChild(urlSpan);
                    item.appendChild(infoSpan);
                    historyList.appendChild(item);
                });
            }
        });
    });
});