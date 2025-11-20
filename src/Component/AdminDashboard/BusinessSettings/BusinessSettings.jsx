import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import axios from 'axios';
import {
  RiDashboardLine,
  RiSettingsLine,
  RiPrinterLine,
  RiAlertLine,
  RiToggleLine,
  RiInformationLine,
  RiImageLine,
  RiWifiLine,
  RiTimeLine,
} from 'react-icons/ri';
import axiosInstance from '../../../utils/axiosInstance';

const BusinessSettings = () => {
  const [modes, setModes] = useState({
    restaurant: true,
    gamezone: true,
    lounge: false
  });

  const [systemOnline, setSystemOnline] = useState(true);
  const [logoPreview, setLogoPreview] = useState(null);
  const [footerMessage, setFooterMessage] = useState(
    "Thank you for visiting GameZone Central! Follow us @gamezonecenter for latest updates and events."
  );
  const [lastUpdated, setLastUpdated] = useState("January 15, 2025 at 14:30 PM");
  const [lastModeChange, setLastModeChange] = useState("January 15, 2025 at 9:15 AM");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessHours, setBusinessHours] = useState({
    weekdays: { start: "09:00", end: "18:00" },
    saturday: { start: "10:00", end: "20:00" },
    sunday: { start: "11:00", end: "17:00" }
  });
  const [tax, setTax] = useState('0.0');
  const [logoFile, setLogoFile] = useState(null);

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return "00:00";
    return timeString.substring(0, 5);
  };

  // Fetch business settings from API
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/business_settings');
        const data = response.data.data; // Access the data property from response

        // Update state with API data
        setModes({
          restaurant: data.restaurant_mode === 1,
          gamezone: data.gamezone_mode === 1,
          lounge: data.lounge_mode === 1
        });

        setSystemOnline(data.system_mode === "online");

        if (data.receipt_footer) {
          setFooterMessage(data.receipt_footer);
        }

        if (data.tax) {
          setTax(data.tax);
        }

        // Set business hours with formatted times
        setBusinessHours({
          weekdays: {
            start: formatTime(data.weekdays_start),
            end: formatTime(data.weekdays_end)
          },
          saturday: {
            start: formatTime(data.saturday_start),
            end: formatTime(data.saturday_end)
          },
          sunday: {
            start: formatTime(data.sunday_start),
            end: formatTime(data.sunday_end)
          }
        });

        if (data.receipt_logo) {
          setLogoPreview(data.receipt_logo);
        }

        // Format the updated_at timestamp for display
        if (data.updated_at) {
          const updatedDate = new Date(data.updated_at);
          const formattedDate = updatedDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          setLastUpdated(formattedDate);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching business settings:', err);
        setError('Failed to load business settings. Using default values.');
        setLoading(false);
      }
    };

    fetchBusinessSettings();
  }, []);

  const toggleMode = (mode) => {
    setModes(prev => ({
      ...prev,
      [mode]: !prev[mode]
    }));
    updateLastUpdated();
  };

  const toggleSystemMode = () => {
    setSystemOnline(!systemOnline);
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    setLastModeChange(now);
  };

  const updateLastUpdated = () => {
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setLastUpdated(now);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
  };

  const handleFooterChange = (e) => {
    setFooterMessage(e.target.value);
  };

  const handleBusinessHoursChange = (day, type, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  const saveChanges = async () => {
    try {
      // Prepare data to send to API
      const settingsData = {
        restaurant_mode: modes.restaurant ? 1 : 0,
        gamezone_mode: modes.gamezone ? 1 : 0,
        lounge_mode: modes.lounge ? 1 : 0,
        weekdays_start: businessHours.weekdays.start || "09:00",
        weekdays_end: businessHours.weekdays.end || "18:00",
        saturday_start: businessHours.saturday.start || "10:00",
        saturday_end: businessHours.saturday.end || "20:00",
        sunday_start: businessHours.sunday.start || "11:00",
        sunday_end: businessHours.sunday.end || "17:00",
        tax: tax || '0.0',
        receipt_footer: footerMessage,
        system_mode: systemOnline ? "online" : "offline",
      };

      const formData = new FormData();

      // Append all settings data
      Object.entries(settingsData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Append the logo file if it exists
      if (logoFile) {
        formData.append('receipt_logo', logoFile);
      } else if (logoPreview === null) {
        // If logo was removed, send null to clear it on the server
        formData.append('receipt_logo', '');
      }

      // Send PUT request to update settings
      const response = await axiosInstance.put(
        "/business_settings",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        updateLastUpdated();
        alert("Changes saved successfully!");
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert("Failed to save changes. Please try again.");
    }
  };

  const resetChanges = () => {
    // Reset to default values
    setModes({
      restaurant: true,
      gamezone: true,
      lounge: false
    });
    setSystemOnline(true);
    setLogoPreview(null);
    setLogoFile(null);
    setFooterMessage(
      "Thank you for visiting GameZone Central! Follow us @gamezonecenter for latest updates and events."
    );
    setBusinessHours({
      weekdays: { start: "09:00", end: "18:00" },
      saturday: { start: "10:00", end: "20:00" },
      sunday: { start: "11:00", end: "17:00" }
    });
    updateLastUpdated();
  };

  if (loading) {
    return (
      <div className="p-3 d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading business settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Main Content */}
      <div className="">
        {/* Header */}
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fs-3 fw-bold text-dark">
                Business Settings
              </h1>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className={`rounded-circle ${systemOnline ? 'bg-success' : 'bg-secondary'}`} style={{ width: '10px', height: '10px' }}></div>
              <span className="small text-muted">System {systemOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Offline Mode Banner */}
        {!systemOnline && (
          <div className="bg-warning rounded p-3 mb-4">
            <div className="d-flex align-items-center">
              <RiAlertLine className="text-white fs-5 me-3" />
              <div className="text-white">
                <div className="fw-medium">System is currently operating in offline mode</div>
                <div className="small opacity-90">Last switched: {lastModeChange}</div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Operation Modes Card */}
          <div className="col-lg-6">
            <div className="bg-white rounded shadow-sm border p-4">
              {/* Operation Modes Section */}
              <div className="d-flex align-items-center mb-4">
                <RiToggleLine className="text-dark fs-5 me-3" />
                <h2 className="fs-5 fw-semibold text-dark">Operation Modes</h2>
              </div>

              <div className="d-flex flex-column gap-4">
                {/* Restaurant Mode */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle ${modes.restaurant ? 'bg-success' : 'bg-secondary'} me-3`} style={{ width: '8px', height: '8px' }}></div>
                    <div>
                      <div className="fw-medium text-dark">Restaurant Mode</div>
                      <div className="small text-muted">Enable food ordering and dining services</div>
                    </div>
                    <div className="position-relative ms-2">
                      <RiInformationLine className="text-muted" />
                    </div>
                  </div>
                  <div
                    className={`rounded-pill  position-relative ${modes.restaurant ? 'bg-success' : 'bg-secondary'}`}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                    onClick={() => toggleMode('restaurant')}
                  >
                    <div
                      className="bg-white rounded-circle position-absolute top-1"
                      style={{
                        width: '20px',
                        height: '20px',
                        marginTop: '2px',
                        marginBottom: '2px',
                        left: modes.restaurant ? 'calc(100% - 22px)' : '2px',
                        transition: 'left 0.3s ease'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Game Zone Mode */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle ${modes.gamezone ? 'bg-success' : 'bg-secondary'} me-3`} style={{ width: '8px', height: '8px' }}></div>
                    <div>
                      <div className="fw-medium text-dark">Game Zone Mode</div>
                      <div className="small text-muted">Activate gaming area and arcade management</div>
                    </div>
                    <div className="position-relative ms-2">
                      <RiInformationLine className="text-muted" />
                    </div>
                  </div>
                  <div
                    className={`rounded-pill position-relative ${modes.gamezone ? 'bg-success' : 'bg-secondary'}`}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                    onClick={() => toggleMode('gamezone')}
                  >
                    <div
                      className="bg-white rounded-circle position-absolute top-1"
                      style={{
                        width: '20px',
                        height: '20px',
                        marginTop: '2px',
                        marginBottom: '2px',
                        left: modes.gamezone ? 'calc(100% - 22px)' : '2px',
                        transition: 'left 0.3s ease'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Lounge Mode */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle ${modes.lounge ? 'bg-success' : 'bg-secondary'} me-3`} style={{ width: '8px', height: '8px' }}></div>
                    <div>
                      <div className="fw-medium text-dark">Lounge Mode</div>
                      <div className="small text-muted">Enable relaxation area and social services</div>
                    </div>
                    <div className="position-relative ms-2">
                      <RiInformationLine className="text-muted" />
                    </div>
                  </div>
                  <div
                    className={`rounded-pill position-relative ${modes.lounge ? 'bg-success' : 'bg-secondary'}`}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                    onClick={() => toggleMode('lounge')}
                  >
                    <div
                      className="bg-white rounded-circle position-absolute top-1"
                      style={{
                        width: '20px',
                        height: '20px',
                        marginTop: '2px',
                        marginBottom: '2px',
                        left: modes.lounge ? 'calc(100% - 22px)' : '2px',
                        transition: 'left 0.3s ease'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Business Hours Section */}
              <div className="mt-5 pt-4 border-top">
                <div className="d-flex align-items-center mb-3">
                  <RiTimeLine className="text-dark fs-5 me-3" />
                  <h2 className="fs-5 fw-semibold text-dark">Business Hours</h2>
                </div>

                <div className="d-flex flex-column gap-3">
                  {/* Monday - Friday */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="fw-medium text-dark me-3">Weekdays</div>
                      {/* <div className="small text-muted">Mon - Fri</div> */}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Select
                        size="sm"
                        style={{ width: '100px' }}
                        value={businessHours.weekdays.start}
                        onChange={(e) => handleBusinessHoursChange('weekdays', 'start', e.target.value)}
                      >
                        <option value="00:00">00:00</option>
                        <option value="01:00">01:00</option>
                        <option value="02:00">02:00</option>
                        <option value="03:00">03:00</option>
                        <option value="04:00">04:00</option>
                        <option value="05:00">05:00</option>
                        <option value="06:00">06:00</option>
                        <option value="07:00">07:00</option>
                        <option value="08:00">08:00</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                      </Form.Select>
                      <span>to</span>
                      <Form.Select
                        size="sm"
                        style={{ width: '100px' }}
                        value={businessHours.weekdays.end}
                        onChange={(e) => handleBusinessHoursChange('weekdays', 'end', e.target.value)}
                      >
                        <option value="12:00">12:00</option>
                        <option value="13:00">13:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                        <option value="22:00">22:00</option>
                        <option value="23:00">23:00</option>
                        <option value="00:00">00:00</option>
                      </Form.Select>
                    </div>
                  </div>

                  {/* Saturday */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="fw-medium text-dark me-3">Saturday</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Select
                        size="sm"
                        style={{ width: '100px' }}
                        value={businessHours.saturday.start}
                        onChange={(e) => handleBusinessHoursChange('saturday', 'start', e.target.value)}
                      >
                        <option value="00:00">00:00</option>
                        <option value="01:00">01:00</option>
                        <option value="02:00">02:00</option>
                        <option value="03:00">03:00</option>
                        <option value="04:00">04:00</option>
                        <option value="05:00">05:00</option>
                        <option value="06:00">06:00</option>
                        <option value="07:00">07:00</option>
                        <option value="08:00">08:00</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                      </Form.Select>
                      <span>to</span>
                      <Form.Select
                        size="sm"
                        style={{ width: '100px' }}
                        value={businessHours.saturday.end}
                        onChange={(e) => handleBusinessHoursChange('saturday', 'end', e.target.value)}
                      >
                        <option value="12:00">12:00</option>
                        <option value="13:00">13:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                        <option value="22:00">22:00</option>
                        <option value="23:00">23:00</option>
                        <option value="00:00">00:00</option>
                      </Form.Select>
                    </div>
                  </div>

                  {/* Sunday */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="fw-medium text-dark me-3">Sunday</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Select
                        size="sm"
                        style={{ width: '100px' }}
                        value={businessHours.sunday.start}
                        onChange={(e) => handleBusinessHoursChange('sunday', 'start', e.target.value)}
                      >
                        <option value="00:00">00:00</option>
                        <option value="01:00">01:00</option>
                        <option value="02:00">02:00</option>
                        <option value="03:00">03:00</option>
                        <option value="04:00">04:00</option>
                        <option value="05:00">05:00</option>
                        <option value="06:00">06:00</option>
                        <option value="07:00">07:00</option>
                        <option value="08:00">08:00</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                      </Form.Select>
                      <span>to</span>
                      <Form.Select
                        size="sm"
                        style={{ width: '100px' }}
                        value={businessHours.sunday.end}
                        onChange={(e) => handleBusinessHoursChange('sunday', 'end', e.target.value)}
                      >
                        <option value="12:00">12:00</option>
                        <option value="13:00">13:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                        <option value="22:00">22:00</option>
                        <option value="23:00">23:00</option>
                        <option value="00:00">00:00</option>
                      </Form.Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top small text-muted">
                Last updated: {lastUpdated}
              </div>
            </div>
          </div>

          {/* Receipt Branding Card */}
          <div className="col-lg-6">
            <div className="bg-white rounded shadow-sm border p-4">
              <div className="d-flex align-items-center mb-4">
                <RiImageLine className="text-dark fs-5 me-3" />
                <h2 className="fs-5 fw-semibold text-dark">Receipt Customization</h2>
              </div>

              {/* Logo Section */}
              <div className="mb-4">
                <label className="d-block small fw-medium text-dark mb-2">Business Logo</label>
                <div className="d-flex align-items-start gap-3">
                  <div className="border border-2 border-dashed rounded d-flex align-items-center justify-content-center" style={{ width: '120px', height: '80px' }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-100 h-100 object-fit-contain rounded" />
                    ) : (
                      <div className="text-center">
                        <RiImageLine className="text-muted fs-4 mx-auto mb-1" />
                        <div className="small text-muted">No logo</div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <label htmlFor="logoUpload" className="btn btn-warning text-dark fw-medium cursor-pointer">
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      id="logoUpload"
                      className="d-none"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <button className="text-danger small text-start border-0 bg-transparent p-0" onClick={removeLogo}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="small text-muted mt-2">Recommended size: 300x200px, PNG or JPG format</div>
              </div>

              {/* Footer Text Section */}
              <div className="mb-4">
                <label className="d-block small fw-medium text-dark mb-2">Footer Message</label>
                <textarea
                  className="form-control mb-2"
                  rows="3"
                  placeholder="Enter custom footer message for receipts"
                  maxLength="200"
                  value={footerMessage}
                  onChange={handleFooterChange}
                ></textarea>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="small text-muted">This message will appear at the bottom of all receipts</div>
                  <div className={`small ${footerMessage.length > 180 ? 'text-danger' : 'text-muted'}`}>
                    {footerMessage.length}/200
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="d-block small fw-medium text-dark mb-2">Tax</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Enter custom Tax"
                  name='tax'
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                ></input>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3">
                <button className="btn btn-warning text-dark fw-medium" onClick={saveChanges}>
                  Save Changes
                </button>
                <button className="btn btn-outline-secondary fw-medium" onClick={resetChanges}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Offline Mode Card */}
          <div className="col-12">
            <div className="bg-white rounded shadow-sm border p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                  <RiWifiLine className="text-dark fs-5 me-3" />
                  <div>
                    <h2 className="fs-5 fw-semibold text-dark">System Mode</h2>
                    <div className="small text-muted">Switch between online and offline operation</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="small text-muted">Offline</span>
                  <div
                    className={`rounded-pill position-relative ${systemOnline ? 'bg-success' : 'bg-secondary'}`}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                    onClick={toggleSystemMode}
                  >
                    <div
                      className="bg-white rounded-circle position-absolute top-1"
                      style={{
                        width: '20px',
                        height: '20px',
                        left: systemOnline ? 'calc(100% - 22px)' : '2px',
                        transition: 'left 0.3s ease'
                      }}
                    ></div>
                  </div>
                  <span className="small text-muted">Online</span>
                </div>
              </div>

              <div className="bg-light rounded p-3">
                <div className="d-flex gap-3">
                  <RiInformationLine className="text-primary mt-1" />
                  <div className="small text-muted">
                    <div className="fw-medium mb-1">About System Modes:</div>
                    <div className="d-flex flex-column gap-1">
                      <div><strong>Online Mode:</strong> Full connectivity with cloud services, real-time updates, and remote monitoring.</div>
                      <div><strong>Offline Mode:</strong> Local operation only, data syncs when connection is restored.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 small text-muted">
                Last mode change: {lastModeChange}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;