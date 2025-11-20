# Restaurant Light Control - Implementation Plan
## Critical Fixes & Open Source Migration

**Project Analysis Date:** November 20, 2025
**Status:** Ready for Implementation
**Priority:** HIGH - Production System Issues

---

## 📊 CURRENT SYSTEM ANALYSIS

### Technology Stack
- **Frontend:** React 19 + Vite + Bootstrap
- **Backend API:** Railway-hosted REST API
  - Base URL: `https://restorant-backend-new-veni-production.up.railway.app/api`
- **State Management:** Redux Toolkit
- **Key Dependencies:**
  - jsPDF for receipt generation
  - Axios for API calls
  - React Router for navigation
  - React Icons for UI

### Identified Issues

#### 🔴 CRITICAL ISSUE #1: Printer System
**Location:** `src/Component/AdminDashboard/PrinterSetup/PrinterSetup.jsx`

**Current Implementation:**
- Uses backend API endpoints: `/printers`, `/printers/testPrint`
- Requires printer API with Tuya/Baytion integration
- Manages network printers with IP addresses and ports
- Supports kitchen, bar, and receipt printer types

**Problems:**
- API authentication failures
- Vendor lock-in with proprietary systems
- No fallback printing mechanism
- Requires cloud connectivity

**Impact:** Staff cannot print KOT (Kitchen Order Tickets) or receipts

#### 🔴 CRITICAL ISSUE #2: Missing Payment Flow in Session Management
**Location:** `src/Component/UserDashboard/SessionTracker/SessionTracker.jsx`

**Current Implementation:**
- Session tracking with timer and charge calculation (lines 19-514)
- Has "End Session" button (line 415-417) but NO payment integration
- Charges calculated but not collected

**Problems:**
- "End Session" button exists but doesn't handle payment
- Users can't pay for their sessions from SessionTracker
- Must navigate elsewhere to complete payment
- No direct path to billing from active session

**Impact:** Customers cannot complete payment flow, poor UX

#### 🔴 CRITICAL ISSUE #3: Smart Plug Control
**Location:** `src/Component/AdminDashboard/TablePlugSetup/MapSmartPlug.jsx`

**Current Implementation:**
- Uses backend API: `/plugs`, `/plugs/{id}/power`
- Requires Baytion smart plug integration
- Controls power state via proprietary API
- Stores credentials (auth_username, auth_password, api_key)

**Problems:**
- API failures preventing plug control
- Vendor-specific implementation
- No manual override
- Requires internet for local devices

**Impact:** Cannot control table lights/equipment automatically

---

## 🛠️ IMPLEMENTATION PLAN

### PHASE 1: CRITICAL FIXES (Week 1)

#### Fix #1: Replace Printer System with Open Source

**New Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PrinterService.js (New)                           │
│  ├── Network Printer Discovery                     │
│  ├── ESC/POS Command Generation                    │
│  ├── Multiple Output Formats                       │
│  │   ├── Direct Network Print (ESC/POS)           │
│  │   ├── Web Print API                             │
│  │   ├── PDF Generation (jsPDF)                    │
│  │   └── Email Receipt                             │
│  └── Fallback Chain                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create new printer service** (`src/services/PrinterService.js`):
```javascript
// Key features to implement:
- Network printer auto-discovery (scan 192.168.1.1-255)
- ESC/POS command generation for thermal printers
- Web Print API integration (browser native)
- PDF fallback with jsPDF
- Email receipt via backend API
- Local storage for printer settings
```

2. **Install required packages:**
```bash
npm install escpos escpos-network qz-tray
# qz-tray for advanced printer support
```

3. **Update PrinterSetup.jsx:**
- Add printer discovery button
- Support multiple connection types (Network, USB, Bluetooth)
- Add test print with multiple formats
- Store printer preferences locally

4. **Create fallback system:**
```javascript
// Printing priority:
1. Try network printer (ESC/POS)
2. Try Web Print API
3. Generate PDF (auto-download)
4. Offer email option
5. Store for later retry
```

**Files to Create/Modify:**
- ✅ `src/services/PrinterService.js` (new)
- ✅ `src/services/EscPosGenerator.js` (new)
- ✅ `src/components/AdminDashboard/PrinterSetup/PrinterDiscovery.jsx` (new)
- ✅ Modify: `src/Component/AdminDashboard/PrinterSetup/PrinterSetup.jsx`

