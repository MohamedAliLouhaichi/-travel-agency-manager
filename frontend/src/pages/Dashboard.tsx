import { useEffect, useState } from 'react';
import { fetchWithAuth, getCurrentUser } from '../utils/api';
import {
  Users,
  Compass,
  TrendingUp,
  AlertCircle,
  Activity,
  Star,
  Hotel,
  PlaneTakeoff,
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  bookingsByType: {
    HOTEL: number;
    FLIGHT: number;
  };
  totalRevenue: string | number;
  totalPaid: string | number;
  totalUnpaid: string | number;
}

interface TopCustomer {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  totalBookings: number;
  totalValue: string | number;
  totalPaid: string | number;
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

type BookingStatusStats = Record<string, number>;

export default function Dashboard() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [bookingStatusStats, setBookingStatusStats] = useState<BookingStatusStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        if (isAdmin) {
          const [overviewRes, topCustomersRes, recentRes] = await Promise.all([
            fetchWithAuth('/dashboard/overview'),
            fetchWithAuth('/dashboard/top-customers'),
            fetchWithAuth('/dashboard/recent-activity'),
          ]);

          if (!overviewRes.ok || !topCustomersRes.ok || !recentRes.ok) {
            throw new Error('Failed to fetch admin dashboard data');
          }

          const statsData = await overviewRes.json();
          const topCustomersData = await topCustomersRes.json();
          const recentData = await recentRes.json();

          setStats(statsData);
          setTopCustomers(Array.isArray(topCustomersData) ? topCustomersData : []);
          setRecentActivities(Array.isArray(recentData) ? recentData : []);
        } else {
          const [statusRes, recentRes] = await Promise.all([
            fetchWithAuth('/dashboard/bookings-by-status'),
            fetchWithAuth('/dashboard/recent-activity'),
          ]);

          if (!statusRes.ok || !recentRes.ok) {
            throw new Error('Failed to fetch operational dashboard data');
          }

          const statusData = await statusRes.json();
          const recentData = await recentRes.json();

          setBookingStatusStats(
            statusData && typeof statusData === 'object' && !Array.isArray(statusData)
              ? statusData
              : {},
          );
          setRecentActivities(Array.isArray(recentData) ? recentData : []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isAdmin]);

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

  const getStatusCount = (statusName: string) => {
    return Number(bookingStatusStats[statusName.toUpperCase()] ?? 0);
  };

  const totalOperationalBookings = Object.values(bookingStatusStats).reduce((total, count) => {
    return total + Number(count);
  }, 0);

  if (loading) {
    return (
      <div className="center-flex" style={{ height: '100%' }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>
          Loading dashboard data...
        </p>
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
          <h2 className="page-title">
            {isAdmin ? 'Executive Dashboard' : 'Operational Dashboard'}
          </h2>
          <p className="page-subtitle">
            {isAdmin
              ? 'Financial analytics and agency performance overview'
              : 'Daily booking operations and recent activity'}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <>
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
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Hotel size={12} /> {stats?.bookingsByType?.HOTEL || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <PlaneTakeoff size={12} /> {stats?.bookingsByType?.FLIGHT || 0}
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
                <h3 className="stat-value" style={{ fontSize: '1.45rem' }}>
                  {formatCurrency(stats?.totalRevenue)}
                </h3>
              </div>
              <div className="stat-icon" style={{ color: 'var(--secondary)' }}>
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <p className="stat-label">Unpaid Balance</p>
                <h3
                  className="stat-value"
                  style={{ fontSize: '1.45rem', color: 'var(--danger)' }}
                >
                  {formatCurrency(stats?.totalUnpaid)}
                </h3>
              </div>
              <div className="stat-icon" style={{ color: 'var(--danger)' }}>
                <AlertCircle size={22} />
              </div>
            </div>
          </div>

          <div className="dashboard-row">
            <RecentActivityTable
              recentActivities={recentActivities}
              getActionColor={getActionColor}
            />

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <Star size={20} color="var(--warning)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Top Customers
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {topCustomers.length === 0 ? (
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      padding: '20px',
                    }}
                  >
                    No customer spending found
                  </p>
                ) : (
                  topCustomers.map((cust) => (
                    <div
                      key={cust.customer.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--border-glass)',
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          {cust.customer.firstName} {cust.customer.lastName}
                        </h4>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {cust.totalBookings} bookings recorded
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'var(--secondary)',
                          }}
                        >
                          {formatCurrency(cust.totalValue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid-4">
            <div className="glass-panel stat-card">
              <div>
                <p className="stat-label">Total Operational Bookings</p>
                <h3 className="stat-value">{totalOperationalBookings}</h3>
              </div>
              <div className="stat-icon">
                <ClipboardList size={22} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <p className="stat-label">Pending Bookings</p>
                <h3 className="stat-value">{getStatusCount('PENDING')}</h3>
              </div>
              <div className="stat-icon" style={{ color: 'var(--warning)' }}>
                <Clock size={22} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <p className="stat-label">Confirmed Bookings</p>
                <h3 className="stat-value">{getStatusCount('CONFIRMED')}</h3>
              </div>
              <div className="stat-icon" style={{ color: 'var(--success)' }}>
                <CheckCircle size={22} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <p className="stat-label">Cancelled Bookings</p>
                <h3 className="stat-value">{getStatusCount('CANCELLED')}</h3>
              </div>
              <div className="stat-icon" style={{ color: 'var(--danger)' }}>
                <XCircle size={22} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', marginBottom: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              You are using an operational account. Financial information such as
              revenue, unpaid balance, and top customers by spending is reserved
              for the chef d'agence.
            </p>
          </div>

          <div className="dashboard-row">
            <RecentActivityTable
              recentActivities={recentActivities}
              getActionColor={getActionColor}
            />
          </div>
        </>
      )}
    </div>
  );
}

function RecentActivityTable({
  recentActivities,
  getActionColor,
}: {
  recentActivities: RecentActivity[];
  getActionColor: (action: string) => string;
}) {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <Activity size={20} color="var(--primary)" />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
          System Logs & Activity
        </h3>
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
                <td
                  colSpan={4}
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '20px',
                  }}
                >
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
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {act.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
