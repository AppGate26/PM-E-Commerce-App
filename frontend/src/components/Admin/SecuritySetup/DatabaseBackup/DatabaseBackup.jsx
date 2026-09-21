import React, { useMemo, useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import { apiRequest } from "../../../../lib/config";

const DatabaseBackup = () => {
  const [databaseVersion, setDatabaseVersion] = useState("MYSQL");
  const [fileNamingType, setFileNamingType] = useState("REPLACEMENT FILE");
  const [backupLocation, setBackupLocation] = useState("");
  const [backupFileName, setBackupFileName] = useState("PM_DATAS_BACKUP");
  const [mainConnection, setMainConnection] = useState("PM SERVER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logs, setLogs] = useState([
    "Backup process is standing by.",
  ]);

  const latestLog = useMemo(() => logs[logs.length - 1], [logs]);

  const addLog = (message) => {
    setLogs((current) => [...current, message]);
  };

  const handleBackup = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setLogs(["Backup request started."]);

    try {
      const backupData = {
        databaseVersion,
        fileNamingType,
        backupFileName,
        mainConnection,
        backupLocation: backupLocation || "/backups/",
      };

      addLog("Preparing backup payload.");
      await apiRequest("/admin/security/backup", "POST", backupData);
      addLog("Backup endpoint accepted the request.");
      setSuccess("Database backup request completed successfully.");
    } catch (backupError) {
      addLog(`Backup failed: ${backupError?.message || "Unknown error"}`);
      setError(backupError?.message || "Backup operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Database Backup</h1>
            <p>
              Trigger a backup request and keep a visible record of the backup configuration
              and status log in one standard admin layout.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Latest Status</span>
            <strong>{loading ? "Running" : "Ready"}</strong>
          </div>
        </section>

        {error ? (
          <div className="security-alert security-alert-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Close
            </button>
          </div>
        ) : null}

        {success ? (
          <div className="security-alert security-alert-success">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}>
              Close
            </button>
          </div>
        ) : null}

        <section className="security-layout security-grid-2">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>Backup Configuration</h2>
                <p>Choose the database settings and storage details before you run a backup.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-form-grid two">
                <div className="security-field">
                  <label htmlFor="dbVersion">Database Version</label>
                  <select id="dbVersion" className="security-select" value={databaseVersion} onChange={(event) => setDatabaseVersion(event.target.value)}>
                    <option value="MYSQL">MYSQL</option>
                    <option value="POSTGRESQL">POSTGRESQL</option>
                    <option value="COCKROACHDB">COCKROACHDB</option>
                  </select>
                </div>
                <div className="security-field">
                  <label htmlFor="fileNamingType">File Naming Type</label>
                  <select id="fileNamingType" className="security-select" value={fileNamingType} onChange={(event) => setFileNamingType(event.target.value)}>
                    <option value="REPLACEMENT FILE">Replacement File</option>
                    <option value="INCREMENTAL FILE">Incremental File</option>
                  </select>
                </div>
                <div className="security-field">
                  <label htmlFor="mainConnection">Main Connection</label>
                  <input id="mainConnection" className="security-input" value={mainConnection} onChange={(event) => setMainConnection(event.target.value)} />
                </div>
                <div className="security-field">
                  <label htmlFor="backupLocation">Backup Location</label>
                  <input id="backupLocation" className="security-input" value={backupLocation} onChange={(event) => setBackupLocation(event.target.value)} placeholder="/backups/" />
                </div>
                <div className="security-field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="backupFileName">Backup File Name</label>
                  <input id="backupFileName" className="security-input" value={backupFileName} onChange={(event) => setBackupFileName(event.target.value)} />
                </div>
              </div>
              <div className="security-actions" style={{ marginTop: "16px" }}>
                <button className="security-btn security-btn-primary" type="button" onClick={handleBackup} disabled={loading}>
                  {loading ? "Running Backup..." : "Run Backup"}
                </button>
              </div>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h3>Backup Activity</h3>
                <p>Track the latest backup message and the current configuration snapshot.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-kv">
                <div className="security-kv-item">
                  <span>Latest Log</span>
                  <strong>{latestLog}</strong>
                </div>
                <div className="security-kv-item">
                  <span>File Name</span>
                  <strong>{backupFileName}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Destination</span>
                  <strong>{backupLocation || "/backups/"}</strong>
                </div>
              </div>
              <div className="security-note" style={{ marginTop: "16px" }}>
                This page submits the backup request to the backend and records the visible
                status here. Actual file storage still depends on backend backup configuration.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DatabaseBackup;