---

#### Fix #2: Add Payment Button to Session Tracker

**Current Flow:**
```
SessionTracker → "End Session" → ??? → No Payment
```

**New Flow:**
```
SessionTracker → "Pay & End Session" → Payment Modal → BillingPayment → Session Closed
```

**Implementation Steps:**

1. **Update SessionTracker.jsx** (line 414-417):

Replace current "End Session" button with payment integration:

```jsx
// OLD CODE (line 414-417):
<button className="btn btn-outline-secondary d-flex align-items-center justify-content-start py-2">
    <RiStopLine className="me-2" />
    End Session
</button>

// NEW CODE:
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const handleEndSession = async () => {
    // Show confirmation
    const result = await Swal.fire({
        title: 'End Session & Pay?',
        html: `
            <div class="text-start">
                <p>Session Details:</p>
                <ul>
                    <li>Time Elapsed: ${formatTime(elapsedSeconds)}</li>
                    <li>Rate: $${sessionData.hourly_rate}/hour</li>
                    <li><strong>Total: $${calculateCurrentCharges()}</strong></li>
                </ul>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Proceed to Payment',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        try {
            // Update session status to completed
            await axiosInstance.patch(`/sessions/${sessionData.id}/status`, {
                status: 'completed',
                end_time: new Date().toISOString()
            });

            // Navigate to payment page with session data
            navigate('/user/billing', {
                state: {
                    sessionData: {
                        ...sessionData,
                        elapsed_time: elapsedSeconds,
                        total_charge: calculateCurrentCharges()
                    }
                }
            });
        } catch (err) {
            Swal.fire('Error', 'Failed to end session', 'error');
        }
    }
};

<button
    className="btn btn-danger d-flex align-items-center justify-content-start py-2"
    onClick={handleEndSession}
>
    <RiMoneyDollarCircleLine className="me-2" />
    Pay & End Session (${calculateCurrentCharges()})
</button>
```

2. **Create/Update Billing Component** for sessions:
- Option A: Use existing `BillingPayment.jsx` with session support
- Option B: Create new `SessionBilling.jsx` specifically for sessions

3. **Add session payment API calls:**
```javascript
// In SessionTracker.jsx or new SessionBilling.jsx
const processSessionPayment = async (paymentMethod) => {
    const paymentData = {
        session_id: sessionData.id,
        amount: calculateCurrentCharges(),
        payment_method: paymentMethod,
        elapsed_time: elapsedSeconds,
        table_id: sessionData.table_id
    };

    await axiosInstance.post('/payments/session', paymentData);

    // Update session status
    await axiosInstance.patch(`/sessions/${sessionData.id}/status`, {
        status: 'paid',
        payment_status: 'completed'
    });

    // Free up the table if it's a table session
    if (sessionData.table_id) {
        await axiosInstance.put(`/tables/${sessionData.table_id}`, {
            status: 'available'
        });
    }
};
```

**Files to Modify:**
- ✅ `src/Component/UserDashboard/SessionTracker/SessionTracker.jsx`
- ✅ `src/Component/UserDashboard/MyBilling/MyBilling.jsx` (update to handle sessions)
- ✅ Add route in `src/App.jsx` for session billing if needed

---

#### Fix #3: Replace Smart Plug System

**New Architecture:**

```
┌──────────────────────────────────────────────┐
│         Smart Plug Control Options           │
├──────────────────────────────────────────────┤
│                                              │
│  1. Local API Control (NO CLOUD)            │
│     - TP-Link Kasa (local API)              │
│     - Sonoff/Tasmota (HTTP/MQTT)            │
│     - Shelly devices (HTTP API)             │
│                                              │
│  2. Manual Override Interface                │
│     - Web UI toggle buttons                  │
│     - Mobile app integration                 │
│                                              │
│  3. Fallback Mode                            │
│     - Log control requests                   │
│     - Manual notification to staff           │
│                                              │
└──────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create unified plug interface** (`src/services/SmartPlugService.js`):

