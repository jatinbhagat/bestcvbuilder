# Advanced ATS Resume Parser API

## Overview

This is a production-ready, comprehensive ATS (Applicant Tracking System) resume parser that provides industry-aligned scoring and detailed recommendations for resume optimization.

## Features

### 🎯 **Multi-Component Scoring System (100 points total)**

1. **Content Structure Analysis (25 points)**
   - Essential sections detection (Contact, Experience, Education, Skills)
   - Section organization and hierarchy
   - Optional valuable sections (Summary, Projects, Certifications)

2. **Keyword Optimization (30 points)**
   - Industry-specific keyword matching
   - Action verb usage analysis
   - Keyword density and context evaluation
   - Diminishing returns for keyword stuffing prevention

3. **Contact Information Analysis (15 points)**
   - Email, phone number validation
   - Professional profiles (LinkedIn, GitHub)
   - Contact format verification

4. **Formatting Quality Assessment (20 points)**
   - ATS readability factors
   - Consistent spacing and formatting
   - Special character detection
   - Bullet point structure analysis

5. **Quantified Achievements Detection (10 points)**
   - Percentage improvements
   - Dollar amounts and revenue impact
   - Team sizes and project metrics
   - Performance indicators

6. **Readability and Length Analysis (15 points - bonus)**
   - Optimal word count (400-600 words)
   - Sentence length analysis
   - Content density evaluation

### 🏭 **Industry-Specific Analysis**

The system automatically detects the most likely industry and applies targeted keyword analysis:

- **Technology**: Programming languages, frameworks, methodologies, cloud platforms
- **Marketing**: Digital marketing, analytics tools, campaign management
- **Finance**: Financial modeling, compliance, analysis tools
- **Sales**: CRM systems, metrics, prospecting skills
- **Human Resources**: Recruiting tools, compliance, development
- **Operations**: Supply chain, process improvement, quality management

### 🔍 **Advanced Text Extraction**

- **PDF Processing**: PyPDF2 with pdfplumber fallback for complex layouts
- **DOCX Processing**: Full paragraph and table text extraction
- **DOC Processing**: Legacy format support with docx2txt
- **Error Handling**: Comprehensive validation and user-friendly error messages

### 🎯 **Intelligent Recommendations**

- **Strengths Identification**: Highlights what's working well
- **Critical Issues**: Must-fix problems that hurt ATS compatibility
- **Improvement Suggestions**: Prioritized recommendations
- **Next Steps**: Actionable, prioritized task list

## API Usage

### Endpoint
```
POST /api/cv-parser
```

### Request Body
```json
{
  "file_url": "https://example.com/resume.pdf",
  "analysis_type": "comprehensive",
  "include_recommendations": true
}
```

### Response Format
```json
{
  "ats_score": 78,
  "category": "good",
  "description": "Good ATS compatibility - some optimization recommended",
  "industry": "technology",
  "component_scores": {
    "structure": 22,
    "keywords": 18,
    "contact": 12,
    "formatting": 16,
    "achievements": 6,
    "readability": 4
  },
  "detailed_analysis": {
    "structure": {
      "score": 22,
      "essential_sections": ["contact", "experience", "education", "skills"],
      "optional_sections": ["projects", "certifications"],
      "missing_sections": []
    },
    "keywords": {
      "score": 18,
      "analysis": {
        "industry_keywords": {
          "programming": [
            {"keyword": "python", "count": 3, "density": 5.2},
            {"keyword": "javascript", "count": 2, "density": 3.4}
          ]
        },
        "action_verbs": {
          "leadership": [
            {"verb": "led", "count": 2},
            {"verb": "managed", "count": 1}
          ]
        }
      }
    }
  },
  "strengths": [
    "Well-organized resume structure with essential sections",
    "Good use of relevant keywords and action verbs"
  ],
  "improvements": [
    "Add more quantified achievements with specific numbers"
  ],
  "critical_issues": [],
  "suggestions": [
    {
      "title": "Add Quantified Results",
      "description": "Include specific numbers, percentages, and measurable outcomes",
      "priority": "high"
    }
  ],
  "next_steps": [
    "Add quantified achievements with specific metrics",
    "Research and add industry-specific keywords"
  ]
}
```

## Score Categories

- **90-100**: Excellent - Outstanding ATS compatibility
- **80-89**: Very Good - Minor improvements needed
- **70-79**: Good - Some optimization recommended
- **60-69**: Fair - Significant improvements needed
- **0-59**: Poor - Major optimization required

## Error Handling

### Error Types

1. **FileProcessingError (400)**: Invalid URL, file too large, download failed
2. **TextExtractionError (422)**: Cannot extract text from file
3. **ATSAnalysisError (500)**: Analysis processing error

### Example Error Response
```json
{
  "error": "PDF extraction failed: File appears to be corrupted"
}
```

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run local test
python api/cv-parser/index.py
```

## Deployment

The API is designed for Vercel serverless deployment with the following configuration in `vercel.json`:

```json
{
  "functions": {
    "api/cv-parser/index.py": {
      "runtime": "python3.9",
      "maxDuration": 30
    }
  }
}
```

## Technical Details

### Text Extraction Strategy
1. **PDF**: PyPDF2 for standard PDFs, pdfplumber for complex layouts
2. **DOCX**: python-docx for paragraphs and tables
3. **DOC**: docx2txt for legacy format support

### Industry Detection Algorithm
Uses weighted keyword frequency analysis across predefined industry categories. Falls back to 'general' if no clear industry match.

### Keyword Scoring
- Industry keywords: 2 points per occurrence (max 4 per keyword)
- Action verbs: 1-2 points per occurrence (max 2 per verb)
- Total keyword score capped at 30 points

### Quantified Achievement Patterns
- Percentages: `\b\d+%\b`
- Dollar amounts: `\$\d+[,\d]*(?:\.\d{2})?\b`
- Large numbers: `\b\d+[,\d]*\s*(?:million|thousand|billion|k)\b`
- Performance metrics: Context-aware pattern matching

## Performance Optimizations

- **Lazy Loading**: Text extraction libraries loaded only when needed
- **Efficient Regex**: Compiled patterns for repeated use
- **Memory Management**: Streaming file downloads, cleanup after processing
- **Timeout Handling**: 30-second timeout for file downloads

## Future Enhancements

1. **Machine Learning Integration**: ML-based scoring refinement
2. **Job Description Matching**: Targeted analysis based on job requirements
3. **Multi-language Support**: International resume analysis
4. **Visual Layout Analysis**: Logo, formatting, and design assessment
5. **Real-time ATS Testing**: Integration with actual ATS systems

## Maintenance

### Updating Industry Keywords
Edit the `INDUSTRY_KEYWORDS` dictionary in the main module to add new industries or keywords.

### Adjusting Scoring Weights
Modify component score caps and weights in the respective analysis functions.

### Adding New File Formats
Implement new extraction functions and add to `extract_text_from_file()`.

## Support

For technical issues or questions about the ATS analysis algorithm, refer to the detailed implementation in `index.py` or contact the development team.