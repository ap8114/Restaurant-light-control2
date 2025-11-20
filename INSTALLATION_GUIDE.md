# Installation Guide - Open Source Restaurant POS

This guide will help you install and configure the open-source components for **printer** and **Tapo lighting control**.

---

## 📦 Required Packages

### Step 1: Install Dependencies

```bash
cd /root/Restaurant-light-control2

# Install Tapo smart plug control
npm install tp-link-tapo-connect

# Install thermal printer libraries (optional - for advanced features)
npm install node-thermal-printer escpos escpos-network

# Dependencies already installed:
# - jspdf (for PDF receipts)
# - jspdf-autotable (for formatted PDFs)
# - react-toastify (for notifications)
# - axios (for API calls)
```

---

## 🔌 TP-Link Tapo Setup (Lighting Control)

### Supported Devices

**Smart Plugs:**
- P100, P105, P110, P115

**Smart Bulbs (with brightness control):**
- L510, L520, L530, L535, L610, L630

**Power Strips:**
- P300, P304M, P316M

### Configuration Steps

1. **Connect Tapo devices to your Wi-Fi network**
   - Use the official Tapo app to set up each device
   - Note the local IP address of each device
   - Set static IPs in your router (recommended)

2. **Get your Tapo credentials**
   - Email: Your Tapo account email
   - Password: Your Tapo account password
   - These are needed for local authentication

3. **Test connectivity**
   ```javascript
   import tapoService from './services/TapoSmartPlugService';

   // Test a device
   const result = await tapoService.testConnection(
       '192.168.1.150',  // Device IP
       'your-email@example.com',
       'your-password'
   );

   console.log(result);
   ```

### Network Setup Recommendations

**For reliable local control:**

1. **Static IP Addresses**
   - Assign static IPs to all Tapo devices in your router
   - Example range: 192.168.1.100-150

2. **Network Segmentation (Optional)**
   - Create a separate VLAN for IoT devices
   - Keeps restaurant operations separate from guest WiFi

3. **Offline Operation**
   - Tapo devices work locally without internet
   - Only cloud login requires internet (one-time)

---

## 🖨️ Printer Setup

### Supported Printer Types

**Network Printers (ESC/POS compatible):**
- Epson TM series (TM-T88, TM-T20, TM-T82)
- Star Micronics TSP series
- Bixolon SRP series
- Citizen CT series
- Any generic ESC/POS thermal printer

**Connection Methods:**
1. **Network (Ethernet/WiFi)** - Preferred
2. **Web Print API** - Browser-based fallback
3. **PDF Generation** - Universal fallback
4. **Email Receipt** - Last resort

### Printer Configuration

1. **Find your printer's IP address**
   - Check printer's built-in display
   - Or use auto-discovery feature
   - Or print network configuration page

2. **Common printer ports:**
   - Raw: 9100 (most common)
   - LPD: 515
   - IPP: 631

3. **Test printer connection:**
   ```javascript
   import printerService from './services/PrinterService';

   // Add printer
   printerService.addNetworkPrinter({
       id: 'kitchen-01',
       name: 'Kitchen Printer',
       type: 'kitchen',
       ip: '192.168.1.100',
       port: 9100
   });

   // Test print
   await printerService.testPrint('kitchen-01');
   ```

### Network Printer Setup

**For Epson TM printers:**

1. Connect printer to network (Ethernet or WiFi)
2. Print network configuration page:
   - Hold FEED button while powering on
   - Release after 2 beeps
3. Note the IP address
4. Set static IP in router settings

**For Star Micronics printers:**

1. Connect to network
2. Use Star Printer Utility to find IP
3. Configure IP settings
4. Test print from utility

---

## 🚀 Quick Start

### 1. Update Package.json

Add to your `package.json`:

```json
{
  "dependencies": {
    "tp-link-tapo-connect": "^2.0.0",
    "node-thermal-printer": "^4.5.0",
    "escpos": "^3.0.0-alpha.6",
    "escpos-network": "^3.0.0-alpha.4"
  }
}
```

### 2. Install Packages

```bash
npm install
```

### 3. Import Services

**In your components:**

```javascript
// For Tapo lighting control
import tapoService from '../services/TapoSmartPlugService';

// For printer control
import printerService from '../services/PrinterService';
```

### 4. Initialize Services

```javascript
// In your main App component or index
import { useEffect } from 'react';
import printerService from './services/PrinterService';

function App() {
    useEffect(() => {
        // Initialize printer service
        printerService.initialize();
    }, []);

    return (
        // Your app
    );
}
```

---

## 🔧 Usage Examples

### Tapo Light Control

