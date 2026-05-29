function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">
            Manage agency information, invoice prefix, currency, and system
            settings.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24 }}>
        <h3>Agency Settings</h3>

        <div className="form-group">
          <label className="form-label">Agency name</label>
          <input className="form-input" placeholder="Travel Agency Name" />
        </div>

        <div className="form-group">
          <label className="form-label">Agency phone</label>
          <input className="form-input" placeholder="+216 ..." />
        </div>

        <div className="form-group">
          <label className="form-label">Agency email</label>
          <input className="form-input" placeholder="agency@email.com" />
        </div>

        <div className="form-group">
          <label className="form-label">Currency</label>
          <input className="form-input" defaultValue="TND" />
        </div>

        <div className="form-group">
          <label className="form-label">Invoice prefix</label>
          <input className="form-input" defaultValue="INV" />
        </div>

        <button className="btn btn-primary">Save settings</button>
      </div>
    </div>
  );
}

export default SettingsPage;
