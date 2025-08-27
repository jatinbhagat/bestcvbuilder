# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Important Guidelines
- Keep everything simple, easy to manage
- Keep the UI/UX clean, minimal and fast  
- DON'T BE LAZY. Read complete files before making changes
- Detail out your steps from a broad perspective
- I am a Product Manager without coding experience - explain technical concepts clearly

## Project Overview

BestCVBuilder is a mobile-first web application that provides ATS (Applicant Tracking System) score analysis for resumes and offers AI-powered CV optimization. The application uses a modern architecture with Supabase for backend services, Render.com for hosting, and PayU for payments.

## Architecture Overview

### Tech Stack
- **Frontend**: Vanilla JavaScript + Tailwind CSS (mobile-first) - hosted on Render.com
- **Backend**: Flask Python web service on Render.com
- **Database**: Supabase (auth, database, file storage)
- **AI Processing**: Google Gemini API for intelligent resume optimization
- **Payment**: PayU integration for Indian market
- **Hosting**: Render.com for both frontend (static) and backend (web service)

### Key Architecture Principles

1. **Backend-First Architecture**: 
   - All business logic, scoring calculations, and data processing happen on the backend
   - Frontend is purely a presentation layer - NO calculations allowed
   - Flask app (`app.py`) serves all API endpoints

2. **Clear Separation of Concerns**:
   - **Frontend** (`frontend/`): UI, user interactions, API calls, data display
   - **Backend APIs** (`api/`): Business logic modules imported by Flask app
   - **Database** (Supabase): Data persistence, user management, file storage

3. **ATS Scoring System**:
   - Frontend uploads resume files to Supabase storage
   - Frontend sends file URLs to backend APIs
   - Backend downloads, parses, analyzes, and scores documents (24 categories)
   - Backend returns complete analysis results with detailed evidence
   - Frontend displays results only (NO scoring calculations)
   
4. **Enhanced TXT Report System**:
   - Comprehensive analysis reports with all 24 ATS categories
   - Real backend integration - NO hardcoded scores or fallbacks
   - Gemini LLM integration for Grammar/Spelling specific evidence
   - Built-in verification system to ensure data authenticity
   - Evidence extraction from actual CV content only

### Deployment Architecture

- **Frontend Service**: Static site deployment from `frontend/` directory
  - Domain: `bestcvbuilder-frontend.onrender.com`
  - Serves HTML, CSS, JavaScript files
  - Auto-deploys from GitHub main branch

- **Backend Service**: Flask web service deployment from project root
  - Domain: `bestcvbuilder-api.onrender.com`
  - Runs `app.py` via gunicorn
  - Imports API modules from `api/` directory
  - Auto-deploys from GitHub main branch

### File Structure
```
/
├── app.py                 # Main Flask application (entry point)
├── frontend/             # Frontend source code
│   ├── js/              # JavaScript modules
│   ├── css/             # Tailwind CSS files
│   └── *.html           # HTML pages
├── api/                 # Backend API modules
│   ├── cv-parser/       # ATS analysis logic (24 categories)
│   ├── cv-optimizer/    # AI-powered resume improvement + Gemini LLM
│   ├── orders/          # Payment and order management
│   ├── job-analyzer/    # Job description analysis
│   ├── enhanced_txt_generator.py  # Comprehensive TXT report generator
│   └── *.txt            # Generated ATS analysis reports
├── supabase/           # Database migrations and config
├── render-*.yaml       # Render.com deployment configurations
└── requirements*.txt   # Python dependencies
```

## Development Commands

### Local Development
```bash
# Frontend development (if using Vite for local dev)
cd frontend
npm run dev

# Backend development (Flask app)
python app.py
# or with auto-reload
flask --app app run --debug

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies (for build tools)
cd frontend && npm install
```

### Database Development
```bash
# Start local Supabase (optional for local testing)
supabase start

# Create new migration
supabase migration new migration_name

# Apply migrations to production
supabase db push

# Reset local database
supabase db reset
```

### Production Deployment
```bash
# Deploy both services to Render.com
git add .
git commit -m "Deploy updates"
git push origin main

# Render.com will auto-deploy:
# - Frontend service from frontend/ directory
# - Backend service from project root using app.py
```

### Testing API Endpoints
```bash
# Test backend health
curl https://bestcvbuilder-api.onrender.com/health

# Test CV analysis endpoint
curl -X POST https://bestcvbuilder-api.onrender.com/api/cv-parser \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/resume.pdf"}'

# Generate enhanced TXT report locally
python api/enhanced_txt_generator.py path/to/resume.txt
```

## Key Implementation Details

### Flask Application Structure
- **Entry Point**: `app.py` - main Flask application
- **Route Handlers**: Each API endpoint imports functions from `api/` modules
- **CORS**: Configured to allow `bestcvbuilder-frontend.onrender.com`
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Timeout Management**: Request timeouts to prevent resource exhaustion

### API Endpoints
- `GET /health` - Health check and service status
- `POST /api/cv-parser` - Resume ATS analysis
- `POST /api/cv-optimizer` - AI-powered resume optimization
- `POST /api/job-analyzer` - Job description analysis
- `POST /api/orders/create-order` - Create payment order
- `POST /api/orders/initiate-payment` - Initialize PayU payment
- `GET /api/config/` - Application configuration

