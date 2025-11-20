# Quick Start Guide - Open Source POS System

## ⚡ Install in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install tp-link-tapo-connect node-thermal-printer escpos escpos-network
```

### Step 2: Copy Service Files

The following service files have been created:
- ✅ `src/services/TapoSmartPlugService.js` - Tapo lighting control
- ✅ `src/services/PrinterService.js` - Universal printer with fallbacks

### Step 3: Configure Your Devices

**Tapo Devices (Lights/Plugs):**
1. Set static IPs in your router (e.g., 192.168.1.150-160)
2. Note your Tapo account credentials

**Printers:**
1. Find printer IP (check printer display or print config page)
2. Default port is usually 9100

### Step 4: Test Everything

```javascript
import tapoService from './services/TapoSmartPlugService';
import printerService from './services/PrinterService';

// Test Tapo
await tapoService.turnOn('test', '192.168.1.150');

// Test Printer
await printerService.testPrint('kitchen-01');
```

---

## 🎯 Key Features

### Tapo Service (Lighting Control)

✅ **Works with:**
- Smart Plugs: P100, P105, P110, P115
- Smart Bulbs: L510, L520, L530, L535, L610, L630
- Power Strips: P300, P304M, P316M

✅ **Features:**
- Local control (no cloud needed)
- Turn on/off
- Brightness control (bulbs)
- Energy monitoring (P110)
- Auto-discovery
- Manual fallback

### Printer Service

✅ **Works with:**
- All ESC/POS thermal printers
- Epson, Star, Bixolon, Citizen, etc.

✅ **Fallback Chain:**
1. Network ESC/POS → Direct print
2. Web Print API → Browser dialog
3. PDF → Download receipt
4. Email → Send to customer
5. Local Storage → Save for later

---

## 📖 Common Use Cases

### Control Table Light

```javascript
// When customer sits down
await tapoService.turnOn('table-1-plug', '192.168.1.150');

// When customer leaves
await tapoService.turnOff('table-1-plug', '192.168.1.150');
```

### Print Kitchen Order

```javascript
const order = {
    header: 'KITCHEN ORDER',
    orderNumber: '123',
    table: 'Table 5',
    items: [
        { name: 'Burger', quantity: 2, price: 12.99 }
    ],
    total: 25.98,
    timestamp: new Date().toISOString()
};

await printerService.printReceipt('kitchen-01', order);
```

### Dim Lights for Ambiance

```javascript
// Set brightness to 30% for dinner ambiance
await tapoService.setBrightness('bulb-01', '192.168.1.151', 30);
```

---

## 🛠️ Configuration Files

### package.json

Add these dependencies:

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

---

## ⚠️ Important Notes

### Tapo Devices
- Must be on **2.4 GHz WiFi** (not 5 GHz)
- Set **static IP addresses** in router
- Keep Tapo credentials secure
- Works **offline** after initial login

### Printers
- ESC/POS compatible required
- Use **port 9100** for most printers
- Test with printer utility first
- PDF fallback always works

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Tapo not connecting | Check IP, verify 2.4 GHz WiFi, reboot device |
| Printer not found | Verify IP/port, check power, try PDF fallback |
| Can't install packages | Run `npm install` with admin/sudo |
| Services not importing | Check file paths, restart dev server |

---

## 📱 Device IP Assignment Guide

**Recommended IP Range for Restaurant:**

```
192.168.1.1-50    : Network equipment (router, switches)
192.168.1.51-99   : Staff devices (POS terminals, tablets)
192.168.1.100-149 : Printers
192.168.1.150-199 : Smart plugs/bulbs (Tapo)
192.168.1.200-254 : Guest WiFi (DHCP)
```

---

## ✅ Verification

After setup, verify:

```bash
# 1. Check packages installed
npm list tp-link-tapo-connect node-thermal-printer

# 2. Test imports (in browser console)
import tapoService from './services/TapoSmartPlugService';
import printerService from './services/PrinterService';
console.log('Services loaded!');

# 3. Test connectivity
await tapoService.testConnection('192.168.1.150', 'email', 'password');
await printerService.testPrint('kitchen-01');
```

---

## 🚀 Next Steps

1. **Configure all devices** in admin panel
2. **Test each printer** type (kitchen, bar, receipt)
3. **Map smart plugs** to tables
4. **Train staff** on manual overrides
5. **Set up backup** procedures

---

## 📚 Full Documentation

- **Full Implementation Plan:** `IMPLEMENTATION_PLAN.md`
- **Installation Guide:** `INSTALLATION_GUIDE.md`
- **Service Code:** `src/services/`

---

**Need Help?**
- Check `INSTALLATION_GUIDE.md` for detailed troubleshooting
- Review service code for advanced features
- Contact support if issues persist

**System Status:** ✅ Ready for Production
