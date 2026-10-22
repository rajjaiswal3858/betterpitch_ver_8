// Vercel function: every request is rewritten here (vercel.json) and served by
// the same handler `npm start` uses locally. If the server fails to start (or a
// request throws), answer with the reason instead of crashing the function, so
// the error shows up in the response as well as in the runtime logs.
let handler, startError;
try {
  handler = require('../server.js').handler;
} catch (e) {
  startError = e;
  console.error('BetterPitch server failed to start:', e);
}

module.exports = (req, res) => {
  try {
    if (startError) throw startError;
    return handler(req, res);
  } catch (e) {
    console.error(e);
    if (res.headersSent) return res.end();
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end((startError ? 'Server failed to start: ' : 'Request failed: ') + (e && e.message || e));
  }
};
