import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.routes.js';
import costumeRoutes from './routes/costume.routes.js';
import rentalRoutes from './routes/rental.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

import createAdmin from './seed/createAdmin.js';

createAdmin();

// ES6 alternative for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize express app
const app = express();

//  MIDDLEWARE 
// Security middleware
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);



// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/costumes', costumeRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'outfit-rental-api'
  });
});

// ERROR HANDLING
app.use(errorHandler.notFound);

// Global error handler
app.use(errorHandler.errorHandler);

// Database error handler
app.use(errorHandler.handleDatabaseError);

//  SERVER START 
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API Base URL: http://localhost:${PORT}/api`);
});

export default app;