# StockSmart

Retail Inventory Management System

[![CI](https://github.com/daydreamer055/HCL/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/daydreamer055/HCL/actions/workflows/ci.yml)

## Overview

StockSmart is a full-stack retail inventory management application for tracking products and stock across multiple locations. It supports inventory operations, supplier and order workflows, barcode and RFID tracking, operational dashboards, and reports through a Spring Boot REST API and an Angular web application.

## Features

- Authentication and authorization with JWT
- Product management
- Category references on products (category CRUD endpoints are not currently exposed)
- Inventory management, adjustments, transfers, and transaction history
- Multi-location stock tracking
- Supplier management
- Purchase orders and receiving
- Sales orders and completion
- Barcode management
- RFID simulation
- Dashboard KPIs and charts
- Inventory, sales, purchase, supplier, movement, and valuation reports
- Role-based access for `ADMIN`, `INVENTORY_MANAGER`, and `STAFF`

## Technology Stack

**Backend**

- Java 17
- Spring Boot
- Maven
- Spring Security
- JWT (JJWT)
- Spring Data JPA / Hibernate
- Oracle Database support (Oracle JDBC)
- H2 for local development and tests

**Frontend**

- Angular
- TypeScript
- HTML
- CSS
- Angular Router, Reactive Forms, and HttpClient

## Project Structure

```text
StockSMart/
├── src/
│   ├── main/java/com/stocksmart/   # Spring Boot controllers, services, entities, DTOs, security
│   ├── main/resources/             # Spring configuration
│   └── test/                       # Backend tests
├── frontend/
│   ├── src/app/core/               # API, authentication, guards, interceptors, services
│   ├── src/app/components/         # Shared application components
│   ├── src/app/models/             # Frontend API models
│   └── src/app/pages/              # Angular feature pages
├── pom.xml
└── README.md
```

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd StockSMart
```

### 2. Configure Oracle

The default Spring configuration uses an in-memory H2 database for local development. To use Oracle, set the connection details in the environment rather than committing credentials:

```text
DB_URL=jdbc:oracle:thin:@//<host>:<port>/<service-name>
DB_USERNAME=<oracle-username>
DB_PASSWORD=<oracle-password>
DB_DRIVER_CLASS_NAME=oracle.jdbc.OracleDriver
DB_DIALECT=org.hibernate.dialect.OracleDialect
DDL_AUTO=validate
```

Use a managed schema and an appropriate migration process for shared or production databases. Do not use development schema settings or development credentials in production.

When the `dev` profile starts, it idempotently adds example categories, suppliers, locations, products, and inventory records. Demo SKUs and supplier/location codes use the `DEMO-` prefix. Existing inventory quantities are left unchanged when the sample data is seeded again. These examples are only created by the development profile.

### 3. Configure environment variables

The default `dev` profile seeds a development administrator. Supply a private JWT signing key and a private password before starting the backend:

```text
JWT_SECRET=<base64-encoded-random-key-of-at-least-32-bytes>
JWT_EXPIRATION_MS=86400000
DEV_ADMIN_USERNAME=admin
DEV_ADMIN_EMAIL=admin@stocksmart.com
DEV_ADMIN_PASSWORD=<private-development-password>
```

Generate a key locally, for example with `openssl rand -base64 32`. Keep credentials in your shell, an untracked local environment file, or a secret manager. `.env` files are ignored by Git; never commit actual secrets. For non-development environments, provide `JWT_SECRET` and database credentials through the deployment environment and do not enable the `dev` profile.

### 4. Start the Spring Boot backend

The backend listens on port `8081` by default:

```bash
mvn spring-boot:run
```

Run backend tests with:

```bash
mvn clean test
```

### 5. Start the Angular frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:4200` and uses `http://localhost:8081/api` as its local API base URL. The backend CORS configuration allows this development origin. Build the frontend with `npm run build` (equivalent to `ng build`).

## API

All application endpoints are under `/api` and require a bearer token except login.

| API group | Base path | Capabilities |
|---|---|---|
| Authentication | `/auth` | Login |
| Products | `/products` | Search, filter, create, update, delete |
| Inventory | `/inventory` | Stock listing, low/out-of-stock, purchases, sales, adjustment, transfer, transactions, valuation |
| Suppliers | `/suppliers` | Search, filter, create, update, delete |
| Locations | `/locations` | Search, type/status filtering, create, update, delete |
| Purchase orders | `/purchase-orders` | List, create, status changes, cancel, receive |
| Sales orders | `/sales-orders` | List, create, status changes, cancel, complete |
| Barcode | `/barcodes` | Create, search, scan, product assignment, status |
| RFID | `/rfid` | Register, search, scan, product/location assignment, status |
| Dashboard | `/dashboard` | Summary, inventory groupings, low stock, recent transactions, sales/purchase summaries |
| Reports | `/reports` | Inventory, low/out-of-stock, sales, purchases, suppliers, stock movements, valuation |

The backend does not currently expose category CRUD or user-management APIs.

### Backend examples

Log in using the configured development admin email and password, then use the returned access token for protected API requests:

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${DEV_ADMIN_EMAIL}\",\"password\":\"${DEV_ADMIN_PASSWORD}\"}"
```

Copy the `accessToken` from the response into `TOKEN` for a protected request:

```bash
curl http://localhost:8081/api/products?page=0\&size=20 \
  -H "Authorization: Bearer ${TOKEN}"
```

For example, create a supplier using the API request shape below:

```json
{
  "supplierCode": "SUP-001",
  "name": "Example Supply Co.",
  "contactPerson": "Jordan Lee",
  "email": "orders@example.test",
  "phone": "+1 555 010 0100",
  "address": "100 Example Street",
  "city": "Springfield",
  "state": "CA",
  "country": "US",
  "status": "ACTIVE"
}
```

Send that JSON as the body of `POST http://localhost:8081/api/suppliers` with the bearer token. The `.test` email domain is reserved for examples.

### Frontend examples

Open `http://localhost:4200` after starting both applications and sign in with the development administrator credentials configured in your environment. Example workflows in the UI include:

- **Products:** open Products, search by product name or SKU, filter by category/status, and use **Add product** to create an entry.
- **Inventory:** open Inventory to search stock by location, review low or out-of-stock items, and record an adjustment or transfer.
- **Orders:** create a purchase order with a supplier, destination, and line items; receive it to add stock. Create a sales order for a location and complete it to process stock out.
- **Reports:** choose a report such as Inventory, Sales, or Stock movements, apply the supported filters, and review the returned table and summary cards.
- **Settings:** inspect the signed-in account and session details, or use **Sign out** to end the session.

## Authentication

Sign in through the frontend with the development administrator configured using `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD`. These values are private environment configuration and are not included in this repository. The development seeder creates the account only when it does not already exist. The API returns a JWT and authenticated user details; the frontend stores the session token locally, sends it as a bearer token, and clears the session on sign-out or an unauthorized response.

## Roles

- `ADMIN` — administrative access, including the frontend Users page.
- `INVENTORY_MANAGER` — inventory operations access.
- `STAFF` — standard application access.

The backend security configuration permits authenticated API access to these roles and requires `ADMIN` for `/api/admin/**`. The current backend does not provide user-management endpoints.

## Screenshots

Add application screenshots here. Example:

```markdown
![StockSmart dashboard](docs/screenshots/dashboard.png)
```

## Future Improvements

- Add category and user-management APIs with audited role assignment.
- Add automated integration tests for REST workflows and authorization.
- Add database migrations and production deployment configuration.
- Add report export, scheduled reporting, and additional operational metrics.
- Add broader end-to-end tests for stock receiving, sales, and multi-location transfers.
