/**
 * Tapo Smart Plug Service for Restaurant Light Control
 *
 * Supports TP-Link Tapo devices for lighting control:
 * - Smart Plugs: P100, P105, P110, P115
 * - Smart Bulbs: L510, L520, L530, L535, L610, L630
 * - Power Strips: P300, P304M, P316M
 *
 * Uses: tp-link-tapo-connect library for LOCAL control (no cloud required)
 *
 * Installation:
 * npm install tp-link-tapo-connect
 */

import { toast } from 'react-toastify';

class TapoSmartPlugService {
    constructor() {
        this.devices = new Map();
        this.connectionCache = new Map();
        this.supportedDevices = [
            'P100', 'P105', 'P110', 'P115', // Smart Plugs
            'L510', 'L520', 'L530', 'L535', 'L610', 'L630', // Smart Bulbs
            'P300', 'P304M', 'P316M' // Power Strips
        ];
    }

    /**
     * Initialize a Tapo device connection
     * @param {Object} deviceConfig - Device configuration
     * @param {string} deviceConfig.ip - Device IP address
     * @param {string} deviceConfig.email - Tapo account email
     * @param {string} deviceConfig.password - Tapo account password
     * @param {string} deviceConfig.deviceId - Unique device identifier
     * @returns {Promise<Object>} Connection status
     */
    async initializeDevice(deviceConfig) {
        try {
            const { ip, email, password, deviceId } = deviceConfig;

            // Dynamically import the library (supports both Node.js and browser environments)
            let TapoConnect;
            try {
                // Try to import the library
                const module = await import('tp-link-tapo-connect');
                TapoConnect = module.default || module;
            } catch (importError) {
                console.warn('tp-link-tapo-connect not installed, using fallback mode');
                return this.fallbackControl(deviceConfig, 'init');
            }

            // Create device instance
            const device = await TapoConnect.loginDevice(email, password, {
                cloudPassword: password,
                timeout: 15000
            });

            // Connect to device
            await device.connect(ip);

            // Cache the connection
            this.connectionCache.set(deviceId, device);
            this.devices.set(deviceId, {
                ...deviceConfig,
                status: 'online',
                lastConnected: new Date()
            });

            return {
                success: true,
                message: 'Device connected successfully',
                deviceId
            };
        } catch (error) {
            console.error('Error initializing Tapo device:', error);
            return {
                success: false,
                message: error.message,
                fallback: true
            };
        }
    }

    /**
     * Turn device ON
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @returns {Promise<boolean>} Success status
     */
    async turnOn(deviceId, ip) {
        try {
            const device = await this.getOrCreateConnection(deviceId, ip);

            if (!device) {
                throw new Error('Could not connect to device');
            }

            await device.setPowerState(true);

            // Update local state
            const deviceInfo = this.devices.get(deviceId);
            if (deviceInfo) {
                deviceInfo.power_state = 'on';
                deviceInfo.lastAction = new Date();
            }

            toast.success(`Device turned ON successfully`);
            return true;
        } catch (error) {
            console.error('Error turning on device:', error);
            toast.error(`Failed to turn on device: ${error.message}`);
            return this.fallbackControl({ deviceId, ip }, 'on');
        }
    }

    /**
     * Turn device OFF
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @returns {Promise<boolean>} Success status
     */
    async turnOff(deviceId, ip) {
        try {
            const device = await this.getOrCreateConnection(deviceId, ip);

            if (!device) {
                throw new Error('Could not connect to device');
            }

            await device.setPowerState(false);

            // Update local state
            const deviceInfo = this.devices.get(deviceId);
            if (deviceInfo) {
                deviceInfo.power_state = 'off';
                deviceInfo.lastAction = new Date();
            }

            toast.success(`Device turned OFF successfully`);
            return true;
        } catch (error) {
            console.error('Error turning off device:', error);
            toast.error(`Failed to turn off device: ${error.message}`);
            return this.fallbackControl({ deviceId, ip }, 'off');
        }
    }

    /**
     * Toggle device power state
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @returns {Promise<boolean>} Success status
     */
    async toggle(deviceId, ip) {
        try {
            const device = await this.getOrCreateConnection(deviceId, ip);
            const info = await device.getDeviceInfo();

            const currentState = info.device_on;
            return currentState ? await this.turnOff(deviceId, ip) : await this.turnOn(deviceId, ip);
        } catch (error) {
            console.error('Error toggling device:', error);
            toast.warning('Using fallback mode - please toggle manually');
            return false;
        }
    }

    /**
     * Get device information
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @returns {Promise<Object>} Device information
     */
    async getDeviceInfo(deviceId, ip) {
        try {
            const device = await this.getOrCreateConnection(deviceId, ip);
            const info = await device.getDeviceInfo();

            return {
                success: true,
                deviceId,
                ip,
                model: info.model,
                alias: info.nickname,
                powerState: info.device_on ? 'on' : 'off',
                signalLevel: info.signal_level,
                rssi: info.rssi,
                onTime: info.on_time,
                firmware: info.fw_ver,
                hardware: info.hw_ver,
                mac: info.mac
            };
        } catch (error) {
            console.error('Error getting device info:', error);
            return {
                success: false,
                error: error.message,
                deviceId,
                ip
            };
        }
    }

