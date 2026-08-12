const crypto = require('crypto');

/**
 * Generates a random API key with a prefix.
 * @returns {{ key: string, hash: string, prefix: string }}
 */
function generateApiKey() {
  const randomStr = crypto.randomBytes(16).toString('hex'); // 32 chars
  const key = `vc_${randomStr}`;
  const prefix = key.substring(0, 8);
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  return { key, hash, prefix };
}

/**
 * Hashes an API key for comparison or storage.
 * @param {string} key - The raw API key
 * @returns {string} The SHA-256 hash of the key
 */
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = {
  generateApiKey,
  hashApiKey,
};
