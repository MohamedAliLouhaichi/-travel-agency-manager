import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { 
  Users, 
  Compass, 
  TrendingUp, 
  AlertCircle, 
  Activity, 
  Star,
  Hotel,
  PlaneTakeoff
} from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  hotelBookingsCount: number;
  flightBookingsCount: number;
  totalRevenue: string | number;
  totalPaid: string | number;
  totalUnpaid: string | number;
}

interface TopCustomer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingCount: number;
  totalSpent: string | number;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  description: string;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Fetch stats & lists concurrently
        const [overviewRes, topCustomersRes, recentRes] = await Promise.all([
          fetchWithAuth('/dashboard/overview'),
          fetchWithAuth('/dashboard/top-customers'),
          fetchWithAuth('/dashboard/recent-activity')
        ]);

        const statsData = await overviewRes.json();
        const topCustomersData = await topCustomersRes.json();
        const recentData = await recentRes.json();

        setStats(statsData);
        setTopCustomers(topCustomersData);
        setRecentActivities(recentData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatCurrency = (val: string | number | undefined) => {
    if (val === undefined) return '0.000 TND';
    return `${Number(val).toFixed(3)} TND`;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'badge-success';
    if (action.includes('UPDATE')) return 'badge-warning';
    if (action.includes('DELETE')) return 'badge-danger';
    return 'badge-primary';
  };

  if (loading) {
    return (
      <div className="center-flex" style={{ height: '100%' }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Analyzing business metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-flex" style={{ height: '100%' }}>
        <AlertCircle size={48} color="var(--danger)" />
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Dashboard</h2>
          <p className="page-subtitle">Real-time financial analytics and operations tracker</p>
        </div>
      </div>

      {/* Main stats blocks */}
      <div className="grid-4">
        <div className="glass-panel stat-card">
          <div>
            <p className="stat-label">Total Customers</p>
            <h3 className="stat-value">{stats?.totalCustomers || 0}</h3>
          </div>
          <div className="stat-icon">
            <Users size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <p className="stat-label">Total Bookings</p>
            <h3 className="stat-value">{stats?.totalBookings || 0}</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Hotel size={12} /> {stats?.hotelBookingsCount || 0}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <PlaneTakeoff size={12} /> {stats?.flightBookingsCount || 0}
              </span>
            </div>
          </div>
          <div className="stat-icon">
            <Compass size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <p className="stat-label">Gross Revenue</p>
            <h3 className="stat-value" style={{ fontSize: '1.45rem' }}>{formatCurrency(stats?.totalRevenue)}</h3>
          </div>
          <div className="stat-icon" style={{ color: 'var(--secondary)' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <p className="stat-label">Unpaid Balance</p>
            <h3 className="stat-value" style={{ fontSize: '1.45rem', color: 'var(--danger)' }}>
              {formatCurrency(stats?.totalUnpaid)}
            </h3>
          </div>
          <div className="stat-icon" style={{ color: 'var(--danger)' }}>
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* Recent System Activity Logs */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>System Logs & Activity</h3>
          </div>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Audit Description</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                      No activity registered yet
                    </td>
                  </tr>
                ) : (
                  recentActivities.map((act) => (
                    <tr key={act.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${getActionColor(act.action)}`}>
                          {act.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{act.user?.fullName || 'System'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{act.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top customers block */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Star size={20} color="var(--warning)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Top Customers</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {topCustomers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                No customer spendings found
              </p>
            ) : (
              topCustomers.map((cust) => (
                <div 
                  key={cust.customerId} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-glass)'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {cust.firstName} {cust.lastName}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {cust.bookingCount} bookings recorded
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      {formatCurrency(cust.totalSpent)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