```javascript
// Support multiple brands with local APIs
class SmartPlugService {
    constructor() {
        this.supportedBrands = ['tplink', 'tasmota', 'shelly', 'manual'];
    }

    async controlPlug(plugConfig, action) {
        switch(plugConfig.brand) {
            case 'tplink':
                return await this.controlTPLink(plugConfig, action);
            case 'tasmota':
                return await this.controlTasmota(plugConfig, action);
            case 'shelly':
                return await this.controlShelly(plugConfig, action);
            default:
                return await this.manualControl(plugConfig, action);
        }
    }

    // TP-Link Kasa Local API (NO CLOUD)
    async controlTPLink(plug, action) {
        const command = action === 'on' ? 1 : 0;
        const response = await fetch(`http://${plug.ip_address}:9999`, {
            method: 'POST',
            body: JSON.stringify({
                system: {
                    set_relay_state: { state: command }
                }
            })
        });
        return response.ok;
    }

    // Tasmota (Sonoff with open firmware)
    async controlTasmota(plug, action) {
        const command = action === 'on' ? 'ON' : 'OFF';
        const response = await fetch(
            `http://${plug.ip_address}/cm?cmnd=Power%20${command}`,
            { method: 'GET' }
        );
        return response.ok;
    }

    // Shelly devices
    async controlShelly(plug, action) {
        const turn = action === 'on' ? 'on' : 'off';
        const response = await fetch(
            `http://${plug.ip_address}/relay/0?turn=${turn}`,
            { method: 'GET' }
        );
        return response.ok;
    }

    // Manual fallback
    async manualControl(plug, action) {
        // Show notification to staff
        showNotification(`Please manually turn ${action} plug: ${plug.name}`);
        // Log the request
        await axiosInstance.post('/plug-control-log', {
            plug_id: plug.id,
            action,
            method: 'manual',
            timestamp: new Date()
        });
        return true;
    }
}
```

2. **Update MapSmartPlug.jsx:**

Add brand selection and configuration:

```jsx
// Add to state
const [plugBrand, setPlugBrand] = useState('manual');

// Add to form
<Form.Group className="mb-3">
    <Form.Label>Plug Brand/Type</Form.Label>
    <Form.Select
        value={plugBrand}
        onChange={(e) => setPlugBrand(e.target.value)}
    >
        <option value="manual">Manual Control</option>
        <option value="tplink">TP-Link Kasa</option>
        <option value="tasmota">Sonoff/Tasmota</option>
        <option value="shelly">Shelly</option>
    </Form.Select>
</Form.Group>
```

3. **Add device discovery:**

```javascript
const discoverPlugs = async () => {
    setLoading(true);
    const discoveries = [];

    // Scan local network for compatible devices
    for (let i = 1; i <= 255; i++) {
        const ip = `192.168.1.${i}`;
        try {
            // Try TP-Link
            const tpResponse = await fetch(`http://${ip}:9999`, {timeout: 1000});
            if (tpResponse.ok) discoveries.push({ip, brand: 'tplink'});

            // Try Tasmota
            const tasmotaResponse = await fetch(`http://${ip}/cm?cmnd=Status`, {timeout: 1000});
            if (tasmotaResponse.ok) discoveries.push({ip, brand: 'tasmota'});

            // Try Shelly
            const shellyResponse = await fetch(`http://${ip}/status`, {timeout: 1000});
            if (shellyResponse.ok) discoveries.push({ip, brand: 'shelly'});
        } catch (err) {
            // Device not found or timeout
        }
    }

    setLoading(false);
    return discoveries;
};
```

4. **Add manual override UI:**

```jsx
// Always show manual control buttons
<div className="manual-override-panel">
    <h4>Manual Override</h4>
    <p className="text-muted">Use these controls if automatic control fails</p>

    <Button
        variant="success"
        onClick={() => manualToggle(plug.id, 'on')}
    >
        Manually Mark as ON
    </Button>

    <Button
        variant="danger"
        onClick={() => manualToggle(plug.id, 'off')}
    >
        Manually Mark as OFF
    </Button>
