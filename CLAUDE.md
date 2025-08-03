# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Important
Keep the keep very simple, easy to manage. 
Keep the UI/UX clean, minimal and fast. 
DON'T BE LAZY. Read complete files.
Detail out your steps from broad perspective. 
I am a Product Manager without coding experience. 
Simplify Vercel config: Let Vercel auto-detect Python functions


## Project Overview

BestCVBuilder is a mobile-first web application that provides ATS (Applicant Tracking System) score analysis for resumes and offers AI-powered CV rewrites. The application uses a modern serverless architecture with Supabase for backend services and Vercel for hosting.

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
# Deploy to Vercel
vercel --prod
```

## Architecture Overview

### Tech Stack
- **Frontend**: Vanilla JavaScript + Tailwind CSS (mobile-first)
- **Backend**: Supabase (auth, database, file storage)
- **API**: Python serverless functions on Vercel
- **Payment**: Stripe integration
- **Hosting**: Vercel

### Key Architecture Patterns

1. **Serverless API Architecture**: Python functions in `/api/` directory are deployed as Vercel serverless functions with specific runtime configurations in `vercel.json`

2. **Module-Based Frontend**: JavaScript modules in `/public/js/` handle different aspects:
   - `main.js`: Main application logic and file upload handling
   - `supabase.js`: Supabase client configuration
   - `fileUpload.js`: File upload utilities
   - `atsAnalysis.js`: ATS analysis API calls
   - `payment.js`: Stripe payment integration

3. **Multi-Page SPA Flow**: Uses session storage to pass data between pages:
   - `index.html` → `result.html` → `payment.html` → `success.html`

4. **Database Schema**: Comprehensive schema with user profiles, analysis results, payments, CV rewrites, and feedback tracking

### File Upload & Processing Flow
1. File uploaded to Supabase storage via `fileUpload.js`
2. File URL passed to Python API (`/api/cv-parser/`) for ATS analysis
3. Results stored in session storage and displayed on results page
4. Payment triggers CV rewrite via `/api/cv-rewrite/` endpoint

### Environment Configuration
The application requires these environment variables:
- `SUPABASE_URL`: Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Supabase publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Key Implementation Details

### Vite Configuration
- Root directory set to `public/` 
- Build output to `../dist`
- Development server on port 3000

### Vercel Deployment Strategy
- Static files served from `public/`
- Python APIs with different timeout configurations (30s for parser, 60s for rewrite)
- Route configuration handles both static content and API endpoints

### Database Relationships
- User profiles extend Supabase auth.users
- Analysis results link to users and store ATS scores + analysis data
- Payments track Stripe transactions and link to analysis results
- CV rewrites store improved resume versions and updated scores

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

### Working with Python APIs
- Follow existing error handling patterns with try/catch and proper HTTP status codes
- Use CORS headers for all API responses
- Log important events for debugging
- Validate input parameters and file types

### Database Migrations
- Use descriptive migration names
- Include rollback statements where applicable
- Test migrations locally before deployment
- Document schema changes in migration comments