// 최소 의존성: native fetch 기반3
/**
 * fetch httpclient.js  
 */
const DEFAULT_TIMEOUT = 30000; // 30초 후 요청 취소

function withTimeout(promise, ms = DEFAULT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timeout')), ms);
    promise.then(v => { clearTimeout(id); resolve(v); })
           .catch(e => { clearTimeout(id); reject(e); });
  });
}

async function request(method, url, { headers = {}, query, body } = {}) {
  const qs = query
    ? '?' + new URLSearchParams(query).toString()
    : '';

  const init = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  };

  const res = await withTimeout(fetch(url + qs, init));
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '');

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText;
    const err = new Error(msg || 'HTTP error');
    err.time = new Date().toISOString();
    err.url = url;
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data; 
}

const http = {
  get: (url, opts) => request('GET', url, opts),
  post: (url, opts) => request('POST', url, opts),
  put: (url, opts) => request('PUT', url, opts),
  patch: (url, opts) => request('PATCH', url, opts),
  delete: (url, opts) => request('DELETE', url, opts),
};

module.exports = { http };