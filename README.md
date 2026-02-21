# Outfit Rental Website

A full-stack web application that allows users to rent outfits online.  
The system provides product browsing, rental ordering, and an admin dashboard for managing inventory and orders.

## Tech Stack

### Frontend
- ReactJS
- Axios
- React Router DOM

### Backend
- Node.js
- ExpressJS
- RESTful API Architecture

### Database
- MySQL (Relational Database)

## Main Features

### User
- Register / Login (JWT Authentication)
- Browse and filter outfits
- View product details
- Add to cart
- Place rental orders
- View order history

### Admin
- CRUD products
- Manage categories
- Manage users
- Manage orders
- Basic dashboard statistics

---

## System Architecture

- MVC Pattern
- RESTful API Design
- Role-based Authorization (Admin/User)
- Relational Database with normalized schema

## Project Structure

outfit-rental/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── config/
│
└── frontend/
    ├── components/
    ├── pages/
    ├── services/
    └── utils/
    
## Installation

### Backend setup

```bash
cd backend
npm install
npm run dev
```
### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

