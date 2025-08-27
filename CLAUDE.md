# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Important
Keep the keep very simple, easy to manage. 
Keep the UI/UX clean, minimal and fast. 
DON'T BE LAZY. Read complete files.
Detail out your steps from broad perspective. 
I am a Product Manager without coding experience. 

## Project Overview

BestCVBuilder is a mobile-first web application that provides ATS (Applicant Tracking System) score analysis for resumes and offers AI-powered CV rewrites. The application uses a modern serverless architecture with Supabase for backend services and Render.com for hosting both frontend and backend APIs.

## Development Commands

### Frontend Development
```bash
# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Watch Tailwind CSS changes
npm run tailwind:watch
```

### Python API Development
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

### Deployment
```bash
# Deploy to Render.com
# Frontend: Auto-deployed from GitHub repository
# Backend: Auto-deployed from GitHub repository to separate Render service
git push origin main
```

## Architecture Overview

### Tech Stack
- **Frontend**: Vanilla JavaScript + Tailwind CSS (mobile-first) - hosted on Render.com
- **Backend**: Supabase (auth, database, file storage)
- **API**: Python serverless functions on Render.com
- **Payment**: PayU integration (replacing Stripe)
- **Hosting**: Render.com for both frontend and backend services

### Key Architecture Patterns

1. **Backend-First Architecture**: Python functions in `/api/` directory are deployed as Render.com web services. All business logic, scoring calculations, and data processing happen on the backend. Frontend is purely a presentation layer.

2. **Module-Based Frontend**: JavaScript modules in `/public/js/` handle different aspects:
   - `main.js`: Main application logic and file upload handling
   - `supabase.js`: Supabase client configuration
   - `fileUpload.js`: File upload utilities
   - `atsAnalysis.js`: ATS analysis API calls (frontend makes API calls, backend does all calculations)
   - `result-simple.js`: Results display and user interactions
   - `payment.js`: PayU payment integration

3. **Multi-Page SPA Flow**: Uses session storage to pass data between pages:
   - `index.html` → `result.html` → `payment.html` → `success.html`

4. **Database Schema**: Comprehensive schema with user profiles, analysis results, payments, CV rewrites, and feedback tracking

5. **ATS Scoring System**: All scoring calculations are performed on the backend Python APIs:
   - Frontend sends resume file URLs to backend
   - Backend processes documents, calculates ATS scores, identifies issues
   - Backend returns complete analysis results to frontend for display only

### File Upload & Processing Flow
1. File uploaded to Supabase storage via `fileUpload.js`
2. File URL passed to Python API (`/api/cv-parser/`) hosted on `bestcvbuilder-api.onrender.com`
3. Backend performs all ATS scoring calculations and returns complete analysis
4. Results stored in session storage and displayed on results page (frontend: `bestcvbuilder-frontend.onrender.com`)
5. Order creation via `/api/orders/create-order` for payment processing
6. Payment triggers CV rewrite via `/api/cv-optimizer/` endpoint

### Environment Configuration
The application requires these environment variables:
- `SUPABASE_URL`: Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Supabase publishable key
- `PAYU_MERCHANT_ID`: PayU merchant ID
- `PAYU_SALT`: PayU salt for payment hash generation
- `GEMINI_API_KEY`: Google Gemini API key for AI processing

## Key Implementation Details

### Render.com Deployment Strategy
- **Frontend Service**: Static site deployment from `frontend/` directory
- **Backend Service**: Python web service deployment from `api/` directory
- **Domain Configuration**: 
  - Frontend: `bestcvbuilder-frontend.onrender.com`
  - Backend APIs: `bestcvbuilder-api.onrender.com`
- **Cross-Origin Setup**: CORS configured to allow frontend domain to access backend APIs

### Database Relationships
- User profiles extend Supabase auth.users
- Analysis results link to users and store ATS scores + analysis data (calculated on backend only)
- Orders table tracks PayU transactions and links to analysis results
- CV rewrites store improved resume versions and updated scores
- All scoring data originates from backend Python APIs, never calculated on frontend

### Security Considerations
- CORS headers implemented in Python APIs
- File type and size validation (PDF, DOCX, DOC max 10MB)
- Row Level Security policies in Supabase
- Secure file storage with access controls

## Development Guidelines

### Working with the Frontend
- All JavaScript uses ES6 modules
- Tailwind CSS classes follow mobile-first responsive design
- Error handling with user-friendly notifications
- Session storage used for cross-page data flow
- **CRITICAL**: Frontend is purely presentational - NO scoring calculations allowed
- Frontend only makes API calls to backend and displays returned results

### Working with Python APIs
- Follow existing error handling patterns with try/catch and proper HTTP status codes
- Use CORS headers for all API responses (include `bestcvbuilder-frontend.onrender.com`)
- Log important events for debugging
- Validate input parameters and file types
- **CRITICAL**: All business logic and scoring calculations must happen on backend APIs
- APIs deployed on Render.com at `bestcvbuilder-api.onrender.com`

### Database Migrations
- Use descriptive migration names
- Include rollback statements where applicable
- Test migrations locally before deployment
- Document schema changes in migration comments`