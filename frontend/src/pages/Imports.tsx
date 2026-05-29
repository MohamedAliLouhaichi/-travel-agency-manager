import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

export default function ImportsPage() {
  const [importType, setImportType] = useState('CUSTOMER');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose a CSV or Excel file first.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithAuth(`/imports/upload?importType=${importType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Import failed');
      }

      setMessage('File imported successfully.');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">CSV / Excel Imports</h2>
          <p className="page-subtitle">
            Import old agency data from CSV or Excel files.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24, maxWidth: 720 }}>
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Import type</label>
          <select
            className="form-select"
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
          >
            <option value="CUSTOMER">Customers</option>
            <option value="HOTEL_BOOKING">Hotel bookings</option>
            <option value="FLIGHT_BOOKING">Flight bookings</option>
            <option value="PAYMENT">Payments</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">File</label>
          <input
            className="form-input"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {file && (
          <div className="glass-panel" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <FileSpreadsheet size={22} />
              <div>
                <strong>{file.name}</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
          <Upload size={18} />
          {loading ? 'Importing...' : 'Upload and Import'}
        </button>
      </div>
    </div>
  );
}
