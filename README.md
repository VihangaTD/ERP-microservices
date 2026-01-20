# ERP Microservices System

A complete microservices-based ERP system built with Node.js, featuring authentication, product management, and stock tracking with comprehensive audit logging.

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     API Gateway (Port 3000)         │
│  - JWT Validation                   │
│  - Rate Limiting                    │
│  - Request Routing                  │
└─────────┬───────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌──────────────┐
│  Auth   │ │   Product    │
│ Service │ │   Service    │
│(Port    │ │  (Port 3002) │
│ 3001)   │ │              │
└────┬────┘ └──────┬───────┘
     │             │
     ▼             ▼
┌─────────┐ ┌──────────────┐
│ Auth DB │ │ Product DB   │
│(MongoDB)│ │  (MongoDB)   │
└─────────┘ └──────────────┘
```

### Database Architecture

- **Auth Service DB**: `erp_auth`
  - Collections: users, companies
  
- **Product Service DB**: `erp_products`
  - Collections: products, stock_logs

### Key Design Decisions

1. **Service Isolation**: Each service has its own database and runs independently
2. **JWT Authentication**: Stateless authentication with user_id, company_id, and role in payload
3. **Stock Management**: Atomic operations with audit logging for all stock changes
4. **Error Handling**: Centralized error handling with consistent response format
5. **Environment Configuration**: All sensitive data in environment variables
6. **REST Communication**: Services communicate via REST APIs only

### Service Responsibilities

#### 1. **API Gateway**
- Single entry point for all client requests
- JWT token validation for protected routes
- Request routing to appropriate microservices
- Rate limiting (100 requests per 15 minutes)
- Error handling and response formatting
- Service health monitoring

#### 2. **Auth Service**
- User registration and authentication
- Company management
- JWT token generation
- Password encryption using bcrypt
- User and company data management

#### 3. **Product Service**
- Product CRUD operations
- Stock management with atomic transactions
- Stock audit logging
- Company-based data isolation
- Negative stock prevention

### Database Design

#### Auth Service Database (erp_auth)

**Users Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: String (enum: admin, manager, user),
  companyId: ObjectId,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Companies Collection**
```javascript
{
  _id: ObjectId,
  name: String (unique),
  email: String (unique),
  address: String,
  phone: String,
  industry: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Product Service Database (erp_products)

**Products Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  sku: String (unique per company),
  price: Number,
  currentStock: Number (min: 0),
  category: String,
  companyId: String (indexed),
  isActive: Boolean,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Stock Logs Collection**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  companyId: String,
  changeType: String (enum: increase, decrease, initial),
  quantity: Number,
  previousStock: Number,
  newStock: Number,
  reason: String,
  performedBy: String,
  createdAt: Date
}
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 5.x or higher
- **npm** or **yarn**
- **Git**

### Installation

#### Method 1: Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd erp-microservices
```

2. **Install dependencies for each service**

```bash
# Auth Service
cd services/auth-service
npm install
cp .env.example .env
# Edit .env with your configuration

# Product Service
cd ../product-service
npm install
cp .env.example .env
# Edit .env with your configuration

# API Gateway
cd ../api-gateway
npm install
cp .env.example .env
# Edit .env with your configuration
```

3. **Configure environment variables**

Make sure the JWT_SECRET is **identical** across all services!

**Auth Service (.env)**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/erp_auth
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Product Service (.env)**
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/erp_products
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

**API Gateway (.env)**
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

5. **Start all services**

Open 3 separate terminal windows:

```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm start

# Terminal 2 - Product Service
cd services/product-service
npm start

# Terminal 3 - API Gateway
cd services/api-gateway
npm start
```

#### Method 2: Docker Compose (Recommended)

1. **Create .env file in root directory**
```bash
cp .env.example .env
# Edit .env with your JWT_SECRET
```

2. **Start all services**
```bash
docker-compose up --build
```

3. **Stop all services**
```bash
docker-compose down
```

4. **Stop and remove volumes**
```bash
docker-compose down -v
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register user and company
- `POST /auth/login` - Login and get JWT token

