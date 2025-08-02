# BestCVBuilder - ATS Score Checker & CV Updater

A mobile-first responsive web application that helps users analyze their resumes for ATS compatibility and purchase AI-powered CV improvements.

## 🎯 Features

- **ATS Score Analysis**: Instant resume analysis with ATS compatibility scoring
- **AI-Powered Rewrite**: Get an optimized version of your resume
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Secure File Upload**: Support for PDF, DOCX, and DOC files
- **Payment Integration**: Stripe-powered payment processing
- **User Authentication**: Supabase-powered user management
- **Email Notifications**: Automated email delivery of improved resumes

## 🏗️ Architecture

### Tech Stack
- **Frontend**: HTML5 + Tailwind CSS (Mobile-first)
- **Backend**: Supabase (Auth, Database, File Storage)
- **API**: Python serverless functions on Vercel
- **Payment**: Stripe integration
- **Hosting**: Vercel

### Project Structure
```
bestcvbuilder/
├── public/                 # Frontend pages
│   ├── index.html         # Landing page
│   ├── result.html        # Analysis results
│   ├── payment.html       # Payment page
│   ├── css/              # Compiled Tailwind CSS
│   └── js/               # JavaScript modules
├── src/
│   └── css/              # Tailwind source files
├── api/                  # Python API endpoints
│   ├── cv-parser/        # ATS analysis API
│   └── cv-rewrite/       # CV rewrite API
├── supabase/             # Database configuration
│   ├── config.toml       # Supabase config
│   └── migrations/       # Database migrations
├── package.json          # Node.js dependencies
├── tailwind.config.js    # Tailwind configuration
├── vite.config.js        # Vite configuration
├── vercel.json          # Vercel deployment config
└── requirements.txt      # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- Stripe account
- Vercel account

### 1. Clone and Install
```bash
git clone <repository-url>
cd bestcvbuilder
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
# - Supabase URL and publishable key
# - Stripe API keys
# - Email service credentials
```

### 3. Supabase Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local development
supabase start

# Apply migrations
supabase db push
```

### 4. Development Server
```bash
# Start Vite development server
npm run dev

# In another terminal, watch Tailwind CSS
npm run tailwind:watch
```

### 5. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📋 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Update `supabase/config.toml` with your project details
3. Run migrations: `supabase db push`
4. Configure storage buckets for resume uploads
5. Set up Row Level Security policies

### Stripe Integration
1. Create a Stripe account
2. Get your API keys from the dashboard
3. Set up webhook endpoints for payment events
4. Configure payment products and pricing

### Email Service
1. Set up SendGrid account
2. Configure email templates
3. Add domain verification
4. Set up email sending permissions

## 🔧 Development

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### API Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Test API endpoints locally
python api/cv-parser/index.py
python api/cv-rewrite/index.py
```

### Database Development
```bash
# Start local Supabase
supabase start

# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

## 📱 User Flow

1. **Landing Page** (`index.html`)
   - User uploads resume (PDF/DOCX/DOC)
   - File validation and upload to Supabase storage
   - Call to Python API for ATS analysis

2. **Results Page** (`result.html`)
   - Display ATS score and analysis
   - Show strengths and improvement areas
   - Present upgrade options

3. **Payment Page** (`payment.html`)
   - Collect user email
   - Process payment via Stripe
   - Trigger CV rewrite process

4. **Success Flow**
   - AI-powered resume rewrite
   - Email notification with download link
   - Updated ATS score display

## 🔒 Security Features

- **File Validation**: Type and size restrictions
- **Row Level Security**: Database access control
- **CORS Protection**: Cross-origin request handling
- **Input Sanitization**: XSS prevention
- **Secure File Storage**: Supabase storage with access controls

## 📊 Database Schema

### Core Tables
- `user_profiles`: Extended user information
- `analysis_results`: ATS analysis data
- `payments`: Payment transaction records
- `cv_rewrites`: AI rewrite results
- `feedback`: User feedback and ratings
- `user_sessions`: Session tracking

### Security Policies
- Users can only access their own data
- Automatic user profile creation on signup
- Secure file upload with validation

## 🎨 Styling

### Tailwind CSS Configuration
- Mobile-first responsive design
- Custom color scheme for brand
- Component classes for consistency
- Dark mode support (future)

### Design System
- Primary colors: Blue (#3b82f6)
- Success colors: Green (#22c55e)
- Warning colors: Orange (#f59e0b)
- Typography: Inter font family

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set up custom domain (optional)
4. Enable automatic deployments

### Environment Variables
```bash
# Required for production
SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
SENDGRID_API_KEY=your_sendgrid_key
```

## 🔍 Testing

### Frontend Testing
```bash
# Run tests (when implemented)
npm test

# E2E testing with Playwright
npx playwright test
```

### API Testing
```bash
# Test API endpoints
python -m pytest tests/
```

## 📈 Monitoring

### Analytics
- User session tracking
- Conversion rate monitoring
- Error logging and alerting
- Performance metrics

### Logging
- Application logs via Vercel
- Database query monitoring
- Payment transaction logs
- Error tracking with Sentry

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic ATS analysis
- ✅ File upload functionality
- ✅ Payment integration
- ✅ Mobile-responsive design

### Phase 2 (Future)
- 🔄 Advanced AI analysis
- 🔄 Industry-specific optimization
- 🔄 Resume templates
- 🔄 Job matching features

### Phase 3 (Future)
- 🔄 Multi-language support
- 🔄 Advanced analytics dashboard
- 🔄 API for third-party integrations
- 🔄 White-label solutions
