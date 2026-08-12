const axios = require('axios');

class AsteriskManager {
  constructor() {
    this.baseURL = process.env.ASTERISK_MANAGER_URL || 'http://127.0.0.1:4001';
    this.token = process.env.SERVICE_TOKEN || 'voicecore_internal_service_token';
  }

  async activateTrunk(tenantId, trunkData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/trunks/${tenantId}/activate`,
        trunkData,
        {
          headers: { 'SERVICE_TOKEN': this.token }
        }
      );
      return response.data;
    } catch (err) {
      console.error('Asterisk Manager - activateTrunk Error:', err.message);
      throw new Error('Failed to activate trunk on Asterisk');
    }
  }

  async deactivateTrunk(tenantId, trunkId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/trunks/${tenantId}/deactivate`,
        { trunkId },
        {
          headers: { 'SERVICE_TOKEN': this.token }
        }
      );
      return response.data;
    } catch (err) {
      console.error('Asterisk Manager - deactivateTrunk Error:', err.message);
      throw new Error('Failed to deactivate trunk on Asterisk');
    }
  }
}

module.exports = new AsteriskManager();
