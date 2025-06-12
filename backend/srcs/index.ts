import unifiedRoutes from './routes/unified';
import referralRoutes from './routes/referrals';
import organizerRoutes from './routes/organizer';
import analyticsRoutes from './routes/analytics';

// Load environment variables
config.load();

app.use('/api/users', userRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/unified', unifiedRoutes); // Database-agnostic routes
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
// ... existing code ...
}); 