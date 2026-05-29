import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { 
  Plus, 
  Search, 
  Eye, 
  X,
  AlertCircle,
  Hotel,
  PlaneTakeoff,
  Filter,
  DollarSign,
  FileText
} from 'lucide-react';

interface Booking {
  id: string;
  customerId: string;
  bookingType: 'HOTEL' | 'FLIGHT';
  destination: string;
  startDate: string;
  endDate: string;
  totalPrice: string | number;
  paidAmount: string | number;
  remainingAmount: string | number;
  bookingStatus: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  notes?: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  hotelBooking?: any;
  flightBooking?: any;
  payments?: any[];
}

interface CustomerList {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<CustomerList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form type
  const [activeFormType, setActiveFormType] = useState<'HOTEL' | 'FLIGHT'>('HOTEL');

  // Common Form Fields
  const [customerId, setCustomerId] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [notes, setNotes] = useState('');

  // Hotel Specific Form Fields
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCountry, setHotelCountry] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfNights, setNumberOfNights] = useState(1);
  const [roomType, setRoomType] = useState('Standard');
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [boardType, setBoardType] = useState('Room Only');
  const [confirmationNumber, setConfirmationNumber] = useState('');

  // Flight Specific Form Fields
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureDatetime, setDepartureDatetime] = useState('');
  const [arrivalDatetime, setArrivalDatetime] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [ticketNumber, setTicketNumber] = useState('');
  const [reservationReference, setReservationReference] = useState('');

  // Payment Form within Detail modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadBookings();
    loadCustomers();
  }, [search, bookingTypeFilter, bookingStatusFilter, paymentStatusFilter]);

  async function loadBookings() {
    try {
      setLoading(true);
      let query = [];
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      if (bookingTypeFilter) query.push(`bookingType=${bookingTypeFilter}`);
      if (bookingStatusFilter) query.push(`bookingStatus=${bookingStatusFilter}`);
      if (paymentStatusFilter) query.push(`paymentStatus=${paymentStatusFilter}`);

      const endpoint = query.length > 0 ? `/bookings?${query.join('&')}` : '/bookings';
      const res = await fetchWithAuth(endpoint);
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetchWithAuth('/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      // Ignored
    }
  }

  const handleOpenCreate = () => {
    // Reset Form fields
    setCustomerId(customers[0]?.id || '');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setTotalPrice('');
    setNotes('');
    
    // Hotel reset
    setHotelName('');
    setHotelCity('');
    setHotelCountry('');
    setCheckInDate('');
    setCheckOutDate('');
    setNumberOfNights(1);
    setRoomType('Standard');
    setNumberOfRooms(1);
    setNumberOfGuests(1);
    setBoardType('Room Only');
    setConfirmationNumber('');

    // Flight reset
    setAirline('');
    setFlightNumber('');
    setDepartureAirport('');
    setArrivalAirport('');
    setDepartureCity('');
    setArrivalCity('');
    setDepartureDatetime('');
    setArrivalDatetime('');
    setPassengerCount(1);
    setTicketNumber('');
    setReservationReference('');

    setIsCreateOpen(true);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/bookings/${id}`);
      const data = await res.json();
      setSelectedBooking(data);
      setIsDetailOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load booking details');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let endpoint = '';
    let payload = {};

    if (activeFormType === 'HOTEL') {
      endpoint = '/bookings/hotel';
      payload = {
        customerId,
        destination,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalPrice: Number(totalPrice),
        notes: notes || null,
        hotelName,
        city: hotelCity,
        country: hotelCountry,
        checkInDate: new Date(checkInDate).toISOString(),
        checkOutDate: new Date(checkOutDate).toISOString(),
        numberOfNights: Number(numberOfNights),
        roomType,
        numberOfRooms: Number(numberOfRooms),
        numberOfGuests: Number(numberOfGuests),
        boardType,
        confirmationNumber: confirmationNumber || null
      };
    } else {
      endpoint = '/bookings/flight';
      payload = {
        customerId,
        destination,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalPrice: Number(totalPrice),
        notes: notes || null,
        airline,
        flightNumber,
        departureAirport,
        arrivalAirport,
        departureCity,
        arrivalCity,
        departureDatetime: new Date(departureDatetime).toISOString(),
        arrivalDatetime: new Date(arrivalDatetime).toISOString(),
        passengerCount: Number(passengerCount),
        ticketNumber: ticketNumber || null,
        reservationReference: reservationReference || null
      };
    }

    try {
      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create booking');
      }

      setIsCreateOpen(false);
      loadBookings();
    } catch (err: any) {
      setError(err.message || 'Creation failed');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedBooking) return;
    try {
      const res = await fetchWithAuth(`/bookings/${selectedBooking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ bookingStatus: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update status');
      }

      // Reload detail
      handleViewDetail(selectedBooking.id);
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const res = await fetchWithAuth('/payments', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          amount: Number(paymentAmount),
          paymentMethod,
          referenceNumber: paymentReference || null,
          notes: paymentNotes || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Payment registration failed');
      }

      setIsPaymentOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      
      // Reload booking detail and list
      handleViewDetail(selectedBooking.id);
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedBooking) return;
    try {
      const res = await fetchWithAuth('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ bookingId: selectedBooking.id })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Invoice generation failed');
      }

      alert('Invoice successfully generated!');
      handleViewDetail(selectedBooking.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (dString?: string) => {
    if (!dString) return 'N/A';
    return new Date(dString).toLocaleDateString('en-GB');
  };

  const formatDatetime = (dString?: string) => {
    if (!dString) return 'N/A';
    return new Date(dString).toLocaleString('en-GB');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      case 'DRAFT':
      default:
        return 'badge-muted';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Bookings Registry</h2>
          <p className="page-subtitle">Manage hotel, flight operations and billing cycles</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> New Booking
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="search-container" style={{ flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
          <Search 
            size={18} 
            color="var(--text-secondary)" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search destination, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="form-select" 
          style={{ width: '130px' }}
          value={bookingTypeFilter}
          onChange={(e) => setBookingTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="HOTEL">Hotel</option>
          <option value="FLIGHT">Flight</option>
        </select>

        <select 
          className="form-select" 
          style={{ width: '150px' }}
          value={bookingStatusFilter}
          onChange={(e) => setBookingStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select 
          className="form-select" 
          style={{ width: '150px' }}
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
        >
          <option value="">All Payments</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {/* Booking Records Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div className="center-flex">
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Retrieving dossiers...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="center-flex">
            <p style={{ color: 'var(--text-secondary)' }}>No bookings found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Travel Dates</th>
                  <th>Total Cost</th>
                  <th>Workflow</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        {b.bookingType === 'HOTEL' ? <Hotel size={14} color="var(--primary)" /> : <PlaneTakeoff size={14} color="var(--secondary)" />}
                        {b.bookingType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.customer.firstName} {b.customer.lastName}</td>
                    <td>{b.destination}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatDate(b.startDate)} - {formatDate(b.endDate)}
                    </td>
                    <td style={{ fontWeight: 700 }}>{Number(b.totalPrice).toFixed(3)} TND</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        b.paymentStatus === 'PAID' ? 'badge-success' :
                        b.paymentStatus === 'PARTIALLY_PAID' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 10px' }}
                        onClick={() => handleViewDetail(b.id)}
                      >
                        <Eye size={14} /> Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Book New Client Service</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="tabs">
              <button 
                type="button" 
                className={`tab-btn ${activeFormType === 'HOTEL' ? 'active' : ''}`}
                onClick={() => setActiveFormType('HOTEL')}
              >
                <Hotel size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Hotel Reservation
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeFormType === 'FLIGHT' ? 'active' : ''}`}
                onClick={() => setActiveFormType('FLIGHT')}
              >
                <PlaneTakeoff size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Flight Booking
              </button>
            </div>

            <form onSubmit={handleBookingSubmit}>
              {/* Common Section */}
              <div className="form-group">
                <label className="form-label" htmlFor="customer-select">Select Customer</label>
                <select 
                  id="customer-select" 
                  className="form-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Profile --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="destination-input">Destination City/Country</label>
                  <input
                    id="destination-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Paris, France"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="price-input">Total Package Price (TND)</label>
                  <input
                    id="price-input"
                    type="number"
                    step="0.001"
                    className="form-input"
                    placeholder="0.000"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="start-date-input">Travel Start Date</label>
                  <input
                    id="start-date-input"
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="end-date-input">Travel End Date</label>
                  <input
                    id="end-date-input"
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Hotel Form Specifics */}
              {activeFormType === 'HOTEL' && (
                <div style={{ marginTop: '15px', padding: '15px', border: '1px solid var(--border-glass)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>Hotel Details</h4>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="hotelName">Hotel Name</label>
                    <input
                      id="hotelName"
                      type="text"
                      className="form-input"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="hotelCity">City</label>
                      <input
                        id="hotelCity"
                        type="text"
                        className="form-input"
                        value={hotelCity}
                        onChange={(e) => setHotelCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="hotelCountry">Country</label>
                      <input
                        id="hotelCountry"
                        type="text"
                        className="form-input"
                        value={hotelCountry}
                        onChange={(e) => setHotelCountry(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkInDate">Check-In Date</label>
                      <input
                        id="checkInDate"
                        type="date"
                        className="form-input"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkOutDate">Check-Out Date</label>
                      <input
                        id="checkOutDate"
                        type="date"
                        className="form-input"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="numberOfNights">Nights</label>
                      <input
                        id="numberOfNights"
                        type="number"
                        min="1"
                        className="form-input"
                        value={numberOfNights}
                        onChange={(e) => setNumberOfNights(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="roomType">Room Type</label>
                      <input
                        id="roomType"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Double Deluxe"
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="numberOfRooms">Rooms Count</label>
                      <input
                        id="numberOfRooms"
                        type="number"
                        min="1"
                        className="form-input"
                        value={numberOfRooms}
                        onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="numberOfGuests">Guests Count</label>
                      <input
                        id="numberOfGuests"
                        type="number"
                        min="1"
                        className="form-input"
                        value={numberOfGuests}
                        onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="boardType">Board Type</label>
                      <select
                        id="boardType"
                        className="form-select"
                        value={boardType}
                        onChange={(e) => setBoardType(e.target.value)}
                        required
                      >
                        <option value="Room Only">Room Only (RO)</option>
                        <option value="Bed & Breakfast">Bed & Breakfast (BB)</option>
                        <option value="Half Board">Half Board (HB)</option>
                        <option value="Full Board">Full Board (FB)</option>
                        <option value="All Inclusive">All Inclusive (AI)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="confirmationNumber">Hotel Confirmation Code</label>
                      <input
                        id="confirmationNumber"
                        type="text"
                        className="form-input"
                        value={confirmationNumber}
                        onChange={(e) => setConfirmationNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Flight Form Specifics */}
              {activeFormType === 'FLIGHT' && (
                <div style={{ marginTop: '15px', padding: '15px', border: '1px solid var(--border-glass)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '12px' }}>Flight Details</h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="airline">Airline</label>
                      <input
                        id="airline"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Tunisair"
                        value={airline}
                        onChange={(e) => setAirline(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="flightNumber">Flight Number</label>
                      <input
                        id="flightNumber"
                        type="text"
                        className="form-input"
                        placeholder="e.g. TU713"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="departureAirport">Departure Airport Code</label>
                      <input
                        id="departureAirport"
                        type="text"
                        className="form-input"
                        placeholder="e.g. TUN"
                        value={departureAirport}
                        onChange={(e) => setDepartureAirport(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="arrivalAirport">Arrival Airport Code</label>
                      <input
                        id="arrivalAirport"
                        type="text"
                        className="form-input"
                        placeholder="e.g. CDG"
                        value={arrivalAirport}
                        onChange={(e) => setArrivalAirport(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="departureCity">Departure City</label>
                      <input
                        id="departureCity"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Tunis"
                        value={departureCity}
                        onChange={(e) => setDepartureCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="arrivalCity">Arrival City</label>
                      <input
                        id="arrivalCity"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Paris"
                        value={arrivalCity}
                        onChange={(e) => setArrivalCity(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="departureDatetime">Departure Date & Time</label>
                      <input
                        id="departureDatetime"
                        type="datetime-local"
                        className="form-input"
                        value={departureDatetime}
                        onChange={(e) => setDepartureDatetime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="arrivalDatetime">Arrival Date & Time</label>
                      <input
                        id="arrivalDatetime"
                        type="datetime-local"
                        className="form-input"
                        value={arrivalDatetime}
                        onChange={(e) => setArrivalDatetime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="passengerCount">Passenger Count</label>
                      <input
                        id="passengerCount"
                        type="number"
                        min="1"
                        className="form-input"
                        value={passengerCount}
                        onChange={(e) => setPassengerCount(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ticketNumber">Ticket Number</label>
                      <input
                        id="ticketNumber"
                        type="text"
                        className="form-input"
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reservationReference">PNR / Reservation Ref</label>
                    <input
                      id="reservationReference"
                      type="text"
                      className="form-input"
                      value={reservationReference}
                      onChange={(e) => setReservationReference(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label" htmlFor="notes-textarea">Notes</label>
                <textarea
                  id="notes-textarea"
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {isDetailOpen && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Booking details: ID {selectedBooking.id.substring(0, 8)}...</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0 }}>Workflow Status: <span className={`badge ${getStatusBadgeClass(selectedBooking.bookingStatus)}`}>{selectedBooking.bookingStatus}</span></h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedBooking.bookingStatus === 'DRAFT' && (
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleStatusChange('PENDING')}>
                      Mark Pending
                    </button>
                  )}
                  {(selectedBooking.bookingStatus === 'DRAFT' || selectedBooking.bookingStatus === 'PENDING') && (
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleStatusChange('CONFIRMED')}>
                      Confirm Booking
                    </button>
                  )}
                  {selectedBooking.bookingStatus === 'CONFIRMED' && (
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleStatusChange('COMPLETED')}>
                      Complete
                    </button>
                  )}
                  {selectedBooking.bookingStatus !== 'CANCELLED' && selectedBooking.bookingStatus !== 'COMPLETED' && (
                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleStatusChange('CANCELLED')}>
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Customer Profile</span>
                  <span className="detail-val" style={{ fontWeight: 600 }}>{selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</span>
                  <span className="detail-label" style={{ fontSize: '0.7rem' }}>{selectedBooking.customer.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Destination</span>
                  <span className="detail-val">{selectedBooking.destination}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Type</span>
                  <span className="detail-val" style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedBooking.bookingType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Dossier Date Range</span>
                  <span className="detail-val">{formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Hotel details display */}
            {selectedBooking.hotelBooking && (
              <div className="detail-section" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                <h4 style={{ color: 'var(--primary)' }}>Hotel Accommodation</h4>
                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="detail-item">
                    <span className="detail-label">Hotel Name</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.hotelName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">City/Country</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.city}, {selectedBooking.hotelBooking.country}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Confirmation Code</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.confirmationNumber || 'Pending'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dates</span>
                    <span className="detail-val">{formatDate(selectedBooking.hotelBooking.checkInDate)} to {formatDate(selectedBooking.hotelBooking.checkOutDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Nights</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.numberOfNights}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Room Specifications</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.roomType} ({selectedBooking.hotelBooking.numberOfRooms} Room/s)</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Board Level</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.boardType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Guests</span>
                    <span className="detail-val">{selectedBooking.hotelBooking.numberOfGuests}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Flight details display */}
            {selectedBooking.flightBooking && (
              <div className="detail-section" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                <h4 style={{ color: 'var(--secondary)' }}>Flight Itinerary</h4>
                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="detail-item">
                    <span className="detail-label">Airlines</span>
                    <span className="detail-val">{selectedBooking.flightBooking.airline} ({selectedBooking.flightBooking.flightNumber})</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Departure</span>
                    <span className="detail-val">{selectedBooking.flightBooking.departureCity} ({selectedBooking.flightBooking.departureAirport})</span>
                    <span className="detail-val" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDatetime(selectedBooking.flightBooking.departureDatetime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Arrival</span>
                    <span className="detail-val">{selectedBooking.flightBooking.arrivalCity} ({selectedBooking.flightBooking.arrivalAirport})</span>
                    <span className="detail-val" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDatetime(selectedBooking.flightBooking.arrivalDatetime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ticket Number</span>
                    <span className="detail-val">{selectedBooking.flightBooking.ticketNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">PNR Reference</span>
                    <span className="detail-val">{selectedBooking.flightBooking.reservationReference || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Passengers</span>
                    <span className="detail-val">{selectedBooking.flightBooking.passengerCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Finance / Billing Section */}
            <div className="detail-section" style={{ marginTop: '20px' }}>
              <h4>Financial Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <div className="detail-item">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-val" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{Number(selectedBooking.totalPrice).toFixed(3)} TND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Paid</span>
                  <span className="detail-val" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>{Number(selectedBooking.paidAmount).toFixed(3)} TND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Remaining Balance</span>
                  <span className="detail-val" style={{ fontSize: '1.2rem', fontWeight: 700, color: Number(selectedBooking.remainingAmount) > 0 ? 'var(--danger)' : 'var(--secondary)' }}>
                    {Number(selectedBooking.remainingAmount).toFixed(3)} TND
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice generation action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {Number(selectedBooking.remainingAmount) > 0 && (
                  <button className="btn btn-secondary" onClick={() => setIsPaymentOpen(true)}>
                    <DollarSign size={16} /> Record Payment
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleGenerateInvoice}>
                  <FileText size={16} /> Generate Invoice (PDF)
                </button>
              </div>
              <div>
                <span className={`badge ${
                  selectedBooking.paymentStatus === 'PAID' ? 'badge-success' :
                  selectedBooking.paymentStatus === 'PARTIALLY_PAID' ? 'badge-warning' : 'badge-danger'
                }`}>
                  Billing Status: {selectedBooking.paymentStatus}
                </span>
              </div>
            </div>

            {/* Payments List */}
            <div className="detail-section">
              <h4>Associated Payments</h4>
              {selectedBooking.payments?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No payment transaction records found.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Amount</th>
                        <th>Registered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.payments?.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.paymentDate)}</td>
                          <td style={{ fontWeight: 600 }}>{p.paymentMethod}</td>
                          <td>{p.referenceNumber || '-'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{Number(p.amount).toFixed(3)} TND</td>
                          <td>{p.createdByUser?.fullName || 'System'}</td>
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

      {/* Record Payment Sub-Modal */}
      {isPaymentOpen && selectedBooking && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment Transaction</h3>
              <button className="modal-close" onClick={() => setIsPaymentOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-amount-input">Payment Amount (TND)</label>
                <input
                  id="pay-amount-input"
                  type="number"
                  step="0.001"
                  className="form-input"
                  max={Number(selectedBooking.remainingAmount)}
                  placeholder={`Max: ${Number(selectedBooking.remainingAmount).toFixed(3)}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pay-method-select">Payment Method</label>
                <select
                  id="pay-method-select"
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit/Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pay-ref-input">Reference / Receipt Number</label>
                <input
                  id="pay-ref-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Transaction hash, check #"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pay-notes-input">Notes</label>
                <textarea
                  id="pay-notes-input"
                  className="form-textarea"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-secondary">
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
