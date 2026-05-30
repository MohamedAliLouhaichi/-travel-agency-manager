import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { 
  Activity, 
  AlertCircle,
  Clock,
  User,
  Filter
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedAction, selectedEntity]);

  async function loadTypes() {
    try {
      const [actionsRes, entitiesRes] = await Promise.all([
        fetchWithAuth('/activity-logs/action-types'),
        fetchWithAuth('/activity-logs/entity-types')
      ]);

      if (actionsRes.ok && entitiesRes.ok) {
        setActionTypes(await actionsRes.json());
        setEntityTypes(await entitiesRes.json());
      }
    } catch (e) {
      // Ignore
    }
  }

  async function loadLogs() {
    try {
      setLoading(true);
      let query = [];
      if (selectedAction) query.push(`action=${selectedAction}`);
      if (selectedEntity) query.push(`entityType=${selectedEntity}`);

      const endpoint = query.length > 0 ? `/activity-logs?${query.join('&')}` : '/activity-logs';
      const res = await fetchWithAuth(endpoint);
      const data = await res.json();
      
      // The endpoint might return pagination metadata { data, total, page, limit } or just the array of logs
      if (data.data && Array.isArray(data.data)) {
        setLogs(data.data);
      } else if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT')) return 'badge-success';
    if (action.includes('UPDATE')) return 'badge-warning';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'badge-danger';
    return 'badge-primary';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">System Audit Trails</h2>
          <p className="page-subtitle">Security logging and tracking of all operator actions</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="search-container">
        <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Action Type</label>
            <select
              className="form-select"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="">All Actions</option>
              {actionTypes.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Entity Type</label>
            <select
              className="form-select"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
            >
              <option value="">All Entities</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {(selectedAction || selectedEntity) && (
            <button 
              className="btn btn-outline" 
              style={{ marginTop: '20px' }}
              onClick={() => {
                setSelectedAction('');
                setSelectedEntity('');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Log list panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div className="center-flex">
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Retrieving audit trails...</p>
          </div>
        ) : error ? (
          <div className="center-flex">
            <AlertCircle size={36} color="var(--danger)" />
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="center-flex">
            <p style={{ color: 'var(--text-secondary)' }}>No logs registered in system database</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Operator</th>
                  <th>Audit Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.entityType}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                        <User size={12} color="var(--text-secondary)" /> {log.user?.fullName || 'System'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
