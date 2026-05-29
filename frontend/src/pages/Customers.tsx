import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  X,
  AlertCircle,
  FileText,
  Calendar,
  Compass
} from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  dateOfBirth?: string;
  notes?: string;
  createdAt: string;
  bookings?: any[];
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal forms states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [notes, setNotes] = useState('');

  // Details View states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  async function loadCustomers() {
    try {
      setLoading(true);
      const endpoint = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
      const res = await fetchWithAuth(endpoint);
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNationality('');
    setPassportNumber('');
    setPassportExpiry('');
    setDateOfBirth('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingId(cust.id);
    setFirstName(cust.firstName);
    setLastName(cust.lastName);
    setEmail(cust.email);
    setPhone(cust.phone);
    setAddress(cust.address || '');
    setNationality(cust.nationality || '');
    setPassportNumber(cust.passportNumber || '');
    
    // Format dates correctly for inputs (YYYY-MM-DD)
    setPassportExpiry(cust.passportExpiry ? cust.passportExpiry.substring(0, 10) : '');
    setDateOfBirth(cust.dateOfBirth ? cust.dateOfBirth.substring(0, 10) : '');
    setNotes(cust.notes || '');
    setIsModalOpen(true);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/customers/${id}`);
      const data = await res.json();
      setSelectedCustomer(data);
      setIsDetailOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      address: address || null,
      nationality: nationality || null,
      passportNumber: passportNumber || null,
      passportExpiry: passportExpiry ? new Date(passportExpiry).toISOString() : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      notes: notes || null,
    };

    try {
      let res;
      if (editingId) {
        res = await fetchWithAuth(`/customers/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Operation failed');
      }

      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    }
  };

  const formatDate = (dString?: string) => {
    if (!dString) return 'N/A';
    return new Date(dString).toLocaleDateString('en-GB');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers Directory</h2>
          <p className="page-subtitle">Add, edit and monitor travel customer records</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="search-container">
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <Search 
            size={18} 
            color="var(--text-secondary)" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search by name, phone, email, passport number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Customers List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div className="center-flex">
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Searching directory...</p>
          </div>
        ) : error ? (
          <div className="center-flex">
            <AlertCircle size={36} color="var(--danger)" />
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="center-flex">
            <p style={{ color: 'var(--text-secondary)' }}>No customers found matching criteria</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>Passport</th>
                  <th>Nationality</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust.id}>
                    <td style={{ fontWeight: 600 }}>{cust.firstName} {cust.lastName}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{cust.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cust.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {cust.passportNumber ? (
                        <>
                          <div>{cust.passportNumber}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Exp: {formatDate(cust.passportExpiry)}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>{cust.nationality || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleViewDetail(cust.id)}
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleOpenEdit(cust)}
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Customer Info' : 'New Customer Profile'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="passportNumber">Passport Number</label>
                  <input
                    id="passportNumber"
                    type="text"
                    className="form-input"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="passportExpiry">Passport Expiry Date</label>
                  <input
                    id="passportExpiry"
                    type="date"
                    className="form-input"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    className="form-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="nationality">Nationality</label>
                  <input
                    id="nationality"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tunisian"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">Internal Notes</label>
                <textarea
                  id="notes"
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {isDetailOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Customer Dossier: {selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-section">
              <h4>Contact & Profile Info</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-val">{selectedCustomer.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-val">{selectedCustomer.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-val">{formatDate(selectedCustomer.dateOfBirth)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nationality</span>
                  <span className="detail-val">{selectedCustomer.nationality || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Passport Number</span>
                  <span className="detail-val">{selectedCustomer.passportNumber || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Passport Expiry</span>
                  <span className="detail-val">{formatDate(selectedCustomer.passportExpiry)}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Address</span>
                  <span className="detail-val">{selectedCustomer.address || 'N/A'}</span>
                </div>
              </div>
              {selectedCustomer.notes && (
                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                  <span className="detail-label">Notes</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h4>Booking History</h4>
              {selectedCustomer.bookings?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No bookings registered for this customer.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Destination</th>
                        <th>Dates</th>
                        <th>Total</th>
                        <th>Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.bookings?.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                              <Compass size={12} color="var(--primary)" /> {b.bookingType}
                            </span>
                          </td>
                          <td>{b.destination}</td>
                          <td>
                            {formatDate(b.startDate)} - {formatDate(b.endDate)}
                          </td>
                          <td style={{ fontWeight: 600 }}>{Number(b.totalPrice).toFixed(3)} TND</td>
                          <td>
                            <span className={`badge ${
                              b.paymentStatus === 'PAID' ? 'badge-success' :
                              b.paymentStatus === 'PARTIALLY_PAID' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setIsDetailOpen(false)}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
