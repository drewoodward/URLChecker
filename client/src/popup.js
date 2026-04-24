function renderUrlhausDetails(container, urlhaus) {
    container.innerHTML = '';

    if (!urlhaus) {
        const msg = document.createElement('div');
        msg.className = 'muted';
        msg.textContent = 'URLhaus lookup unavailable.';
        container.appendChild(msg);
        return;
    }

    if (urlhaus.found === false) {
        const msg = document.createElement('div');
        msg.className = 'muted';
        if (urlhaus.queryStatus && urlhaus.queryStatus !== 'no_results') {
            msg.textContent = `URLhaus: ${urlhaus.queryStatus}`;
        } else {
            msg.textContent = 'Not listed on URLhaus.';
        }
        container.appendChild(msg);
        return;
    }

    const addRow = (label, value) => {
        if (value === undefined || value === null || value === '') return;
        const row = document.createElement('div');
        row.className = 'row';
        const labelEl = document.createElement('span');
        labelEl.className = 'label';
        labelEl.textContent = label + ':';
        row.appendChild(labelEl);
        row.appendChild(document.createTextNode(' ' + value));
        container.appendChild(row);
    };

    const header = document.createElement('div');
    header.className = 'row';
    header.innerHTML = '<span class="label">URLhaus:</span> Listed';
    container.appendChild(header);

    addRow('Status', urlhaus.status);
    addRow('Threat', urlhaus.threat);
    addRow('Date added', urlhaus.dateAdded);

    if (Array.isArray(urlhaus.blacklists) && urlhaus.blacklists.length) {
        addRow('Blacklists', urlhaus.blacklists.join(', '));
    } else if (urlhaus.blacklists && typeof urlhaus.blacklists === 'object') {
        const flagged = Object.entries(urlhaus.blacklists)
            .filter(([, v]) => v && v !== 'not listed')
            .map(([k, v]) => `${k}: ${v}`);
        if (flagged.length) addRow('Blacklists', flagged.join('; '));
    }

    if (Array.isArray(urlhaus.tags) && urlhaus.tags.length) {
        const row = document.createElement('div');
        row.className = 'row';
        const labelEl = document.createElement('span');
        labelEl.className = 'label';
        labelEl.textContent = 'Tags:';
        row.appendChild(labelEl);
        urlhaus.tags.forEach(t => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = t;
            row.appendChild(tag);
        });
        container.appendChild(row);
    }

    if (Array.isArray(urlhaus.payloads) && urlhaus.payloads.length) {
        addRow('Payloads', String(urlhaus.payloads.length));
    }

    if (urlhaus.reference) {
        const row = document.createElement('div');
        row.className = 'row';
        const labelEl = document.createElement('span');
        labelEl.className = 'label';
        labelEl.textContent = 'Reference:';
        row.appendChild(labelEl);
        const link = document.createElement('a');
        link.href = urlhaus.reference;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ' view on URLhaus';
        row.appendChild(link);
        container.appendChild(row);
    }
}

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

                    const caret = document.createElement('span');
                    caret.className = 'history-caret';
                    item.appendChild(caret);

                    const urlSpan = document.createElement('span');
                    urlSpan.className = 'history-url';
                    urlSpan.textContent = scan.url;

                    const infoSpan = document.createElement('span');
                    infoSpan.className = 'history-info';
                    const confidencePercent = (scan.confidence * 100).toFixed(1);
                    const statusText = scan.is_malicious ? 'Malicious' : 'Safe';
                    infoSpan.textContent = `Status: ${statusText} (${confidencePercent}%)`;

                    const details = document.createElement('div');
                    details.className = 'history-details';
                    renderUrlhausDetails(details, scan.urlhaus);

                    item.appendChild(urlSpan);
                    item.appendChild(infoSpan);
                    item.appendChild(details);

                    item.addEventListener('click', (e) => {
                        if (e.target.closest('.history-details')) return;
                        item.classList.toggle('expanded');
                    });

                    historyList.appendChild(item);
                });
            }
        });
    });
});