</div>
```

**Files to Create/Modify:**
- ✅ `src/services/SmartPlugService.js` (new)
- ✅ `src/Component/AdminDashboard/TablePlugSetup/MapSmartPlug.jsx` (modify)
- ✅ `src/Component/AdminDashboard/TablePlugSetup/PlugDiscovery.jsx` (new)

---

### PHASE 2: SELF-CONFIGURATION SYSTEM (Week 2)

#### Create Setup Wizard

**Location:** `src/components/Setup/SetupWizard.jsx` (new)

**Features:**

1. **Network Scanner**
```javascript
// Auto-discover devices on network
- Scan for printers (ports 9100, 515, 631)
- Scan for smart plugs (various ports/protocols)
- Detect POS hardware (cash drawers, card readers)
```

2. **Database Configuration**
```javascript
// Already using Railway API, but add:
- Connection test
- API key validation
- Endpoint verification
```

3. **Printer Test Station**
```jsx
<PrinterTestPanel>
  {discoveredPrinters.map(printer => (
    <div key={printer.id}>
      <h4>{printer.name}</h4>
      <Button onClick={() => testPrint(printer)}>
        Test Print
      </Button>
      <Button onClick={() => assignToPrinterType(printer, 'kitchen')}>
        Set as Kitchen Printer
      </Button>
    </div>
  ))}
</PrinterTestPanel>
```

4. **Configuration Templates**
```javascript
const templates = {
    quickService: {
        printerLayout: ['kitchen', 'receipt'],
        tableSessions: false,
        focusOn: 'speed'
    },
    fineDining: {
        printerLayout: ['kitchen', 'bar', 'receipt'],
        tableSessions: true,
        focusOn: 'experience'
    },
    barPub: {
        printerLayout: ['kitchen', 'bar'],
        tableSessions: true,
        smartPlugs: true,
        focusOn: 'entertainment'
    }
};
```

**Wizard Steps:**

```
Step 1: Welcome & Business Type Selection
  └─> Choose template (Quick Service, Fine Dining, Bar/Pub, etc.)

Step 2: Network Device Discovery
  └─> Auto-scan for printers and plugs
  └─> Manual add option

Step 3: Printer Configuration
  └─> Test each printer
  └─> Assign printer types (Kitchen/Bar/Receipt)
  └─> Set default printer for each category

Step 4: Table & Plug Setup (if applicable)
  └─> Create table types
  └─> Set hourly rates
  └─> Map smart plugs to tables

Step 5: Payment Configuration
  └─> Payment methods (Cash, Card, UPI, etc.)
  └─> Tax settings
  └─> Receipt format

Step 6: Menu Import
  └─> CSV/Excel upload
  └─> Manual entry
  └─> Copy from template

Step 7: Staff Setup
  └─> Create admin account
  └─> Add staff members
  └─> Set roles & permissions

Step 8: Test & Verify
  └─> Create test order
  └─> Print test receipt
  └─> Process test payment
  └─> Control test smart plug

Step 9: Go Live!
  └─> Mark setup as complete
  └─> Enable production mode
```

**Implementation Files:**
- ✅ `src/components/Setup/SetupWizard.jsx`
- ✅ `src/components/Setup/steps/BusinessTypeStep.jsx`
- ✅ `src/components/Setup/steps/DeviceDiscoveryStep.jsx`
- ✅ `src/components/Setup/steps/PrinterConfigStep.jsx`
- ✅ `src/components/Setup/steps/TableSetupStep.jsx`
- ✅ `src/components/Setup/steps/PaymentConfigStep.jsx`
- ✅ `src/components/Setup/steps/MenuImportStep.jsx`
- ✅ `src/components/Setup/steps/StaffSetupStep.jsx`
- ✅ `src/components/Setup/steps/TestVerifyStep.jsx`

---

### PHASE 3: HELP SYSTEM (Week 3)

#### Interactive Tutorial System

**Install React Joyride:**
```bash
npm install react-joyride
```

**Create Tutorial Components:**

1. **First-Time Setup Tour** (`src/components/Help/FirstTimeTour.jsx`):
```jsx
import Joyride from 'react-joyride';

const steps = [
    {
        target: '.printer-setup',
        content: 'Start here to configure your printers. Click to scan for printers automatically.',
        placement: 'bottom'
    },
    {
        target: '.table-management',
        content: 'Manage your tables and smart plugs here.',
        placement: 'right'
    },
    // ... more steps
];

<Joyride
    steps={steps}
    continuous
    showSkipButton
    styles={{
        options: {
            primaryColor: '#ffc107' // Warning color from theme
        }
    }}
/>
```

2. **Contextual Help Icons** (`src/components/Help/HelpIcon.jsx`):
```jsx
import { RiQuestionLine } from 'react-icons/ri';
import { OverlayTrigger, Popover } from 'react-bootstrap';