```javascript
// Turn on a light
await tapoService.turnOn('plug-01', '192.168.1.150');

// Turn off a light
await tapoService.turnOff('plug-01', '192.168.1.150');

// Toggle light
await tapoService.toggle('plug-01', '192.168.1.150');

// Set brightness (for bulbs)
await tapoService.setBrightness('bulb-01', '192.168.1.151', 75);

// Get device info
const info = await tapoService.getDeviceInfo('plug-01', '192.168.1.150');
console.log(info);

// Get energy usage (P110 only)
const energy = await tapoService.getEnergyUsage('plug-01', '192.168.1.150');
console.log(`Current Power: ${energy.currentPower}W`);
```

### Printer Control

```javascript
// Print a receipt
const receiptData = {
    header: 'RESTAURANT NAME',
    orderNumber: '12345',
    table: 'Table 5',
    timestamp: new Date().toISOString(),
    items: [
        {
            name: 'Burger',
            quantity: 2,
            price: 12.99,
            special_instructions: 'No onions'
        },
        {
            name: 'Fries',
            quantity: 1,
            price: 4.99
        }
    ],
    subtotal: 30.97,
    tax: 2.48,
    discount: 0,
    total: 33.45,
    footer: 'Thank you for dining with us!'
};

// Print to specific printer with automatic fallback
await printerService.printReceipt('kitchen-01', receiptData);

// Discover printers on network
const printers = await printerService.discoverPrinters('192.168.1');
console.log('Found printers:', printers);
```

---

## 🔍 Auto-Discovery

### Discover Tapo Devices

```javascript
// Scan network for Tapo devices
const devices = await tapoService.discoverDevices('192.168.1', 1, 255);
console.log(`Found ${devices.length} devices`);
```

### Discover Printers

```javascript
// Scan network for printers
const printers = await printerService.discoverPrinters('192.168.1');
console.log(`Found ${printers.length} printers`);
```

---

## 🛡️ Fallback System

### Printer Fallback Chain

The system tries each method in order:

1. **Network ESC/POS** → Direct printing to thermal printer
2. **Web Print API** → Browser's native print dialog
3. **PDF Generation** → Downloads receipt as PDF
4. **Email Receipt** → Emails receipt to customer
5. **Local Storage** → Saves receipt for later

### Tapo Fallback

If Tapo connection fails:

1. **Manual Override** → Staff notification
2. **Log Action** → Saves to localStorage
3. **Retry Queue** → Attempts again later

---

## 📱 Device Requirements

### Network Requirements

- **Router:** Support for DHCP and static IP assignment
- **Network:** 2.4 GHz WiFi (Tapo devices don't support 5 GHz)
- **Bandwidth:** Minimal (< 1 Mbps per device)

### Hardware Requirements

**For Printers:**
- ESC/POS compatible thermal printer
- Network connectivity (Ethernet or WiFi)
- Power supply

**For Tapo Devices:**
- TP-Link Tapo smart plugs or bulbs
- 2.4 GHz WiFi network
- Power outlet

---

## 🐛 Troubleshooting

### Tapo Issues

**"Connection failed"**
- Check device IP address
- Verify credentials
- Ensure device is on 2.4 GHz WiFi
- Check firewall settings

**"Device not responding"**
- Reboot the device
- Check network connectivity
- Verify static IP assignment
- Try manual control fallback

### Printer Issues

**"Printer not found"**
- Check IP address and port
- Verify printer is powered on
- Check network cable/WiFi
- Try printing test page from printer

**"Print command failed"**
- System automatically tries fallback methods
- Check console for error details
- Use PDF fallback if needed
- Verify ESC/POS compatibility

---

## 📚 Additional Resources

### Documentation

- **Tapo API:** https://github.com/dickydoouk/tp-link-tapo-connect
- **ESC/POS:** https://github.com/node-escpos/driver
- **Thermal Printer:** https://www.npmjs.com/package/node-thermal-printer

### Community Support

- GitHub Issues: [Restaurant-light-control2/issues](https://github.com/ap8114/Restaurant-light-control2/issues)
- Discord: [Your Discord Server]
- Email: support@yourdomain.com

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Tapo devices respond to on/off commands
- [ ] Brightness control works (for bulbs)
- [ ] Printer test page prints successfully
- [ ] Receipt formatting is correct
- [ ] Fallback methods work (PDF, email)
- [ ] Auto-discovery finds devices
- [ ] Manual override functions properly
- [ ] Error notifications display correctly

---

## 🎯 Next Steps

1. **Configure your devices** in the admin panel
2. **Test all functionality** thoroughly
3. **Train staff** on manual overrides
4. **Set up monitoring** for device health
5. **Create backup procedures** for failures

---

**Installation complete!** Your system now has:
- ✅ Local Tapo lighting control (no cloud dependency)
- ✅ Multi-level printer fallback system
- ✅ Automatic device discovery
- ✅ Manual override capabilities

For implementation details, see `IMPLEMENTATION_PLAN.md`
