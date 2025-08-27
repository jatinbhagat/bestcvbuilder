# BestCVBuilder - ATS Resume Analysis & Optimization Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Version](https://img.shields.io/badge/version-2.0-blue)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#)

## Overview

BestCVBuilder is a comprehensive, mobile-first web application that provides **ATS (Applicant Tracking System) score analysis** and **AI-powered resume optimization**. The platform analyzes resumes across **24 comprehensive categories** and generates detailed improvement recommendations using advanced backend analysis and Gemini LLM integration.

### 🌟 Key Features

- **📊 24-Category ATS Analysis**: Comprehensive scoring across all resume aspects
- **🤖 AI-Powered Optimization**: Gemini LLM integration for smart suggestions  
- **📱 Mobile-First Design**: Responsive, clean UI optimized for all devices
- **🔍 Zero Hardcoded Data**: All analysis uses real backend functions - no fallbacks
- **💡 Evidence-Based Feedback**: Specific quotes and examples from actual CV content
- **🚀 Enhanced TXT Reports**: Detailed analysis reports with verification system
- **💳 PayU Payment Integration**: Seamless payment processing for Indian market
- **☁️ Cloud Architecture**: Hosted on Render.com with Supabase backend

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Backend**: Flask Python + comprehensive CV analysis engine
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI Processing**: Google Gemini 2.0 Flash
- **Payments**: PayU integration
- **Hosting**: Render.com (Frontend + Backend)

### Backend-First Design
```
Frontend (UI Layer)          Backend (Business Logic)         Database
     ↓                              ↓                           ↓
File Upload         →      CV Analysis (24 categories)    →   Supabase
Results Display     ←      Scoring + Evidence            ←   (Storage + Auth)
Payment Flow        →      PayU Integration              →   Order Tracking
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account
- Google Gemini API key
- PayU merchant credentials

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/your-username/bestcvbuilder.git
cd bestcvbuilder
```

2. **Backend Setup**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-supabase-key"
export PAYU_MERCHANT_ID="your-payu-merchant-id"
export PAYU_SALT="your-payu-salt"
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Database Setup**
```bash
# Start Supabase (optional for local development)
supabase start

# Apply migrations
supabase db push
```

### Local Development

```bash
# Start backend server
python app.py
# Backend runs on http://localhost:5000

# Start frontend development server  
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## 📋 Core Components

### 1. ATS Analysis Engine (`api/cv-parser/`)
- **24 Comprehensive Categories**: Grammar, Spelling, Verb Tenses, Personal Pronouns, etc.
- **Real-Time Scoring**: Dynamic analysis using `generate_comprehensive_ats_scores_frontend()`
- **Evidence Extraction**: Specific examples and quotes from actual CV content
- **No Hardcoded Data**: All analysis from real backend functions

### 2. Enhanced TXT Report Generator (`api/enhanced_txt_generator.py`)
```bash
# Generate comprehensive analysis report
python api/enhanced_txt_generator.py path/to/resume.txt
```

**Features:**
- ✅ **Zero Hardcoded Scores**: All analysis from real backend functions
- 🧠 **Gemini LLM Integration**: AI-powered Grammar/Spelling error detection
- 🔍 **Verification System**: Built-in validation ensures data authenticity
- 📊 **Evidence-Based Reports**: Specific quotes and improvement suggestions

**Sample Output:**
```
🚨 CRITICAL ISSUES (IMMEDIATE ATTENTION REQUIRED)
============================================================
1. VERB TENSES: Verb Tenses Analysis
   Current Score: 2/10 – Critical

   💡 SCORING BREAKDOWN:
   ATS Rule: Use past tense for previous roles, present tense only for current position
   Analysis: Poor tense usage: Found 5 present tense vs 4 past tense verbs
   Penalties Applied: Too many present tense verbs: -6 points (10 → 4)

   **Evidence**: "Developed microservices architecture serving 1M+ daily users..."
   **Why this matters**: Consistent tenses improve professional presentation.
   **Fix**: Convert past role descriptions to past tense: "Led" → "Led team of 4 engineers"

