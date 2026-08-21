const axios = require('axios');

class AsteriskManager {
  getBaseURL() {
    return process.env.ASTERISK_MANAGER_URL || 'http://192.168.203.136:4001';
  }

  getToken() {
    return process.env.SERVICE_TOKEN || 'voicecore_internal_service_token_2024';
  }

  async activateTrunk(tenantId, trunkData) {
    const baseURL = this.getBaseURL();
    const token = this.getToken();
    try {
      console.log(`[ASTERISK-MGR] Activating trunk for tenant ${tenantId} via ${baseURL}`);
      const response = await axios.post(
        `${baseURL}/trunks/${tenantId}/activate`,
        trunkData,
        {
          headers: { 'x-service-token': token },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (err) {
      console.error(`Asterisk Manager - activateTrunk Error (${baseURL}):`, err.message);
      throw new Error(`Failed to activate trunk on Asterisk (${err.message})`);
    }
  }

  async deactivateTrunk(tenantId, trunkId) {
    const baseURL = this.getBaseURL();
    const token = this.getToken();
    try {
      const response = await axios.post(
        `${baseURL}/trunks/${tenantId}/deactivate`,
        { trunkId },
        {
          headers: { 'x-service-token': token },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (err) {
      console.error(`Asterisk Manager - deactivateTrunk Error (${baseURL}):`, err.message);
      throw new Error(`Failed to deactivate trunk on Asterisk (${err.message})`);
    }
  }
}


module.exports = new AsteriskManager();