const HelpIcon = ({ title, content }) => {
    const popover = (
        <Popover>
            <Popover.Header>{title}</Popover.Header>
            <Popover.Body>{content}</Popover.Body>
        </Popover>
    );

    return (
        <OverlayTrigger trigger="click" placement="auto" overlay={popover}>
            <RiQuestionLine className="help-icon text-muted cursor-pointer" />
        </OverlayTrigger>
    );
};

// Usage in components:
<div className="d-flex align-items-center gap-2">
    <h2>Printer Setup</h2>
    <HelpIcon
        title="About Printers"
        content="Configure your kitchen, bar, and receipt printers here. The system supports network printers and will automatically discover devices on your network."
    />
</div>
```

3. **In-App Documentation** (`src/components/Help/HelpCenter.jsx`):
```jsx
const HelpCenter = () => {
    const sections = [
        {
            title: 'Getting Started',
            articles: [
                { title: 'First-Time Setup', video: 'setup.mp4' },
                { title: 'Adding Printers', video: 'printers.mp4' },
                { title: 'Creating Menu Items', video: 'menu.mp4' }
            ]
        },
        {
            title: 'Daily Operations',
            articles: [
                { title: 'Taking Orders', video: 'orders.mp4' },
                { title: 'Processing Payments', video: 'payments.mp4' },
                { title: 'Managing Tables', video: 'tables.mp4' }
            ]
        },
        {
            title: 'Troubleshooting',
            articles: [
                { title: 'Printer Not Working', content: troubleshootingGuide.printer },
                { title: 'Smart Plug Issues', content: troubleshootingGuide.plugs },
                { title: 'Payment Errors', content: troubleshootingGuide.payments }
            ]
        }
    ];

    return (
        <div className="help-center">
            <SearchBar placeholder="Search help articles..." />
            {sections.map(section => (
                <Section key={section.title} {...section} />
            ))}
        </div>
    );
};
```

4. **Smart Troubleshooting Assistant**:
```jsx
const TroubleshootingBot = () => {
    const [issue, setIssue] = useState('');
    const [solution, setSolution] = useState(null);

    const diagnose = async (issueDescription) => {
        // Pattern matching for common issues
        if (issueDescription.includes('printer')) {
            return {
                problem: 'Printer Issues',
                steps: [
                    'Check printer is powered on',
                    'Verify network connection',
                    'Check printer IP address',
                    'Try test print from Printer Setup',
                    'If still failing, use PDF fallback'
                ]
            };
        }
        // ... more patterns
    };

    return (
        <div className="troubleshooting-bot">
            <h3>What's the problem?</h3>
            <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Describe the issue you're facing..."
            />
            <Button onClick={() => diagnose(issue)}>
                Get Help
            </Button>
            {solution && <SolutionSteps steps={solution.steps} />}
        </div>
    );
};
```

**Add Help to Every Page:**
```jsx
// In each major component, add:
import HelpIcon from '../../Help/HelpIcon';

// In render:
<div className="page-header">
    <h1>Page Title</h1>
    <HelpIcon
        title="About This Page"
        content="Explanation of what this page does..."
    />
</div>
```

**Implementation Files:**
- ✅ `src/components/Help/FirstTimeTour.jsx`
- ✅ `src/components/Help/HelpIcon.jsx`
- ✅ `src/components/Help/HelpCenter.jsx`
- ✅ `src/components/Help/TroubleshootingBot.jsx`
- ✅ `src/components/Help/VideoPlayer.jsx`
- ✅ Update all major components to include help icons

---

## 📦 DEPENDENCIES TO ADD

```json
{
  "dependencies": {
    "escpos": "^3.0.0-alpha.6",
    "escpos-network": "^3.0.0-alpha.4",
    "qz-tray": "^2.2.0",
    "react-joyride": "^2.7.0",
    "mqtt": "^4.3.7"
  }
}
```

Install command:
```bash
npm install escpos escpos-network qz-tray react-joyride mqtt
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Week 1: Critical Fixes
- [ ] Implement PrinterService with fallbacks
- [ ] Update PrinterSetup.jsx with new service
- [ ] Add payment button to SessionTracker
- [ ] Create session payment flow
- [ ] Implement SmartPlugService
- [ ] Update MapSmartPlug.jsx
- [ ] Test all printer fallback options
- [ ] Test payment flow end-to-end
- [ ] Test smart plug manual override

