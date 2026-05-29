import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  X,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  issueDate: string;
  totalAmount: string | number;
  paidAmount: string | number;
  remainingAmount: string | number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  booking: {
    bookingType: 'HOTEL' | 'FLIGHT';
    destination: string;
  };
  generatedByUser?: {
    fullName: string;
  };
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [customerId, setCustomerId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [customerId, bookingId, dateFrom, dateTo]);

  async function loadInvoices() {
    try {
      setLoading(true);
      let query = [];
      if (customerId) query.push(`customerId=${customerId}`);
      if (bookingId) query.push(`bookingId=${bookingId}`);
      if (dateFrom) query.push(`dateFrom=${dateFrom}`);
      if (dateTo) query.push(`dateTo=${dateTo}`);

      const endpoint = query.length > 0 ? `/invoices?${query.join('&')}` : '/invoices';
      const res = await fetchWithAuth(endpoint);
      const data = await res.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/invoices/${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
      setIsDetailOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load invoice details');
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await fetchWithAuth(`/invoices/${invoiceId}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Download failed');
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
          <h2 className="page-title">Invoices Directory</h2>
          <p className="page-subtitle">View billing history and download PDF invoices</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="search-container" style={{ flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexGrow: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Issue Date From</label>
            <input 
              type="date" 
              className="form-input" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Issue Date To</label>
            <input 
              type="date" 
              className="form-input" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {(dateFrom || dateTo || customerId || bookingId) && (
          <button 
            className="btn btn-outline" 
            style={{ marginTop: '20px' }}
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setCustomerId('');
              setBookingId('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Invoices List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div className="center-flex">
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Retrieving billing records...</p>
          </div>
        ) : error ? (
          <div className="center-flex">
            <AlertCircle size={36} color="var(--danger)" />
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="center-flex">
            <p style={{ color: 'var(--text-secondary)' }}>No invoices generated yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Booking Reference</th>
                  <th>Issue Date</th>
                  <th>Amount Due</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} /> {inv.invoiceNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{inv.customer.firstName} {inv.customer.lastName}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{inv.booking.bookingType}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inv.booking.destination}</div>
                    </td>
                    <td>{formatDate(inv.issueDate)}</td>
                    <td style={{ fontWeight: 700 }}>{Number(inv.totalAmount).toFixed(3)} TND</td>
                    <td>
                      {Number(inv.remainingAmount) === 0 ? (
                        <span className="badge badge-success">PAID</span>
                      ) : (
                        <span className="badge badge-danger">{Number(inv.remainingAmount).toFixed(3)} TND</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleViewDetail(inv.id)}
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        >
                          <Download size={14} /> PDF
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

      {/* Invoice Detail Modal */}
      {isDetailOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Invoice: {selectedInvoice.invoiceNumber}</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-section">
              <h4>General Info</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Invoice Number</span>
                  <span className="detail-val" style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Issue Date</span>
                  <span className="detail-val">{formatDate(selectedInvoice.issueDate)}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Generated By Staff</span>
                  <span className="detail-val">{selectedInvoice.generatedByUser?.fullName || 'System'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Customer Information</h4>
              <div className="detail-grid">
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Full Name</span>
                  <span className="detail-val" style={{ fontWeight: 600 }}>{selectedInvoice.customer.firstName} {selectedInvoice.customer.lastName}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Email Address</span>
                  <span className="detail-val">{selectedInvoice.customer.email}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Booking Reference</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Booking Type</span>
                  <span className="detail-val">{selectedInvoice.booking.bookingType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Destination</span>
                  <span className="detail-val">{selectedInvoice.booking.destination}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Financial Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <div className="detail-item">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-val" style={{ fontWeight: 700 }}>{Number(selectedInvoice.totalAmount).toFixed(3)} TND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Paid Amount</span>
                  <span className="detail-val" style={{ fontWeight: 700, color: 'var(--secondary)' }}>{Number(selectedInvoice.paidAmount).toFixed(3)} TND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Remaining Balance</span>
                  <span className="detail-val" style={{ fontWeight: 700, color: Number(selectedInvoice.remainingAmount) > 0 ? 'var(--danger)' : 'var(--secondary)' }}>
                    {Number(selectedInvoice.remainingAmount).toFixed(3)} TND
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '30px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
              >
                <Download size={16} /> Download Invoice (PDF)
              </button>
              <button className="btn btn-outline" onClick={() => setIsDetailOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
