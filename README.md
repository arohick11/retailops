# Omnichannel Retail Operations Platform

This project is a full-stack Omnichannel Retail Operations Platform web application built for a DevOps case study.

## Tech Stack

- **Frontend**: React.js (Vite)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB

## Project Structure

```
retailops/
├── frontend/          # React.js application
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── backend/           # Node.js/Express.js application
│   ├── models/        # MongoDB models
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── User.js
│   ├── routes/        # API routes
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── auth.js
│   ├── server.js
│   └── package.json
└── README.md
```

## Features

### Frontend
- **Landing Page**: Modern retail storefront with hero section, search, and product grid
- **Product Display**: Browse products with category filtering (ALL, ELECTRONICS, HOME, APPAREL, WELLNESS)
- **Search Functionality**: Search products by name or description
- **Shopping Cart**: Add products to cart
- **Responsive Design**: Mobile-friendly layout
- **Currency**: Prices displayed in Rupees (₹)

### Backend
- **REST APIs**:
  - `/api/products` - CRUD operations for products
  - `/api/orders` - Create and manage orders
  - `/api/auth` - Authentication endpoints
- **MongoDB Models**: Product, Order, User
- **CORS Enabled**: Cross-origin resource sharing for frontend-backend communication

## Installation Steps

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- MongoDB instance (local or cloud-based)

### Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory:
   ```bash
   cp .env.example .env
   ```

4. Configure your MongoDB connection string in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/retailops
   PORT=5000
   ```

5. Run the backend server:
   ```bash
   npm run dev
   # or for production:
   npm start
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173` (or another available port)

## Running the Application

1. Ensure MongoDB is running on your system or use a cloud MongoDB instance
2. Start the backend server in one terminal:
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend server in another terminal:
   ```bash
   cd frontend
   npm run dev
   ```

4. Open your web browser and navigate to the frontend URL (usually `http://localhost:5173`)

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a single product
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/customer/:email` - Get orders by customer email
- `GET /api/orders/:id` - Get a single order
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update order status

### Authentication
- `POST /api/auth/login` - User login

## Product Schema

```javascript
{
  name: String (required),
  category: String (required) - ['ELECTRONICS', 'HOME', 'APPAREL', 'WELLNESS'],
  description: String,
  price: Number (required),
  stock: Number (required),
  image: String
}
```

## Order Schema

```javascript
{
  customerEmail: String (required),
  products: [{
    productId: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number (required),
  status: String (default: 'Pending') - ['Pending', 'Processing', 'Completed']
}
```

## Development Notes

- The frontend includes fallback sample data if the backend is not available
- Currency is set to Rupees (₹) throughout the application
- The application uses a clean, modern enterprise dashboard design
- All prices are stored and displayed in Rupees

## Future Enhancements

- Admin dashboard for product and order management
- User authentication with JWT tokens
- Real-time inventory updates
- Order tracking system
- Payment integration
- Analytics dashboard with charts