### Week 2: Self-Configuration
- [ ] Build SetupWizard component
- [ ] Implement device discovery
- [ ] Create configuration templates
- [ ] Add auto-detection logic
- [ ] Build import/export for settings
- [ ] Test wizard with new installation
- [ ] Document wizard steps

### Week 3: Help System
- [ ] Install and configure React Joyride
- [ ] Create tutorial tours for each feature
- [ ] Add HelpIcon to all major pages
- [ ] Build HelpCenter with articles
- [ ] Record video tutorials (optional)
- [ ] Create troubleshooting guides
- [ ] Test help system usability

### Week 4: Testing & Polish
- [ ] End-to-end testing of complete system
- [ ] Load testing with simulated orders
- [ ] Printer testing (all types)
- [ ] Payment testing (all methods)
- [ ] Smart plug testing (all brands)
- [ ] Browser compatibility testing
- [ ] Mobile responsiveness check
- [ ] Documentation review
- [ ] Staff training materials
- [ ] Production deployment

---

## 🔧 CONFIGURATION FILES

### Printer Configuration Format
```json
{
  "printers": [
    {
      "id": "kitchen-01",
      "name": "Kitchen Printer",
      "type": "kitchen",
      "connection": "network",
      "ip": "192.168.1.100",
      "port": 9100,
      "fallback": "pdf"
    }
  ]
}
```

### Smart Plug Configuration Format
```json
{
  "plugs": [
    {
      "id": "plug-01",
      "name": "Pool Table 1",
      "brand": "tplink",
      "ip": "192.168.1.150",
      "mac": "AA:BB:CC:DD:EE:FF",
      "table_id": "table-01"
    }
  ]
}
```

---

## 📈 SUCCESS METRICS

### Technical Goals
- ✅ 100% printer functionality without cloud API
- ✅ Payment processing < 2 seconds
- ✅ 99.9% uptime
- ✅ Zero vendor lock-in
- ✅ Full offline capability
- ✅ < 30 minute setup for new installations

### Business Goals
- ✅ 50% reduction in setup time
- ✅ $0 monthly software fees (self-hosted)
- ✅ Staff trained in < 30 minutes
- ✅ Customer satisfaction > 4.5/5
- ✅ ROI achieved in 3 months

---

## 🆘 SUPPORT & RESOURCES

### Documentation to Create
1. **Quick Start Guide** - 1-page setup
2. **Daily Operations Manual** - Step-by-step procedures
3. **Troubleshooting Guide** - Common problems/solutions
4. **Video Tutorials** - 5-minute feature videos
5. **FAQ Database** - Searchable answers
6. **API Documentation** - For backend integration

### Training Materials
- Staff training videos (15 minutes total)
- Manager training course (1 hour)
- Printed quick reference cards
- Practice mode in software
- Certification program

---

## 🔐 SECURITY CONSIDERATIONS

### Current Security Measures
- JWT token authentication
- Token stored in localStorage
- Authorization header on API requests
- 401 redirect to login

### Recommendations
- Add token refresh mechanism
- Implement HTTPS for all connections
- Secure printer network (VLAN)
- Smart plug credentials encryption
- Regular security audits

---

## 📝 NOTES

### Backend API Dependency
The system currently depends on the Railway-hosted backend API. For complete offline capability, consider:
1. Dockerizing the backend
2. Local deployment option
3. API proxy/cache layer
4. Offline mode with sync queue

### Hardware Recommendations
- **Printers:** ESC/POS compatible thermal printers
- **Smart Plugs:** TP-Link Kasa, Sonoff with Tasmota, or Shelly
- **Network:** Dedicated VLAN for POS devices
- **Backup:** UPS for continuous operation

---

## 🎯 NEXT STEPS

1. **Review this plan** with stakeholders
2. **Set up development environment**
3. **Create Git branch** for each phase
4. **Begin Phase 1 implementation**
5. **Daily standups** to track progress
6. **Weekly demos** to show progress

---

**Document Version:** 1.0
**Last Updated:** November 20, 2025
**Maintained By:** Claude Code Implementation Team
