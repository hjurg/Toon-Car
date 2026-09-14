// server/index.cjs
// CommonJS fallback entry point for Node environments
const path = require('path');
const fs = require('fs');

const distServer = path.resolve(__dirname, '../dist/server.cjs');

if (fs.existsSync(distServer)) {
  require(distServer);
} else {
  // Delegate to ES module server
  import('./index.js').catch(err => {
    console.error('Failed to start Toon Car server:', err);
  });
}