    /**
     * Get energy usage (for P110 models)
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @returns {Promise<Object>} Energy usage data
     */
    async getEnergyUsage(deviceId, ip) {
        try {
            const device = await this.getOrCreateConnection(deviceId, ip);
            const energy = await device.getEnergyUsage();

            return {
                success: true,
                deviceId,
                currentPower: energy.current_power, // Current power in watts
                todayEnergy: energy.today_energy, // Today's energy in watt-hours
                monthEnergy: energy.month_energy, // Month's energy in watt-hours
                todayRuntime: energy.today_runtime, // Today's runtime in minutes
                monthRuntime: energy.month_runtime // Month's runtime in minutes
            };
        } catch (error) {
            console.error('Error getting energy usage:', error);
            return {
                success: false,
                error: error.message,
                message: 'Energy monitoring not supported or device not reachable'
            };
        }
    }

    /**
     * Control smart bulb brightness (for L-series bulbs)
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @param {number} brightness - Brightness level (1-100)
     * @returns {Promise<boolean>} Success status
     */
    async setBrightness(deviceId, ip, brightness) {
        try {
            if (brightness < 1 || brightness > 100) {
                throw new Error('Brightness must be between 1 and 100');
            }

            const device = await this.getOrCreateConnection(deviceId, ip);
            await device.setBrightness(brightness);

            toast.success(`Brightness set to ${brightness}%`);
            return true;
        } catch (error) {
            console.error('Error setting brightness:', error);
            toast.error(`Failed to set brightness: ${error.message}`);
            return false;
        }
    }

    /**
     * Discover Tapo devices on local network
     * @param {string} networkPrefix - Network prefix (e.g., '192.168.1')
     * @param {number} startRange - Start IP range (e.g., 1)
     * @param {number} endRange - End IP range (e.g., 255)
     * @returns {Promise<Array>} List of discovered devices
     */
    async discoverDevices(networkPrefix = '192.168.1', startRange = 1, endRange = 255) {
        const discovered = [];
        const timeout = 1000; // 1 second timeout per device

        toast.info('Scanning network for Tapo devices... This may take a few minutes.');

        for (let i = startRange; i <= endRange; i++) {
            const ip = `${networkPrefix}.${i}`;

            try {
                // Try to connect to device
                const response = await fetch(`http://${ip}`, {
                    method: 'GET',
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(timeout)
                });

                // If we get any response, it's a potential Tapo device
                discovered.push({
                    ip,
                    status: 'found',
                    needsVerification: true
                });
            } catch (error) {
                // Device not found or timeout - continue scanning
            }

            // Update progress every 10 devices
            if (i % 10 === 0) {
                console.log(`Scanned ${i}/${endRange} addresses...`);
            }
        }

        toast.success(`Found ${discovered.length} potential devices`);
        return discovered;
    }

    /**
     * Get or create a device connection
     * @param {string} deviceId - Device identifier
     * @param {string} ip - Device IP address
     * @returns {Promise<Object>} Device connection
     */
    async getOrCreateConnection(deviceId, ip) {
        // Check if we have a cached connection
        if (this.connectionCache.has(deviceId)) {
            return this.connectionCache.get(deviceId);
        }

        // Try to create a new connection
        const deviceInfo = this.devices.get(deviceId);
        if (deviceInfo) {
            const result = await this.initializeDevice(deviceInfo);
            if (result.success) {
                return this.connectionCache.get(deviceId);
            }
        }

        throw new Error('Could not establish connection to device');
    }

    /**
     * Fallback control when library is not available or connection fails
     * @param {Object} deviceConfig - Device configuration
     * @param {string} action - Action to perform
     * @returns {Promise<boolean>} Success status
     */
    async fallbackControl(deviceConfig, action) {
        console.log('Using fallback control mode');

        // Log the action for manual execution
        const logEntry = {
            deviceId: deviceConfig.deviceId,
            ip: deviceConfig.ip,
            action,
            timestamp: new Date().toISOString(),
            status: 'manual_intervention_required'
        };

        // Store in localStorage for admin review
        const logs = JSON.parse(localStorage.getItem('tapo_manual_logs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('tapo_manual_logs', JSON.stringify(logs));

        // Show notification to staff
        toast.warning(
            `Manual control required: Please ${action} the device at ${deviceConfig.ip}`,
            { autoClose: false }
        );

        return false;
    }

    /**
     * Get manual control logs
     * @returns {Array} List of manual control logs
     */
    getManualLogs() {
        return JSON.parse(localStorage.getItem('tapo_manual_logs') || '[]');
    }

    /**
     * Clear manual control logs
     */
    clearManualLogs() {
        localStorage.removeItem('tapo_manual_logs');
    }

    /**
     * Test device connection
     * @param {string} ip - Device IP address
     * @param {string} email - Tapo account email
     * @param {string} password - Tapo account password
     * @returns {Promise<Object>} Test result
     */
    async testConnection(ip, email, password) {
        try {
            const result = await this.initializeDevice({
                ip,
                email,
                password,
                deviceId: `test_${Date.now()}`
            });

            if (result.success) {
                const info = await this.getDeviceInfo(result.deviceId, ip);
                return {
                    success: true,
                    message: 'Connection successful',
                    deviceInfo: info
                };
            }

            return {
                success: false,
                message: 'Connection failed',
                error: result.message
            };
        } catch (error) {
            return {
                success: false,
                message: 'Connection test failed',
                error: error.message
            };
        }
    }
}

// Export singleton instance
const tapoService = new TapoSmartPlugService();
export default tapoService;