### Products (Protected)
- `POST /products` - Create product
- `GET /products` - Get all products for company
- `POST /stock/update` - Update stock quantity

### Verify Installation

1. **Check API Gateway health**
```bash
curl http://localhost:3000/health
```

2. **Check all services health**
```bash
curl http://localhost:3000/health/services
```

Expected response:
```json
{
  "success": true,
  "gateway": "healthy",
  "services": {
    "authService": { "status": "healthy" },
    "productService": { "status": "healthy" }
  }
}
```

## 📚 API Documentation

Base URL: `http://localhost:3000`

### Authentication Endpoints

#### 1. Register User and Company
**POST** `/auth/register`

Creates a new user account and company.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin",
  "companyName": "Tech Corp",
  "companyEmail": "info@techcorp.com",
  "companyAddress": "123 Tech Street",
  "companyPhone": "+1234567890",
  "industry": "Technology"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User and company registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "company": {
      "id": "65abc456...",
      "name": "Tech Corp",
      "email": "info@techcorp.com"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

#### 2. Login
**POST** `/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "company": {
      "id": "65abc456...",
      "name": "Tech Corp"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Product Endpoints (Protected)

All product endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

#### 3. Create Product
**POST** `/products`

Creates a new product for the authenticated user's company.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Laptop Pro",
  "description": "High-performance laptop",
  "sku": "LAP-001",
  "price": 1299.99,
  "initialStock": 50,
  "category": "Electronics"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "65abc789...",
    "name": "Laptop Pro",
    "description": "High-performance laptop",
    "sku": "LAP-001",
    "price": 1299.99,
    "currentStock": 50,
    "category": "Electronics",
    "companyId": "65abc456...",
    "isActive": true,
    "createdBy": "65abc123...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Product with this SKU already exists in your company"
}
```

#### 4. Get Products
**GET** `/products`

Retrieves all products for the authenticated user's company with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in name, SKU, or description
- `category` (optional): Filter by category
- `isActive` (optional): Filter by active status (true/false/all)

**Example Request:**
```
GET /products?page=1&limit=10&search=laptop&category=Electronics
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc789...",
      "name": "Laptop Pro",
      "sku": "LAP-001",
      "price": 1299.99,
      "currentStock": 50,
      "category": "Electronics",
      "companyId": "65abc456...",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pages": 1,
    "limit": 10
  }
}
```

#### 5. Update Stock
**POST** `/stock/update`

Updates product stock quantity with audit logging.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "65abc789...",
  "quantity": 10,
  "changeType": "increase",
  "reason": "New stock delivery"
}
```

**Parameters:**
- `productId`: Product ID (required)
- `quantity`: Amount to change (required, must be > 0)
- `changeType`: "increase" or "decrease" (required)
- `reason`: Reason for change (optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "productId": "65abc789...",
    "productName": "Laptop Pro",
    "sku": "LAP-001",
    "previousStock": 50,
    "newStock": 60,
    "change": 10,
    "changeType": "increase"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Insufficient stock: Cannot reduce stock below zero"
}
```

#### 6. Get Stock History 
**GET** `/products/:productId/history`

Retrieves stock change history for a specific product.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of records to retrieve (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc999...",
      "productId": "65abc789...",
      "companyId": "65abc456...",
      "changeType": "increase",
      "quantity": 10,
      "previousStock": 50,
      "newStock": 60,
      "reason": "New stock delivery",
      "performedBy": "65abc123...",
      "createdAt": "2024-01-15T14:30:00.000Z"
    },
    {
      "_id": "65abc888...",
      "productId": "65abc789...",
      "companyId": "65abc456...",
      "changeType": "initial",
      "quantity": 50,
      "previousStock": 0,
      "newStock": 50,
      "reason": "Initial stock",
      "performedBy": "65abc123...",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 🧪 Testing Guide

### Using cURL

1. **Register a user**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "admin",
    "companyName": "Tech Corp",
    "companyEmail": "info@techcorp.com"
  }'
