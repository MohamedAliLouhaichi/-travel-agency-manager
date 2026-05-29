# Diagrammes UML

## 1. Diagramme de cas d’utilisation

```mermaid
flowchart LR
    Admin[Chef d'agence]
    Secretary[Secrétaire]

    Login((Se connecter))
    ManageUsers((Gérer utilisateurs))
    ManageCustomers((Gérer clients))
    ManageBookings((Gérer réservations))
    ManagePayments((Gérer paiements))
    GenerateInvoices((Générer factures PDF))
    ViewDashboard((Consulter dashboard))
    ImportData((Importer CSV/Excel))
    BackupData((Sauvegarder données))

    Admin --> Login
    Secretary --> Login

    Admin --> ManageUsers
    Admin --> ManageCustomers
    Admin --> ManageBookings
    Admin --> ManagePayments
    Admin --> GenerateInvoices
    Admin --> ViewDashboard
    Admin --> ImportData
    Admin --> BackupData

    Secretary --> ManageCustomers
    Secretary --> ManageBookings
    Secretary --> ManagePayments
    Secretary --> GenerateInvoices
```

## 2. Diagramme de classes principal

```mermaid
classDiagram
    class User {
        +String id
        +String fullName
        +String email
        +String passwordHash
        +UserRole role
        +UserStatus status
    }

    class Customer {
        +String id
        +String firstName
        +String lastName
        +String phone
        +String email
        +String passportNumber
        +String nationality
    }

    class Booking {
        +String id
        +BookingType bookingType
        +String destination
        +Date startDate
        +Date endDate
        +Decimal totalPrice
        +Decimal paidAmount
        +Decimal remainingAmount
        +BookingStatus bookingStatus
        +PaymentStatus paymentStatus
    }

    class HotelBooking {
        +String id
        +String hotelName
        +String city
        +String country
        +Date checkInDate
        +Date checkOutDate
        +Int numberOfNights
    }

    class FlightBooking {
        +String id
        +String airline
        +String flightNumber
        +String departureAirport
        +String arrivalAirport
        +Date departureDatetime
        +Date arrivalDatetime
    }

    class Payment {
        +String id
        +Decimal amount
        +PaymentMethod paymentMethod
        +Date paymentDate
    }

    class Invoice {
        +String id
        +String invoiceNumber
        +Date issueDate
        +Decimal totalAmount
        +String pdfPath
    }

    class ImportBatch {
        +String id
        +String fileName
        +String fileType
        +String importType
        +String status
        +Int totalRows
        +Int successRows
        +Int failedRows
    }

    User "1" --> "many" Booking
    User "1" --> "many" Payment
    User "1" --> "many" Invoice
    User "1" --> "many" ImportBatch

    Customer "1" --> "many" Booking
    Booking "1" --> "0..1" HotelBooking
    Booking "1" --> "0..1" FlightBooking
    Booking "1" --> "many" Payment
    Booking "1" --> "many" Invoice
```

## 3. Diagramme entité-relation

```mermaid
erDiagram
    USER ||--o{ BOOKING : creates
    USER ||--o{ PAYMENT : records
    USER ||--o{ INVOICE : generates
    USER ||--o{ IMPORT_BATCH : uploads

    CUSTOMER ||--o{ BOOKING : has
    CUSTOMER ||--o{ INVOICE : receives

    BOOKING ||--o| HOTEL_BOOKING : contains
    BOOKING ||--o| FLIGHT_BOOKING : contains
    BOOKING ||--o{ PAYMENT : has
    BOOKING ||--o{ INVOICE : has

    IMPORT_BATCH ||--o{ IMPORT_ERROR : contains
```

## 4. Séquence — ajout paiement

```mermaid
sequenceDiagram
    actor User
    participant DesktopApp
    participant BackendAPI
    participant PaymentService
    participant Database

    User->>DesktopApp: Ajouter paiement
    DesktopApp->>BackendAPI: POST /payments
    BackendAPI->>PaymentService: createPayment(dto)
    PaymentService->>Database: Lire réservation
    PaymentService->>PaymentService: Valider montant
    PaymentService->>Database: Insérer paiement
    PaymentService->>Database: Mettre à jour montants
    BackendAPI-->>DesktopApp: Paiement enregistré
```

## 5. Séquence — import CSV/Excel

```mermaid
sequenceDiagram
    actor Admin
    participant DesktopApp
    participant BackendAPI
    participant ImportService
    participant Database

    Admin->>DesktopApp: Sélectionner fichier CSV/Excel
    DesktopApp->>BackendAPI: POST /imports/upload
    BackendAPI->>ImportService: Lire fichier
    ImportService-->>BackendAPI: Colonnes + aperçu
    BackendAPI-->>DesktopApp: Afficher preview

    Admin->>DesktopApp: Mapper colonnes
    DesktopApp->>BackendAPI: POST /imports/:id/validate
    BackendAPI->>ImportService: Valider données
    ImportService->>Database: Enregistrer erreurs

    Admin->>DesktopApp: Confirmer import
    DesktopApp->>BackendAPI: POST /imports/:id/confirm
    BackendAPI->>ImportService: Importer lignes valides
    ImportService->>Database: Insérer données
    BackendAPI-->>DesktopApp: Import terminé
```
