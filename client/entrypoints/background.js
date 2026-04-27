const API_BASE = 'https://urlchecker-backend-758639415294.us-east4.run.app';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((request) => {
    if (request.action === 'checkUrl') {
      console.log('Background received URL:', request.url);

      return fetch(`${API_BASE}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: request.url }),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            return {
              error: data.error || `HTTP ${response.status}`,
              status: response.status,
            };
          }
          console.log('API response:', data);
          return { data };
        })
        .catch((error) => {
          console.error('API Error:', error);
          return { error: error.toString(), status: 0 };
        });
    }

    if (request.action === 'getHistory') {
      console.log('Background fetching history');

      return fetch(`${API_BASE}/history`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('History API response:', data);
          return { data };
        })
        .catch((error) => {
          console.error('History API Error:', error);
          return { error: error.toString() };
        });
    }
  });
});
