import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Lock, Save } from 'lucide-react';
import { fetchWithAuth, getCurrentUser } from '../utils/api';

interface SettingsForm {
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  agencyEmail: string;
  currency: string;
  invoicePrefix: string;
}

const EMPTY_SETTINGS: SettingsForm = {
  agencyName: '',
  agencyAddress: '',
  agencyPhone: '',
  agencyEmail: '',
  currency: 'TND',
  invoicePrefix: 'INV',
};

function SettingsPage() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [settings, setSettings] = useState<SettingsForm>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError('');

        const response = await fetchWithAuth(isAdmin ? '/settings' : '/settings/agency-info');
        if (!response.ok) {
          throw new Error('Failed to load agency settings');
        }

        const data = await response.json();
        setSettings({
          agencyName: data.agency_name ?? data.agencyName ?? '',
          agencyAddress: data.agency_address ?? data.agencyAddress ?? '',
          agencyPhone: data.agency_phone ?? data.agencyPhone ?? '',
          agencyEmail: data.agency_email ?? data.agencyEmail ?? '',
          currency: data.currency ?? 'TND',
          invoicePrefix: data.invoice_prefix ?? data.invoicePrefix ?? 'INV',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load agency settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [isAdmin]);

  const updateField = (field: keyof SettingsForm, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError('');
    setMessage('');

    const updates = [
      ['agency_name', settings.agencyName],
      ['agency_address', settings.agencyAddress],
      ['agency_phone', settings.agencyPhone],
      ['agency_email', settings.agencyEmail],
      ['currency', settings.currency],
      ['invoice_prefix', settings.invoicePrefix],
    ];

    try {
      const responses = await Promise.all(
        updates.map(([key, value]) =>
          fetchWithAuth(`/settings/${key}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
          }),
        ),
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error('Some settings could not be saved');
      }

      setMessage('Agency settings saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save agency settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="center-flex" style={{ height: '100%' }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading agency settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage agency information, invoice prefix, and currency.'
              : 'View the agency contact and billing configuration.'}
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24, maxWidth: 760 }}>
        {!isAdmin && (
          <div className="alert" style={{ color: 'var(--text-secondary)', background: 'var(--surface-soft)' }}>
            <Lock size={17} />
            Only chef accounts can modify agency settings.
          </div>
        )}

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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="agency-name">Agency name</label>
            <input
              id="agency-name"
              className="form-input"
              value={settings.agencyName}
              onChange={(event) => updateField('agencyName', event.target.value)}
              disabled={!isAdmin}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="agency-address">Agency address</label>
            <input
              id="agency-address"
              className="form-input"
              value={settings.agencyAddress}
              onChange={(event) => updateField('agencyAddress', event.target.value)}
              disabled={!isAdmin}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="agency-phone">Agency phone</label>
              <input
                id="agency-phone"
                className="form-input"
                value={settings.agencyPhone}
                onChange={(event) => updateField('agencyPhone', event.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="agency-email">Agency email</label>
              <input
                id="agency-email"
                type="email"
                className="form-input"
                value={settings.agencyEmail}
                onChange={(event) => updateField('agencyEmail', event.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="currency">Currency</label>
              <input
                id="currency"
                className="form-input"
                value={settings.currency}
                onChange={(event) => updateField('currency', event.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invoice-prefix">Invoice prefix</label>
              <input
                id="invoice-prefix"
                className="form-input"
                value={settings.invoicePrefix}
                onChange={(event) => updateField('invoicePrefix', event.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Save size={17} />
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;