```

2. **Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

3. **Create a product** (replace TOKEN)
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Pro",
    "description": "High-performance laptop",
    "sku": "LAP-001",
    "price": 1299.99,
    "initialStock": 50,
    "category": "Electronics"
  }'
```

4. **Get products**
```bash
curl -X GET "http://localhost:3000/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

5. **Update stock**
```bash
curl -X POST http://localhost:3000/stock/update \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "quantity": 10,
    "changeType": "increase",
    "reason": "New delivery"
  }'
```

### Postman Collection

Import the provided Postman collection for easier testing. The collection includes:
- All endpoints with sample requests
- Environment variables for token management
- Pre-configured request examples

## 🔒 Security Features

1. **JWT Authentication**
   - Stateless authentication
   - Token expiration (7 days default)
   - Secure payload with user_id, company_id, and role

2. **Password Security**
   - bcrypt hashing with salt rounds (10)
   - Passwords never stored in plain text
   - Password field excluded from queries by default

3. **Data Isolation**
   - Company-based data segregation
   - Cross-company access prevention
   - Authorization checks on all protected routes

4. **Input Validation**
   - Request body validation
   - Schema validation using express-validator
   - Sanitization of user inputs

5. **Error Handling**
   - No sensitive information in error responses
   - Production vs development error messages
   - Centralized error handling

## 🚀 Bonus Features Implemented

✅ **Docker & Docker Compose**
- Complete containerization
- Multi-container orchestration
- Development and production configurations

✅ **Health Check APIs**
- Service-level health checks
- Gateway aggregated health status
- Container health checks

✅ **Pagination & Search**
- Efficient pagination for product listings
- Full-text search across multiple fields
- Category filtering

✅ **Logging**
- Structured error logging
- Request/response logging
- Stock change audit trail

✅ **Stock History**
- Complete audit trail for stock changes
- Query stock history by product
- Timestamp-based tracking

## 📝 Key Design Decisions

### 1. Service Isolation
- Each service has its own database
- No direct database sharing between services
- Communication only through REST APIs

### 2. Atomic Stock Operations
- MongoDB transactions for stock updates
- Prevents race conditions
- Guarantees data consistency

### 3. JWT Payload Structure
```javascript
{
  user_id: "65abc123...",
  company_id: "65abc456...",
  role: "admin",
  iat: 1705320000,
  exp: 1705924800
}
```

### 4. Stock Change Prevention
- Business rule: Stock cannot go negative
- Validated at application level
- Database-level constraints (min: 0)

### 5. Audit Logging
- Every stock change recorded
- Immutable audit trail
- Includes who, what, when, and why

### 6. Error Response Format
```javascript
{
  success: false,
  message: "Error description",
  errors: [] // Optional validation errors
}
```

## 🛠️ Development

### Running in Development Mode

Each service can be run in development mode with auto-reload:

```bash
cd services/auth-service
npm run dev

cd services/product-service
npm run dev

cd services/api-gateway
npm run dev
```

### Code Structure

Each service follows a consistent structure:
```
service/
├── src/
│   ├── config/      # Database and configuration
│   ├── models/      # Database models
│   ├── controllers/ # Business logic
│   ├── routes/      # Route definitions
│   ├── middleware/  # Custom middleware
│   ├── utils/       # Utility functions
│   └── app.js       # Express app setup
├── .env.example     # Environment template
├── package.json     # Dependencies
└── server.js        # Entry point
```

## 📊 Performance Considerations

1. **Database Indexing**
   - Indexed fields: email, companyId, sku
   - Compound indexes for common queries
   - Optimized query performance

2. **Connection Pooling**
   - MongoDB connection reuse
   - Efficient resource utilization

3. **Pagination**
   - Prevents large data transfers
   - Improves response times

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
mongod
```

2. **JWT Secret Mismatch**
```
Error: Invalid token
```
**Solution:** Ensure JWT_SECRET is identical in all services

3. **Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Kill the process or change the port
```bash
lsof -ti:3000 | xargs kill
```

4. **Service Unavailable**
```
Service temporarily unavailable
```
**Solution:** Check if all services are running
```bash
curl http://localhost:3000/health/services
```