🔍 DATA VERIFICATION REPORT
============================================================
✅ Categories with real backend analysis: 24/24 (100%)
🚀 Categories with enhanced backend analysis: 8
⚠️ Categories using fallback analysis: 0 (0%)
🎯 Analysis validity: VERIFIED - All real backend data
```

### 3. CV Optimizer (`api/cv-optimizer/`)
- **Gemini 2.0 Flash Integration**: Cost-effective AI optimization
- **Structured Improvements**: Evidence-based enhancement suggestions
- **Token Usage Tracking**: Cost monitoring and optimization
- **Fallback Handling**: Graceful degradation when AI unavailable

### 4. Payment System (`api/orders/`)
- **PayU Integration**: Secure payment processing for Indian market
- **Order Management**: Complete payment lifecycle tracking
- **Contact Extraction**: Automatic user details from CV content
- **Callback Handling**: Success/failure URL management

## 📊 24-Category ATS Analysis

| Category | Description | Weight |
|----------|-------------|---------|
| **Contact Details** | Professional contact information completeness | Critical |
| **Education Section** | Education formatting and presentation | High |
| **Skills Section** | Technical/soft skills organization | High |
| **Verb Tenses** | Past/present tense consistency | Critical |
| **Personal Pronouns** | Removal of first-person pronouns | High |
| **Grammar** | Grammar accuracy (Gemini LLM enhanced) | Critical |
| **Spelling** | Spelling accuracy (Gemini LLM enhanced) | Critical |
| **Action Verbs** | Strong action verb usage | High |
| **Quantifiable Achievements** | Numbers and metrics inclusion | High |
| **Repetition** | Action verb variety | Medium |
| **Active Voice** | Active vs passive voice usage | Medium |
| **Summary** | Professional summary optimization | High |
| **Leadership** | Leadership experience demonstration | Medium |
| **Teamwork** | Collaboration examples | Medium |
| **Analytical** | Analytical thinking examples | Medium |
| **Drive** | Self-motivation indicators | Medium |
| **Growth Signals** | Career progression evidence | Medium |
| **Page Density** | Layout and white space optimization | Medium |
| **Use of Bullets** | Consistent bullet formatting | Medium |
| **Verbosity** | Concise language usage | Low |
| **Unnecessary Sections** | Outdated section removal | Low |
| **Certifications** | Professional certifications | Medium |
| **Dates** | Consistent date formatting | Medium |
| **CV Readability Score** | Overall document readability | High |

## 🔧 API Endpoints

### Core Endpoints
```
GET  /health                    - Service health check
POST /api/cv-parser             - Resume ATS analysis  
POST /api/cv-optimizer          - AI-powered optimization
POST /api/job-analyzer          - Job description analysis
POST /api/orders/create-order   - Payment order creation
POST /api/orders/initiate-payment - PayU payment initialization
GET  /api/config/               - Application configuration
```

### Example Usage
```bash
# Analyze resume
curl -X POST https://bestcvbuilder-api.onrender.com/api/cv-parser \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/resume.pdf"}'

# Optimize resume
curl -X POST https://bestcvbuilder-api.onrender.com/api/cv-optimizer \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "Resume content here",
    "job_requirements": "Job description here", 
    "ats_issues": ["verb_tenses", "personal_pronouns"]
  }'
```

## 🌐 Deployment

### Render.com Configuration

**Frontend Service:**
```yaml
# render-frontend.yaml
services:
  - type: static_site
    name: bestcvbuilder-frontend
    env: node
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
```

**Backend Service:**
```yaml
# render-api.yaml  
services:
  - type: web
    name: bestcvbuilder-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
```

### Environment Variables
```bash
# Required for production
SUPABASE_URL=your-supabase-project-url
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
PAYU_MERCHANT_ID=your-payu-merchant-id
PAYU_SALT=your-payu-salt-key
```

### Deployment Process
```bash
# Deploy to production
git add .
git commit -m "Deploy updates"
git push origin main
# Render.com auto-deploys both services
```

## 🔒 Security Features

- **Input Validation**: All file types and sizes validated
- **CORS Configuration**: Restricted to frontend domain only
- **Environment Variables**: Sensitive data in secure environment
- **Row Level Security**: Supabase RLS policies for data protection
- **Rate Limiting**: Request timeouts prevent resource abuse
- **File Type Restrictions**: PDF, DOCX, DOC only, max 10MB

## 🧪 Testing

### API Testing
```bash
# Test backend health
curl https://bestcvbuilder-api.onrender.com/health

# Test CV analysis with sample file
python api/enhanced_txt_generator.py api/test_cv_sample.txt
```

### Local Testing
```bash
# Run Flask app with debug mode
flask --app app run --debug

# Test frontend locally
cd frontend && npm run dev
```

## 📈 Performance Monitoring

- **Memory Management**: Garbage collection for large file processing
- **Request Timeouts**: Prevent resource exhaustion
- **Token Usage Tracking**: Gemini API cost monitoring
- **Error Logging**: Comprehensive logging for debugging
- **Verification System**: Data authenticity validation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines
- Follow backend-first architecture principles
- Ensure NO hardcoded data in analysis functions
- Add verification for new analysis categories
- Include comprehensive error handling
- Document all API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - Advanced language model integration
- **Supabase** - Backend-as-a-Service platform
- **Render.com** - Cloud hosting and deployment
- **PayU** - Payment processing for Indian market
- **Tailwind CSS** - Utility-first CSS framework

---

## 📞 Support

For support and questions:
- 🌐 Website: [bestcvbuilder.com](https://bestcvbuilder.com)
- 📧 Email: support@bestcvbuilder.com
- 📖 Documentation: See [CLAUDE.md](CLAUDE.md) for detailed technical guidance

**Built with ❤️ for job seekers worldwide**