### Enhanced TXT Report Generator
- **Location**: `api/enhanced_txt_generator.py`
- **Purpose**: Generate comprehensive ATS analysis reports with all 24 categories
- **Key Features**:
  - **Zero Hardcoded Data**: All analysis from real backend functions
  - **Complete Backend Integration**: Uses `generate_comprehensive_ats_scores_frontend()`
  - **Gemini LLM Enhancement**: AI-powered Grammar/Spelling evidence extraction
  - **Verification System**: Built-in validation ensures no fallback data
  - **Evidence Extraction**: Real CV content analysis with specific examples
- **Usage**: `python enhanced_txt_generator.py <cv_file_path>`
- **Output**: Detailed TXT report with Evidence/Why/Fix blocks for each category

### Frontend JavaScript Modules
- `main.js` - Main application logic and file upload
- `supabase.js` - Supabase client configuration
- `fileUpload.js` - File upload utilities
- `atsAnalysis.js` - API calls to backend (NO scoring logic)
- `result-simple.js` - Results display and user interactions
- `create-order.js` - Order creation and payment flow

### Database Schema (Supabase)
- `user_profiles` - User information and preferences
- `analysis_results` - ATS analysis data (from backend only)
- `orders` - PayU payment tracking
- `cv_rewrites` - AI-optimized resume versions
- `job_analysis` - Job description analysis results

### Environment Configuration
**Required Environment Variables:**
- `SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (backend only)
- `PAYU_MERCHANT_ID` - PayU merchant ID for payments
- `PAYU_SALT` - PayU salt for hash generation
- `GEMINI_API_KEY` - Google Gemini API key for AI processing
- `PORT` - Port number (provided by Render.com)

### PayU Payment Integration
- **Order Creation**: Extract contact info from resume, generate unique order ID
- **Payment Hash**: Generate secure PayU payment hash using merchant credentials
- **Callback URLs**: Use frontend domain for success/failure redirects
- **Order Status**: Track payment status in database

### Security Considerations
- **CORS**: Properly configured for frontend domain only
- **File Validation**: PDF, DOCX, DOC files only, max 10MB
- **Input Sanitization**: All user inputs validated and sanitized
- **Environment Variables**: Sensitive credentials stored securely
- **Rate Limiting**: Timeout controls to prevent resource abuse
- **Row Level Security**: Supabase RLS policies for data protection

## Development Guidelines

### Working with Frontend Code
- **Pure Presentation Layer**: No business logic or calculations
- **ES6 Modules**: All JavaScript uses modern module syntax
- **Mobile-First**: Tailwind CSS with responsive design
- **Session Storage**: For passing data between pages
- **Error Handling**: User-friendly error messages
- **API Integration**: Only makes calls to backend, displays results

### Working with Backend APIs
- **Business Logic Only**: All calculations and processing on backend
- **Flask Integration**: API modules imported by `app.py`
- **CORS Headers**: Include proper CORS for frontend domain
- **Error Handling**: Consistent error response format
- **Input Validation**: Validate all parameters and file types
- **Logging**: Comprehensive logging for debugging
- **Memory Management**: Garbage collection for large file processing

### Working with Enhanced TXT Generator
- **No Hardcoded Data**: System enforces real CV input, rejects sample/fallback data
- **Backend Function Integration**: All 24 categories use real analysis functions
- **Evidence Verification**: Built-in system validates that evidence comes from actual CV
- **Gemini LLM Integration**: Grammar/Spelling categories use AI for specific error detection
- **Data Source Tracking**: Verification footer shows source type for each category:
  - 🚀 Enhanced Backend Extracted (detailed analysis + evidence)
  - ✅ Backend Extracted (standard backend analysis)
  - ⚠️ Generic Fallback (should be 0 - indicates system failure)
- **Error Handling**: Fails gracefully when backend functions unavailable (no fallbacks)

### Database Development
- **Migrations**: Use descriptive names and include rollback statements
- **RLS Policies**: Implement proper row-level security
- **Indexing**: Add indexes for frequently queried columns
- **Data Validation**: Use database constraints where appropriate

### Testing Guidelines
- **API Testing**: Use curl or Postman for endpoint testing
- **Local Development**: Test with local Flask server
- **Error Scenarios**: Test error handling and edge cases
- **Performance**: Monitor response times and memory usage

## Deployment Process

### Render.com Configuration
1. **Frontend Service** (`render-frontend.yaml`):
   - Static site deployment
   - Serves files from `frontend/` directory
   - Auto-deploy from GitHub

2. **Backend Service** (`render-api.yaml`):
   - Web service deployment
   - Runs Flask app with gunicorn
   - Auto-deploy from GitHub

### Deployment Checklist
- [ ] Environment variables configured in Render.com dashboard
- [ ] Database migrations applied to production Supabase
- [ ] Frontend build artifacts updated
- [ ] Backend dependencies specified in requirements.txt
- [ ] CORS origins updated for production domains
- [ ] PayU credentials configured for production

## Common Issues & Solutions

### API Connection Issues
- **Problem**: Frontend can't connect to backend APIs
- **Solution**: Check CORS configuration, verify API URLs use correct domain

### Payment Integration Issues
- **Problem**: PayU payment failures
- **Solution**: Verify merchant credentials, check hash generation, validate callback URLs

### File Upload Issues
- **Problem**: Resume uploads failing
- **Solution**: Check Supabase storage policies, verify file size limits, validate file types

### Performance Issues
- **Problem**: Slow API responses
- **Solution**: Monitor memory usage, implement timeouts, optimize document processing

Remember: This is a **backend-first architecture** where all business logic happens on the backend APIs, and the frontend is purely for presentation and user interaction.