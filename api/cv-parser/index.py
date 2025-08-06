"""
Advanced CV Parser API for Comprehensive ATS Analysis
Production-ready implementation with industry-aligned scoring
Hosted on Vercel as serverless function
"""

import json
import os
import requests
import re
import io
from typing import Dict, Any, List, Tuple, Optional
import logging
from collections import Counter
from urllib.parse import urlparse
import math
import uuid
import gc
import sys

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Memory management utilities
def cleanup_memory():
    """Force garbage collection to free memory"""
    try:
        # Force multiple garbage collection passes
        for _ in range(3):
            collected = gc.collect()
            if collected == 0:
                break
        logger.debug(f"🧹 CV parser memory cleanup - collected {collected} objects")
    except Exception as e:
        logger.warning(f"Memory cleanup failed: {e}")

def get_memory_usage():
    """Get current memory usage info if available"""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        memory_mb = round(process.memory_info().rss / 1024 / 1024, 2)
        return memory_mb
    except ImportError:
        return None

def extract_tables_with_pdfplumber(file_content: bytes) -> str:
    """Extract complex tables using pdfplumber when needed"""
    try:
        import pdfplumber
        import io
        
        pdf_file = io.BytesIO(file_content)
        table_texts = []
        
        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                
                if tables:
                    logger.info(f"📊 Page {page_num + 1}: Found {len(tables)} tables")
                    
                    for table_num, table in enumerate(tables):
                        # Convert table to text format
                        table_text = f"\n--- Table {table_num + 1} from Page {page_num + 1} ---\n"
                        
                        for row in table:
                            if row and any(cell for cell in row if cell):
                                # Clean and join cells
                                clean_row = [str(cell).strip() if cell else '' for cell in row]
                                table_text += ' | '.join(clean_row) + '\n'
                        
                        table_texts.append(table_text)
        
        result = '\n'.join(table_texts)
        if result:
            logger.info(f"✅ Table extraction complete: {len(result)} characters")
        
        return result
        
    except ImportError:
        logger.warning("⚠️ pdfplumber not available - skipping table extraction")
        return ""
    except Exception as e:
        logger.warning(f"⚠️ Table extraction failed: {e}")
        return ""

def extract_pdf_text_clean(file_content: bytes) -> str:
    """Clean PDF extraction using only PyMuPDF (table extraction disabled)"""
    if not PYMUPDF_AVAILABLE:
        raise TextExtractionError("PyMuPDF (fitz) is required for PDF extraction")
    
    logger.info("📄 Starting clean PDF extraction with PyMuPDF")
    
    try:
        import fitz
        
        # Check if text is extractable from first page
        pdf_document = fitz.open(stream=file_content, filetype="pdf")
        
        if pdf_document.page_count == 0:
            pdf_document.close()
            raise TextExtractionError("PDF has no pages")
        
        # Check first page for text
        first_page_text = pdf_document[0].get_text().strip()
        if not first_page_text or len(first_page_text) < 50:
            pdf_document.close()
            raise TextExtractionError("Scanned or image-based resumes are not supported. Please upload a text-based PDF.")
        
        # Extract text from all pages using PyMuPDF only
        text_parts = []
        
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text()
            
            if page_text and page_text.strip():
                text_parts.append(page_text)
        
        pdf_document.close()
        
        result = '\n\n'.join(text_parts)
        logger.info(f"✅ PDF extraction complete: {len(result)} characters")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ PDF extraction failed: {e}")
        raise TextExtractionError(f"PDF extraction failed: {str(e)}")

# Legacy function - keeping for compatibility but not used
def extract_with_pypdf2_simple_legacy(file_content: bytes) -> str:
    """Simple PyPDF2 extraction for large files - memory efficient"""
    try:
        pdf_file = io.BytesIO(file_content)
        reader = PyPDF2.PdfReader(pdf_file)
        
        text_parts = []
        max_pages = min(len(reader.pages), 5)  # Limit to 5 pages for memory
        
        for i in range(max_pages):
            try:
                page = reader.pages[i]
                page_text = page.extract_text()
                if page_text and len(page_text.strip()) > 20:
                    text_parts.append(page_text)
                    
                # Clean up page object
                del page
                
                # Force cleanup every 2 pages
                if i % 2 == 0:
                    cleanup_memory()
                    
            except Exception as e:
                logger.warning(f"Error extracting page {i+1}: {e}")
                continue
        
        # Clean up reader and file objects
        del reader
        pdf_file.close()
        cleanup_memory()
        
        result = '\n'.join(text_parts)
        logger.info(f"Simple extraction completed: {len(result)} characters")
        return result
        
    except Exception as e:
        logger.error(f"Simple PDF extraction failed: {e}")
        cleanup_memory()
        raise TextExtractionError(f"Simple PDF extraction failed: {str(e)}")

# Import configuration system
from config.config_loader import (
    get_industry_keywords, get_grammar_patterns, get_spelling_corrections,
    get_achievement_verbs, get_professional_indicators, get_component_weights,
    get_score_categories, get_keywords_for_industry, config_loader
)

# Text extraction libraries - Critical dependency checking
PYPDF2_AVAILABLE = False
DOCX_AVAILABLE = False
PDFPLUMBER_AVAILABLE = False
PYMUPDF_AVAILABLE = False
PDFMINER_AVAILABLE = False

# Check PyPDF2 (basic fallback - always required)
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
    logger.info("✅ PyPDF2 available (basic PDF extraction)")
except ImportError as e:
    logger.error(f"❌ CRITICAL: PyPDF2 not available: {e}")
    PYPDF2_AVAILABLE = False

# Check python-docx (for DOCX files) - Optional for minimal deployment
try:
    import docx
    DOCX_AVAILABLE = True
    logger.info("✅ python-docx available (DOCX extraction)")
except ImportError as e:
    logger.info(f"ℹ️  python-docx not available (minimal deployment): {e}")
    DOCX_AVAILABLE = False

# Check pdfplumber (better PDF extraction)
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
    logger.info("✅ pdfplumber available (enhanced PDF extraction)")
except ImportError as e:
    logger.warning(f"⚠️  pdfplumber not available: {e}")
    PDFPLUMBER_AVAILABLE = False

# Check PyMuPDF/fitz (primary PDF extraction)
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
    logger.info("✅ PyMuPDF available for PDF extraction")
except ImportError as e:
    logger.error(f"❌ CRITICAL: PyMuPDF not available: {e}")
    PYMUPDF_AVAILABLE = False

# Check pdfminer (comprehensive extraction)
try:
    from pdfminer.high_level import extract_text as pdfminer_extract_text
    PDFMINER_AVAILABLE = True
    logger.info("✅ pdfminer.six available (comprehensive PDF extraction)")
except ImportError as e:
    logger.warning(f"⚠️  pdfminer not available: {e}")
    PDFMINER_AVAILABLE = False

# Log dependency summary
def log_dependency_status():
    """Log the status of all PDF extraction dependencies"""
    total_available = sum([PYPDF2_AVAILABLE, PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE])
    
    logger.info("📊 PDF Extraction Dependencies Status:")
    logger.info(f"   PyPDF2: {'✅ Available' if PYPDF2_AVAILABLE else '❌ Missing'}")
    logger.info(f"   pdfplumber: {'✅ Available' if PDFPLUMBER_AVAILABLE else '❌ Missing'}")
    logger.info(f"   PyMuPDF: {'✅ Available' if PYMUPDF_AVAILABLE else '❌ Missing'}")
    logger.info(f"   pdfminer: {'✅ Available' if PDFMINER_AVAILABLE else '❌ Missing'}")
    logger.info(f"   python-docx: {'✅ Available' if DOCX_AVAILABLE else '❌ Missing'}")
    logger.info(f"Total PDF extraction methods available: {total_available}/4")
    
    if total_available == 1 and PYPDF2_AVAILABLE:
        logger.info("✅ PyPDF2 available - optimized for serverless deployment")
    elif total_available >= 3:
        logger.info("✅ Excellent: Multiple PDF extraction methods available for high quality")
    elif total_available >= 2:
        logger.info("✅ Good: Multiple PDF extraction methods available")
    elif total_available == 0:
        logger.error("❌ CRITICAL: No PDF extraction methods available!")
        
    return total_available

# Check dependencies at startup
available_methods = log_dependency_status()

# API configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3002", 
    "https://bestcvbuilder-gnktl1mxh-bestcvbuilder.vercel.app"
]

# Configuration-driven data - loaded from config files
# Industry keywords, action verbs, and other data points are now externalized

# Contact information patterns
CONTACT_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}',
    'linkedin': r'linkedin\.com/in/[\w-]+|linkedin\.com/in/[\w\.-]+|www\.linkedin\.com/in/[\w-]+',
    'website': r'https?://[\w.-]+\.[\w]{2,}',
    'github': r'github\.com/[\w-]+'
}

# Additional patterns for comprehensive data extraction
NAME_PATTERNS = [
    r'^([A-Z][a-z]+ [A-Z][a-z]+)',  # First line name pattern
    r'([A-Z][a-z]+ [A-Z][a-z]+)\s*\n',  # Name followed by newline
    r'Name:\s*([A-Z][a-z]+ [A-Z][a-z]+)',  # Explicit name field
    # Enhanced patterns for merged PDF lines and Unicode
    r'^([A-Z][a-zA-Z\u00C0-\u017F]+ [A-Z][a-zA-Z\u00C0-\u017F]+(?:\s+[A-Z][a-zA-Z\u00C0-\u017F]+)?)',  # Unicode support
    r'([A-Z][a-zA-Z\u00C0-\u017F]{2,}\s+[A-Z][a-zA-Z\u00C0-\u017F]{2,}(?:\s+[A-Z][a-zA-Z\u00C0-\u017F]{2,})?)',  # General name pattern with Unicode
]

ADDRESS_PATTERNS = [
    r'(\d+\s+[A-Za-z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)[\s,]*[A-Za-z\s,]*\d{5}(?:-\d{4})?)',  # US address
    r'Address:\s*(.+?)(?:\n|Email|Phone)',  # Explicit address field
    r'(\d+\s+[A-Za-z\s,]+(?:,\s*[A-Z]{2}\s*\d{5}))',  # City, State ZIP
]

CITY_STATE_PATTERNS = [
    r'([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)',  # City, State ZIP
    r'([A-Za-z\s]+),\s*([A-Za-z\s]+)(?:\s*,\s*[A-Z]{2,3})?',  # City, State/Country
]

SKILLS_PATTERNS = [
    r'(?:SKILLS?|TECHNICAL SKILLS?|TECHNOLOGIES?|COMPETENCIES)[\s:]*\n?(.*?)(?:\n\n|\n[A-Z]{2,}|\Z)',
    r'(?:Programming|Languages?|Tools?|Frameworks?)[\s:]*[:\-]?\s*(.*?)(?:\n|$)',
]

EDUCATION_PATTERNS = [
    r'(?:EDUCATION|ACADEMIC|QUALIFICATIONS?)[\s:]*\n?(.*?)(?:\n\n|\n[A-Z]{2,}|\Z)',
    r'([A-Za-z\s]+(?:University|College|Institute|School).*?)(?:\n(?:[A-Z]{2,}|$))',
    r'((?:Bachelor|Master|PhD|MBA|B\.S\.|M\.S\.|B\.A\.|M\.A\.).*?)(?:\n|$)',
]

EXPERIENCE_PATTERNS = [
    r'(?:EXPERIENCE|EMPLOYMENT|WORK HISTORY|PROFESSIONAL EXPERIENCE)[\s:]*\n?(.*?)(?:\n\n|\n[A-Z]{2,}|\Z)',
    r'([A-Za-z\s]+\|[A-Za-z\s,]+\|\s*\d{4}.*?)(?:\n(?:[A-Z]{2,}|$))',
]

SUMMARY_PATTERNS = [
    r'(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT)[\s:]*\n?(.*?)(?:\n\n|\n[A-Z]{2,}|\Z)',
]

# Quantified achievement patterns
QUANTIFIED_PATTERNS = [
    r'\b\d+%\b',  # Percentages
    r'\$\d+[,\d]*(?:\.\d{2})?\b',  # Dollar amounts
    r'\b\d+[,\d]*\s*(?:million|thousand|billion|k)\b',  # Large numbers
    r'\b\d+\s*(?:years?|months?|weeks?|days?)\b',  # Time periods
    r'\b\d+\s*(?:people|employees|team members|clients|customers|users)\b',  # Team/user sizes
    r'\b\d+[,\d]*\s*(?:projects?|initiatives?|campaigns?|deals?)\b',  # Project counts
    r'\b(?:increased|decreased|improved|reduced|grew|generated)\s+.*?\d+[%\d]*\b'  # Performance metrics
]

class ATSAnalysisError(Exception):
    """Custom exception for ATS analysis errors"""
    pass

class FileProcessingError(ATSAnalysisError):
    """Error during file processing"""
    pass

class TextExtractionError(ATSAnalysisError):
    """Error during text extraction"""
    pass

def cors_headers():
    """Return CORS headers for API responses"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

def validate_file_url(file_url: str) -> bool:
    """Validate file URL format and security"""
    try:
        parsed = urlparse(file_url)
        if not parsed.scheme in ['http', 'https']:
            return False
        if not parsed.netloc:
            return False
        return True
    except:
        return False

def extract_text_from_file(file_content: bytes, file_url: str) -> str:
    """
    Extract text content using ultra-safe methods to prevent worker timeouts
    
    Args:
        file_content: Raw file content
        file_url: Original file URL for determining file type
        
    Returns:
        Extracted text content
    """
    file_extension = file_url.split('.')[-1].lower()
    file_size_mb = len(file_content) / (1024 * 1024)
    
    logger.info(f"🔍 Extracting {file_extension.upper()} file ({file_size_mb:.1f}MB) with timeout protection")
    
    try:
        if file_extension == 'pdf':
            return extract_pdf_text_clean(file_content)
                
        elif file_extension == 'docx':
            return extract_docx_text(file_content)
        elif file_extension == 'doc':
            return extract_doc_text(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    except Exception as e:
        logger.error(f"Text extraction failed: {str(e)}")
        raise TextExtractionError(f"Could not extract text from file: {str(e)}")

def extract_pdf_text(file_content: bytes) -> str:
    """Legacy function - redirects to clean extraction"""
    return extract_pdf_text_clean(file_content)
    
    # Check if any extraction method is available
    if not any([PYPDF2_AVAILABLE, PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE]):
        raise TextExtractionError("CRITICAL: No PDF extraction libraries available")
    
    # Prioritized extraction methods (best first for Render.com)
    extraction_methods = []
    
    # Priority 1: pdfplumber (excellent for structured text, emails, preserves formatting)
    if PDFPLUMBER_AVAILABLE:
        extraction_methods.append(("pdfplumber", extract_with_pdfplumber))
    
    # Priority 2: PyMuPDF (best overall accuracy, speed, and text quality)  
    if PYMUPDF_AVAILABLE:
        extraction_methods.append(("pymupdf", extract_with_pymupdf))
        
    # Priority 3: pdfminer (comprehensive extraction, good for complex layouts)
    if PDFMINER_AVAILABLE:
        extraction_methods.append(("pdfminer", extract_with_pdfminer))
        
    # Priority 4: PyPDF2 (reliable fallback, widely compatible)
    if PYPDF2_AVAILABLE:
        extraction_methods.append(("pypdf2", extract_with_pypdf2))
    
    if not extraction_methods:
        raise TextExtractionError("No PDF extraction methods available")
    
    logger.info(f"🔄 Trying {len(extraction_methods)} PDF extraction methods in priority order")
    
    best_text = ""
    best_score = 0
    best_method = "none"
    
    for method_name, method_func in extraction_methods:
        try:
            logger.info(f"📄 Attempting PDF extraction with {method_name}")
            text = method_func(file_content)
            
            if text and len(text.strip()) >= 50:
                quality_score = score_text_quality(text)
                logger.info(f"📊 {method_name} extraction score: {quality_score}/100")
                
                # Update best result if this is better
                if quality_score > best_score:
                    best_text = text
                    best_score = quality_score
                    
                    # Clean up to save memory
                    cleanup_memory()
                
                # If we get excellent results, stop trying other methods
                if quality_score >= 85:
                    logger.info(f"✅ Excellent quality ({quality_score}) achieved with {method_name}, stopping here")
                    break
                    best_method = method_name
                    logger.info(f"🏆 New best extraction method: {method_name} (score: {quality_score})")
                
                # If we get excellent results with priority methods, use them immediately
                if quality_score >= 90 and method_name in ["pdfplumber", "pymupdf"]:
                    logger.info(f"🎯 Excellent quality achieved with priority method {method_name}")
                    break
                    
                # For less accurate methods, require higher threshold to stop early
                elif quality_score >= 95 and method_name in ["pdfminer", "pypdf2"]:
                    logger.info(f"🎯 Excellent quality achieved with {method_name}")
                    break
                    
            else:
                logger.warning(f"⚠️  {method_name} extracted minimal text")
                    
        except Exception as e:
            logger.warning(f"❌ {method_name} failed: {str(e)}")
            continue
    
    # Ensure we have some text to work with
    if not best_text or len(best_text.strip()) < 50:
        # Last resort: try basic PyPDF2 without scoring
        if PYPDF2_AVAILABLE:
            try:
                logger.warning("🚨 Falling back to basic PyPDF2 extraction (last resort)")
                basic_text = extract_with_pypdf2_basic(file_content)
                if basic_text and len(basic_text.strip()) >= 20:  # Lower threshold for last resort
                    logger.info(f"✅ Basic PyPDF2 extracted {len(basic_text)} characters")
                    return basic_text
            except Exception as e:
                logger.error(f"❌ Basic PyPDF2 extraction also failed: {str(e)}")
        
        raise TextExtractionError("PDF extraction failed - file may be corrupted, image-only, or password protected")
    
    logger.info(f"🎉 Final PDF extraction completed successfully!")
    logger.info(f"📊 Best method score: {best_score}/100")
    logger.info(f"📝 Extracted text length: {len(best_text)} characters")
    return best_text

def extract_with_pypdf2_basic(file_content: bytes) -> str:
    """Basic PyPDF2 extraction without cleaning - last resort fallback"""
    text = ""
    pdf_file = io.BytesIO(file_content)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    
    for page in pdf_reader.pages:
        try:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        except Exception as e:
            logger.warning(f"Failed to extract text from page: {e}")
            continue
    
    return text

def extract_with_pypdf2(file_content: bytes) -> str:
    """Extract text using PyPDF2 with memory management"""
    text = ""
    pdf_file = io.BytesIO(file_content)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    
    page_count = 0
    max_pages = min(len(pdf_reader.pages), 10)  # Limit pages for memory
    
    for page in pdf_reader.pages[:max_pages]:
        try:
            # Try different extraction methods for better quality
            page_text = page.extract_text()
            
            # If standard extraction yields poor results, try alternative method
            if page_text and len(page_text.strip()) < 50:
                # Try extracting with different parameters for better results
                try:
                    page_text = page.extract_text(extraction_mode="layout")
                except:
                    pass  # Fall back to standard extraction
            
            if page_text:
                text += page_text + "\n"
            
            page_count += 1
            
            # Clean up memory every 3 pages
            if page_count % 3 == 0:
                cleanup_memory()
                
        except Exception as e:
            logger.warning(f"Failed to extract text from page: {e}")
            continue
    
    # Clean up reader and file
    del pdf_reader
    pdf_file.close()
    cleanup_memory()
    
    # Enhanced cleaning for PyPDF2 specific issues
    cleaned_text = clean_extracted_text_enhanced(text)
    return cleaned_text

def clean_extracted_text_enhanced(text: str) -> str:
    """
    Enhanced text cleaning specifically for PyPDF2 extraction issues
    """
    if not text:
        return text
    
    # Basic normalization first
    text = clean_extracted_text(text)
    
    # Fix common PyPDF2 email extraction issues
    # Pattern: Single letter prefix before email (e.g., "ebhagat.jatin@gmail.com")
    text = re.sub(r'\b[a-z]([a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', r'\1', text)
    
    # Fix broken email domains (e.g., "gmail. com" -> "gmail.com")
    text = re.sub(r'@([a-zA-Z0-9.-]+)\.\s+([a-zA-Z]{2,})\b', r'@\1.\2', text)
    
    # Fix spaces in email local part (e.g., "user .name@domain.com" -> "user.name@domain.com")
    text = re.sub(r'([a-zA-Z0-9_%+-]+)\s+\.([a-zA-Z0-9_%+-]+)@', r'\1.\2@', text)
    
    # Fix spaces around @ symbol
    text = re.sub(r'([a-zA-Z0-9._%+-]+)\s+@\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', r'\1@\2', text)
    
    return text

def extract_with_pdfplumber(file_content: bytes) -> str:
    """Extract text using pdfplumber (more accurate for complex layouts)"""
    if not PDFPLUMBER_AVAILABLE:
        raise Exception("pdfplumber not available in runtime environment")
    
    try:
        import pdfplumber
        text = ""
        pdf_file = io.BytesIO(file_content)
        
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        return clean_extracted_text(text)
    except Exception as e:
        raise Exception(f"pdfplumber extraction failed: {str(e)}")

def extract_with_pymupdf(file_content: bytes) -> str:
    """Extract text using PyMuPDF/fitz (good for text accuracy)"""
    if not PYMUPDF_AVAILABLE:
        raise Exception("PyMuPDF not available in runtime environment")
    
    try:
        import fitz  # PyMuPDF
        text = ""
        pdf_document = fitz.open("pdf", file_content)
        
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text()
            if page_text:
                text += page_text + "\n"
        
        pdf_document.close()
        return clean_extracted_text(text)
    except Exception as e:
        raise Exception(f"PyMuPDF extraction failed: {str(e)}")

def extract_with_pdfminer(file_content: bytes) -> str:
    """Extract text using pdfminer (most comprehensive but slower)"""
    if not PDFMINER_AVAILABLE:
        raise Exception("pdfminer not available in runtime environment")
    
    try:
        from io import BytesIO
        
        text = pdfminer_extract_text(BytesIO(file_content))
        return clean_extracted_text(text)
    except Exception as e:
        raise Exception(f"pdfminer extraction failed: {str(e)}")

def score_text_quality(text: str) -> float:
    """
    Score the quality of extracted text based on various factors
    Returns a score from 0-100
    """
    if not text or len(text.strip()) < 10:
        return 0
    
    score = 0
    
    # Factor 1: Basic text characteristics (30 points)
    word_count = len(text.split())
    if word_count >= 50:
        score += 15
    elif word_count >= 20:
        score += 10
    elif word_count >= 10:
        score += 5
    
    # Reasonable length (not too short or extremely long)
    if 100 <= word_count <= 2000:
        score += 15
    elif 50 <= word_count < 100 or 2000 < word_count <= 5000:
        score += 10
    elif word_count > 5000:
        score += 5
    
    # Factor 2: Email detection quality (25 points)
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    
    if emails:
        # Check for clean email extraction (no obvious artifacts)
        clean_emails = [email for email in emails if not re.match(r'^[a-z][A-Z]', email)]
        if clean_emails:
            score += 25
        else:
            score += 10  # Found emails but they might have artifacts
    
    # Factor 3: Text structure quality (20 points)
    lines = text.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    
    if len(non_empty_lines) >= 10:
        score += 10
    elif len(non_empty_lines) >= 5:
        score += 5
    
    # Check for reasonable line lengths (not too many very short or very long lines)
    reasonable_lines = [line for line in non_empty_lines if 10 <= len(line.strip()) <= 200]
    if len(reasonable_lines) >= len(non_empty_lines) * 0.7:
        score += 10
    elif len(reasonable_lines) >= len(non_empty_lines) * 0.5:
        score += 5
    
    # Factor 4: Character quality (15 points)
    # Check for reasonable character distribution
    alpha_ratio = sum(1 for c in text if c.isalpha()) / len(text)
    if 0.6 <= alpha_ratio <= 0.9:
        score += 10
    elif 0.4 <= alpha_ratio <= 0.95:
        score += 5
    
    # Check for reasonable punctuation
    punct_ratio = sum(1 for c in text if c in '.,;:!?') / len(text)
    if 0.02 <= punct_ratio <= 0.15:
        score += 5
    
    # Factor 5: Professional content indicators (10 points)
    professional_keywords = [
        'experience', 'education', 'skills', 'work', 'job', 'company',
        'university', 'degree', 'project', 'manager', 'developer', 'engineer'
    ]
    
    found_keywords = sum(1 for keyword in professional_keywords if keyword.lower() in text.lower())
    if found_keywords >= 5:
        score += 10
    elif found_keywords >= 3:
        score += 5
    elif found_keywords >= 1:
        score += 2
    
    return min(score, 100)

def clean_extracted_text(text: str) -> str:
    """
    Basic text cleaning for PDF extraction results
    Focus on simple normalization rather than complex artifact fixing
    """
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove excessive line breaks
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Fix common spacing issues around punctuation
    text = re.sub(r'\s+([,.;:!?])', r'\1', text)
    
    return text.strip()

def extract_docx_text(file_content: bytes) -> str:
    """Extract text from DOCX files"""
    if not DOCX_AVAILABLE:
        raise TextExtractionError("DOCX processing not available - please use PDF format")
    
    try:
        import docx
        doc_file = io.BytesIO(file_content)
        doc = docx.Document(doc_file)
        
        text = ""
        # Extract text from paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text += paragraph.text + "\n"
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    if cell.text.strip():
                        row_text.append(cell.text.strip())
                if row_text:
                    text += " | ".join(row_text) + "\n"
                
        return text
    except Exception as e:
        logger.error(f"DOCX extraction error: {str(e)}")
        raise TextExtractionError(f"DOCX extraction failed: {str(e)}")

def extract_doc_text(file_content: bytes) -> str:
    """Extract text from DOC files using docx2txt"""
    # DOC format not supported with current dependencies
    raise TextExtractionError("DOC files are not supported. Please use PDF or DOCX format.")

def detect_industry(content: str) -> str:
    """Detect the most likely industry based on content keywords"""
    content_lower = content.lower()
    industry_scores = {}
    
    # Load industry keywords from config
    industry_keywords = get_industry_keywords()
    
    for industry, categories in industry_keywords.items():
        score = 0
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in content_lower:
                    score += content_lower.count(keyword)
        industry_scores[industry] = score
    
    if not industry_scores or max(industry_scores.values()) == 0:
        return 'general'
    
    return max(industry_scores, key=industry_scores.get)

def analyze_content_structure(content: str) -> Dict[str, Any]:
    """Analyze resume structure and organization using config data - More stringent scoring"""
    content_lower = content.lower()
    
    # Load essential sections from config
    essential_sections_config = config_loader.get_essential_sections()
    
    # Build essential sections structure with patterns and weights
    essential_sections = {
        'contact': {
            'patterns': ['email', 'phone', 'linkedin', '@', 'contact'],
            'weight': 8,
            'found': False
        },
        'experience': {
            'patterns': essential_sections_config.get('required', [])[:5],  # First 5 experience patterns
            'weight': 10,
            'found': False
        },
        'education': {
            'patterns': essential_sections_config.get('required', [])[5:10],  # Education patterns
            'weight': 6,
            'found': False
        },
        'skills': {
            'patterns': essential_sections_config.get('required', [])[10:],  # Skills patterns
            'weight': 6,
            'found': False
        }
    }
    
    # Fallback to hardcoded patterns if config is empty
    if not essential_sections_config.get('required'):
        essential_sections = {
            'contact': {
                'patterns': ['email', 'phone', 'linkedin', '@', 'contact'],
                'weight': 8,
                'found': False
            },
            'experience': {
                'patterns': ['experience', 'employment', 'work history', 'professional experience', 'career'],
                'weight': 10,
                'found': False
            },
            'education': {
                'patterns': ['education', 'degree', 'university', 'college', 'school', 'academic'],
                'weight': 6,
                'found': False
            },
            'skills': {
                'patterns': ['skills', 'technical skills', 'competencies', 'technologies', 'tools'],
                'weight': 6,
                'found': False
            }
        }
    
    # Check for sections
    total_score = 0
    found_sections = []
    
    for section, data in essential_sections.items():
        for pattern in data['patterns']:
            if pattern in content_lower:
                data['found'] = True
                found_sections.append(section)
                total_score += data['weight']
                break
    
    # Load optional sections from config
    optional_sections_config = config_loader.get_essential_sections()
    optional_sections = optional_sections_config.get('recommended', []) + optional_sections_config.get('optional', [])
    
    # Fallback if config is empty
    if not optional_sections:
        optional_sections = ['summary', 'objective', 'achievements', 'projects', 'certifications', 'awards']
    
    optional_found = []
    
    for section in optional_sections:
        if section in content_lower:
            optional_found.append(section)
            total_score += 2  # Bonus points
    
    # More stringent scoring - must have most sections to get high scores
    section_score = min(total_score * 0.8, 20)  # Reduce by 20% and cap at 20
    
    return {
        'score': max(section_score, 0),  # More realistic scoring
        'essential_sections': found_sections,
        'optional_sections': optional_found,
        'missing_sections': [k for k, v in essential_sections.items() if not v['found']]
    }

def analyze_keyword_optimization(content: str, industry: str = None) -> Dict[str, Any]:
    """Analyze keyword density and relevance - MAX 20 POINTS to match config weights"""
    content_lower = content.lower()
    score = 0
    keyword_analysis = {}
    
    # Load industry keywords from config
    industry_keywords_config = get_industry_keywords()
    
    # Industry-specific keywords
    if industry and industry in industry_keywords_config:
        industry_keywords = industry_keywords_config[industry]
        industry_found = {}
        
        for category, keywords in industry_keywords.items():
            found_keywords = []
            for keyword in keywords:
                count = content_lower.count(keyword)
                if count > 0:
                    found_keywords.append({
                        'keyword': keyword,
                        'count': count,
                        'density': count / len(content.split()) * 1000  # Per 1000 words
                    })
                    # Award points with diminishing returns
                    score += min(count * 2, 4)  # Max 4 points per keyword
            
            if found_keywords:
                industry_found[category] = found_keywords
        
        keyword_analysis['industry_keywords'] = industry_found
    
    # Action verbs analysis using config
    action_verbs_config = get_achievement_verbs()
    action_verb_score = 0
    found_verbs = {}
    
    for category, verbs in action_verbs_config.items():
        category_verbs = []
        for verb in verbs:
            count = content_lower.count(verb)
            if count > 0:
                category_verbs.append({'verb': verb, 'count': count})
                action_verb_score += min(count, 2)  # Max 2 points per verb
        
        if category_verbs:
            found_verbs[category] = category_verbs
    
    score += min(action_verb_score, 15)  # Cap action verbs at 15 points
    keyword_analysis['action_verbs'] = found_verbs
    
    return {
        'score': min(score, 20),  # Cap at 20 points to match config weights
        'analysis': keyword_analysis
    }

def analyze_contact_information(content: str) -> Dict[str, Any]:
    """Analyze contact information completeness and format using config patterns"""
    found_contacts = {}
    score = 0
    
    # Load contact requirements from config
    contact_requirements = config_loader.get_contact_requirements()
    
    # Enhanced phone number extraction with multiple strategies
    phone_patterns = [
        r'\+?\d{1,4}[\s\-\.]?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}',  # International format
        r'\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}',  # US format
        r'\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}',  # Simple format
        r'\+\d{1,3}\s?\(?\d{3}\)?\s?\d{3}[\s\-\.]?\d{4}',  # Mixed international
        r'\d{10,}',  # Raw digits (10+ digits)
    ]
    
    phone_matches = []
    for pattern in phone_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            # Validate phone number has enough digits
            digits = re.sub(r'[^\d]', '', match)
            if len(digits) >= 10:
                phone_matches.append(match)
    
    # Remove duplicates and take the most complete phone number
    if phone_matches:
        # Sort by length to get the most complete number
        phone_matches.sort(key=len, reverse=True)
        found_contacts['phone'] = phone_matches
    
    # Process essential contact types
    for contact_type, contact_data in contact_requirements.get('essential', {}).items():
        if contact_type == 'phone' and 'phone' in found_contacts:
            # Use enhanced phone extraction results
            matches = found_contacts['phone']
        else:
            patterns = contact_data.get('patterns', [])
            weight = contact_data.get('weight', 3)
            
            matches = []
            for pattern in patterns:
                pattern_matches = re.findall(pattern, content, re.IGNORECASE)
                matches.extend(pattern_matches)
            
            found_contacts[contact_type] = matches
        
        if matches:
            weight = contact_data.get('weight', 3)
            score += weight
    
    # Process recommended contact types
    for contact_type, contact_data in contact_requirements.get('recommended', {}).items():
        patterns = contact_data.get('patterns', [])
        weight = contact_data.get('weight', 2)
        
        matches = []
        for pattern in patterns:
            pattern_matches = re.findall(pattern, content, re.IGNORECASE)
            matches.extend(pattern_matches)
        
        found_contacts[contact_type] = matches
        if matches:
            score += weight
    
    # Process optional contact types
    for contact_type, contact_data in contact_requirements.get('optional', {}).items():
        patterns = contact_data.get('patterns', [])
        weight = contact_data.get('weight', 1)
        
        matches = []
        for pattern in patterns:
            pattern_matches = re.findall(pattern, content, re.IGNORECASE)
            matches.extend(pattern_matches)
        
        found_contacts[contact_type] = matches
        if matches:
            score += weight
    
    return {
        'score': min(score, 15),  # Cap at 15 points
        'found_contacts': found_contacts,
        'missing': [k for k, v in found_contacts.items() if not v]
    }

def analyze_formatting_quality(content: str) -> Dict[str, Any]:
    """Analyze formatting and ATS readability - More stringent scoring"""
    score = 15  # Start with lower baseline, deduct for issues
    issues = []
    
    # Check for formatting issues that hurt ATS parsing
    formatting_checks = {
        'excessive_whitespace': (r'\s{4,}', 'Excessive whitespace detected'),
        'special_characters': (r'[^\w\s\-\.,@():/]', 'Unusual special characters found'),
        'inconsistent_spacing': (r'\n\s*\n\s*\n', 'Inconsistent paragraph spacing'),
        'tab_characters': (r'\t', 'Tab characters detected (use spaces instead)'),
        'mixed_date_formats': (r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}.*\d{4}[/-]\d{1,2}[/-]\d{1,2}', 'Mixed date formats')
    }
    
    for check_name, (pattern, message) in formatting_checks.items():
        matches = re.findall(pattern, content)
        if matches:
            count = len(matches)
            deduction = min(count, 5)  # Max 5 points deduction per issue type
            score -= deduction
            issues.append(f"{message} ({count} instances)")
    
    # Check for proper bullet points
    bullet_patterns = ['•', '◦', '▪', '-', '*']
    has_bullets = any(bullet in content for bullet in bullet_patterns)
    if not has_bullets:
        score -= 3
        issues.append("No bullet points detected - consider using bullets for lists")
    
    return {
        'score': max(score, 0),  # Don't go below 0
        'issues': issues
    }

def analyze_quantified_achievements(content: str) -> Dict[str, Any]:
    """Look for quantified achievements with numbers and percentages using config patterns"""
    quantified_achievements = []
    
    # Load quantification patterns from config
    quantification_patterns = config_loader.get_quantification_patterns()
    
    # Combine all pattern types
    all_patterns = []
    for pattern_type, patterns in quantification_patterns.items():
        all_patterns.extend(patterns)
    
    # Fallback to hardcoded patterns if config is empty
    if not all_patterns:
        all_patterns = [
            r'\b\d+%\b',  # Percentages
            r'\$\d+[,\d]*(?:\.\d{2})?\b',  # Dollar amounts
            r'\b\d+[,\d]*\s*(?:million|thousand|billion|k)\b',  # Large numbers
            r'\b\d+\s*(?:years?|months?|weeks?|days?)\b',  # Time periods
            r'\b\d+\s*(?:people|employees|team members|clients|customers|users)\b',  # Team/user sizes
            r'\b\d+[,\d]*\s*(?:projects?|initiatives?|campaigns?|deals?)\b',  # Project counts
            r'\b(?:increased|decreased|improved|reduced|grew|generated)\s+.*?\d+[%\d]*\b'  # Performance metrics
        ]
    
    for pattern in all_patterns:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            # Get surrounding context (20 chars before and after)
            start = max(0, match.start() - 20)
            end = min(len(content), match.end() + 20)
            context = content[start:end].replace('\n', ' ').strip()
            
            quantified_achievements.append({
                'match': match.group(),
                'context': context
            })
    
    # Remove duplicates based on context similarity
    unique_achievements = []
    for achievement in quantified_achievements:
        if not any(achievement['context'] in existing['context'] or 
                  existing['context'] in achievement['context'] 
                  for existing in unique_achievements):
            unique_achievements.append(achievement)
    
    score = min(len(unique_achievements) * 2, 10)  # 2 points per achievement, max 10
    
    return {
        'score': score,
        'count': len(unique_achievements),
        'achievements': unique_achievements[:5]  # First 5 examples
    }

def check_grammar_issues(content: str) -> List[Dict[str, str]]:
    """
    Check for common grammar issues in resume content using config patterns
    """
    grammar_issues = []
    
    # Load grammar patterns from config
    grammar_patterns = get_grammar_patterns()
    
    for pattern_data in grammar_patterns:
        pattern = pattern_data['pattern']
        message = pattern_data['message']
        
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            grammar_issues.append({
                'type': 'grammar',
                'issue': message,
                'position': match.start(),
                'text': match.group(),
                'category': pattern_data.get('category', 'general'),
                'severity': pattern_data.get('severity', 'medium')
            })
            # Limit to avoid overwhelming the user
            if len(grammar_issues) >= 6:
                break
        if len(grammar_issues) >= 6:
            break
    
    return grammar_issues

def check_spelling_issues(content: str) -> List[Dict[str, str]]:
    """
    Check for common spelling issues in resume content using config corrections
    """
    spelling_issues = []
    
    # Load spelling corrections from config
    spelling_corrections = get_spelling_corrections()
    
    # Check for each misspelling
    words = re.findall(r'\b\w+\b', content.lower())
    for word in words:
        if word in spelling_corrections:
            spelling_issues.append({
                'type': 'spelling',
                'incorrect': word,
                'correct': spelling_corrections[word],
                'issue': f'Misspelled "{word}" should be "{spelling_corrections[word]}"'
            })
            # Limit to avoid overwhelming the user
            if len(spelling_issues) >= 6:
                break
    
    return spelling_issues

def analyze_readability_and_length(content: str) -> Dict[str, Any]:
    """
    Analyze content readability, optimal length, grammar, and spelling using config thresholds - MAX 10 POINTS to match config weights
    """
    word_count = len(content.split())
    char_count = len(content)
    sentence_count = len(re.findall(r'[.!?]+', content))
    
    # Grammar and spelling analysis
    grammar_issues = check_grammar_issues(content)
    spelling_issues = check_spelling_issues(content)
    
    # Load readability metrics from config
    readability_metrics = config_loader.get_readability_metrics()
    
    # Optimal word count scoring using config thresholds
    optimal_word_count = readability_metrics.get('optimal_word_count', {
        'min': 300, 'max': 800, 'ideal_min': 400, 'ideal_max': 600
    })
    
    length_score = 0
    length_feedback = ""
    
    if optimal_word_count['ideal_min'] <= word_count <= optimal_word_count['ideal_max']:
        length_score = 5
        length_feedback = "Optimal resume length"
    elif optimal_word_count['min'] <= word_count < optimal_word_count['ideal_min'] or optimal_word_count['ideal_max'] < word_count <= optimal_word_count['max']:
        length_score = 4
        length_feedback = "Good resume length"
    elif word_count < optimal_word_count['min']:
        length_score = 1
        length_feedback = "Resume too short - add more detail"
    else:
        length_score = 2
        length_feedback = "Resume too long - consider condensing"
    
    # Calculate average sentence length
    avg_sentence_length = word_count / max(sentence_count, 1)
    
    # Readability scoring using config
    optimal_sentence_length = readability_metrics.get('optimal_sentence_length', {
        'min': 10, 'max': 20, 'ideal': 15
    })
    
    readability_score = 0
    if optimal_sentence_length['min'] <= avg_sentence_length <= optimal_sentence_length['max']:
        readability_score = 3
    elif avg_sentence_length < optimal_sentence_length['min'] or avg_sentence_length > optimal_sentence_length['max']:
        readability_score = 2
    else:
        readability_score = 1
    
    # Enhanced grammar scoring with severity-based penalties
    grammar_score = 4  # Start with max points
    punctuation_penalty = 0
    date_formatting_penalty = 0
    
    # Calculate penalties based on issue severity and category
    for issue in grammar_issues:
        severity = issue.get('severity', 'medium')
        category = issue.get('category', 'general')
        
        if category == 'punctuation':
            if severity == 'high':
                punctuation_penalty += 1.0
            elif severity == 'medium':
                punctuation_penalty += 0.5
            else:
                punctuation_penalty += 0.25
        elif category == 'date_formatting':
            if severity == 'high':
                date_formatting_penalty += 1.0
            elif severity == 'medium':
                date_formatting_penalty += 0.5
            else:
                date_formatting_penalty += 0.25
        else:
            # General grammar issues
            if severity == 'high':
                grammar_score -= 1.0
            elif severity == 'medium':
                grammar_score -= 0.5
            else:
                grammar_score -= 0.25
    
    # Apply specific penalties
    grammar_score -= min(punctuation_penalty, 2.0)  # Max 2 point penalty for punctuation
    grammar_score -= min(date_formatting_penalty, 2.0)  # Max 2 point penalty for date formatting
    grammar_score = max(grammar_score, 0)  # Don't go below 0
    
    # Spelling scoring (3 points max) 
    spelling_score = 0
    if len(spelling_issues) == 0:
        spelling_score = 3
    elif len(spelling_issues) <= 2:
        spelling_score = 2
    else:
        spelling_score = 1
    
    # Scale total score to match config weight of 10 points (not 15)
    total_score = length_score + readability_score + grammar_score + spelling_score
    scaled_score = min(total_score * (10.0 / 15.0), 10)  # Scale from 15-point range to 10-point range
    
    return {
        'score': round(scaled_score, 1),  # Max 10 points to match config weights
        'word_count': word_count,
        'character_count': char_count,
        'sentence_count': sentence_count,
        'avg_sentence_length': round(avg_sentence_length, 1),
        'feedback': length_feedback,
        'grammar_errors': len(grammar_issues),
        'spelling_errors': len(spelling_issues),
        'grammar_issues': [issue['issue'] for issue in grammar_issues[:3]],  # Top 3
        'spelling_issues': [issue['issue'] for issue in spelling_issues[:3]], # Top 3
        'punctuation_penalty': round(punctuation_penalty, 2),
        'date_formatting_penalty': round(date_formatting_penalty, 2),
        'readability_level': 'Excellent' if scaled_score >= 8.5 else 'Good' if scaled_score >= 6.5 else 'Needs Improvement'
    }

def calculate_comprehensive_ats_score(content: str, job_posting: str = None, knockout_questions: List[Dict] = None) -> Dict[str, Any]:
    """Calculate comprehensive ATS compatibility score with penalty system"""
    
    # Detect industry for targeted analysis
    industry = detect_industry(content)
    
    # Initialize scoring components
    components = {}
    
    # Apply configured component weights (total: 100 points)
    # 1. Content Structure Analysis (25 points)
    components['structure'] = analyze_content_structure(content)
    
    # 2. Keyword Optimization (20 points) - CORRECTED from 30
    components['keywords'] = analyze_keyword_optimization(content, industry)
    
    # 3. Contact Information (15 points)
    components['contact'] = analyze_contact_information(content)
    
    # 4. Formatting Quality (20 points)
    components['formatting'] = analyze_formatting_quality(content)
    
    # 5. Quantified Achievements (10 points)
    components['achievements'] = analyze_quantified_achievements(content)
    
    # 6. Readability and Length (10 points) - CORRECTED from 15
    components['readability'] = analyze_readability_and_length(content)
    
    # Calculate base score from components
    base_score = sum(comp['score'] for comp in components.values())
    base_score = min(base_score, 100)  # Cap at 100
    
    # Apply comprehensive penalty system
    try:
        from penalty_system import apply_comprehensive_penalties
        penalty_result = apply_comprehensive_penalties(base_score, content, job_posting, knockout_questions)
        final_score = penalty_result['final_score']
        penalty_breakdown = penalty_result['penalty_breakdown']
        total_penalty = penalty_result['total_penalty']
    except ImportError as e:
        logger.warning(f"Penalty system not available: {e}")
        final_score = base_score
        penalty_breakdown = {}
        total_penalty = 0
    
    # Load score categories from config
    score_categories = get_score_categories()
    
    # Determine score category
    category = 'poor'
    description = 'Poor ATS compatibility - major optimization required'
    
    for cat_name, cat_data in score_categories.items():
        if cat_data['min_score'] <= final_score <= cat_data['max_score']:
            category = cat_name
            description = cat_data['description']
            break
    
    return {
        'ats_score': final_score,
        'base_score': base_score,
        'total_penalty': total_penalty,
        'penalty_breakdown': penalty_breakdown,
        'category': category,
        'description': description,
        'industry': industry,
        'component_scores': {k: v['score'] for k, v in components.items()},
        'detailed_analysis': components
    }

def calculate_interview_rates(ats_score: int) -> Dict[str, Any]:
    """
    Calculate realistic interview rates based on ATS score using config data
    
    Args:
        ats_score: ATS compatibility score (0-100)
        
    Returns:
        Dictionary with current and potential interview rates
    """
    # Load score categories and interview rate mapping from config
    score_categories = get_score_categories()
    interview_rate_mapping = config_loader.get_interview_rate_mapping()
    
    current_rate = 1
    performance_tier = "Poor"
    
    # Find the matching score category
    for cat_name, cat_data in score_categories.items():
        if cat_data['min_score'] <= ats_score <= cat_data['max_score']:
            current_rate = cat_data.get('interview_rate', 1)
            performance_tier = cat_data.get('label', 'Poor')
            break
    
    # Calculate potential rate with improvements (realistic maximum)
    potential_rate = min(18, current_rate + (90 - ats_score) * 0.15)
    multiplier = potential_rate / current_rate if current_rate > 0 else 5
    
    return {
        "current_rate": current_rate,
        "potential_rate": round(potential_rate),
        "multiplier": round(multiplier, 1),
        "performance_tier": performance_tier,
        "percentile": get_score_percentile(ats_score)
    }

def get_score_percentile(ats_score: int) -> int:
    """Get percentile ranking based on ATS score"""
    if ats_score >= 90: return 95
    if ats_score >= 80: return 80
    if ats_score >= 70: return 60
    if ats_score >= 60: return 40
    if ats_score >= 50: return 25
    return 10

def get_letter_grade(ats_score: int) -> str:
    """Convert ATS score to letter grade using config data"""
    score_categories = get_score_categories()
    
    for cat_name, cat_data in score_categories.items():
        if cat_data['min_score'] <= ats_score <= cat_data['max_score']:
            return cat_data.get('letter_grade', 'F')
    
    return "F"

def classify_issues_by_priority(analysis_data: Dict[str, Any]) -> Tuple[List[Dict], List[Dict]]:
    """
    Classify CV issues by priority and impact
    
    Args:
        analysis_data: Complete analysis data including component scores
        
    Returns:
        Tuple of (critical_issues, quick_wins)
    """
    critical_issues = []
    quick_wins = []
    
    components = analysis_data.get('detailed_analysis', {})
    component_scores = analysis_data.get('component_scores', {})
    personal_info = analysis_data.get('personal_information', {})
    
    # CRITICAL ISSUES (blocks interviews)
    
    # Missing essential contact information
    if component_scores.get('contact', 0) < 10:
        missing_contact = []
        if not personal_info.get('email'):
            missing_contact.append('professional email')
        if not personal_info.get('phone'):
            missing_contact.append('phone number')
        
        if missing_contact:
            critical_issues.append({
                'title': 'Missing Essential Contact Information',
                'issue': f"Missing: {', '.join(missing_contact)}",
                'solution': 'Add complete contact details in a clear header section',
                'time_to_fix': '2 minutes',
                'points_gain': 8,
                'impact': 'High',
                'component': 'Contact Information',
                'why_critical': 'Recruiters cannot contact you without proper contact details'
            })
    
    # Missing professional summary
    if not personal_info.get('professional_summary'):
        critical_issues.append({
            'title': 'No Professional Summary',
            'issue': 'Missing career summary or objective statement',
            'solution': 'Add a 2-3 sentence summary highlighting your key qualifications and career goals',
            'time_to_fix': '10 minutes',
            'points_gain': 12,
            'impact': 'High',
            'component': 'Professional Summary',
            'why_critical': 'ATS systems and recruiters look for summary sections to quickly understand your profile'
        })
    
    # Poor keyword optimization
    if component_scores.get('keywords', 0) < 8:
        critical_issues.append({
            'title': 'Poor Keyword Optimization',
            'issue': 'Missing industry-specific keywords that ATS systems scan for',
            'solution': 'Research job postings in your field and include relevant keywords naturally',
            'time_to_fix': '15 minutes',
            'points_gain': 10,
            'impact': 'High',
            'component': 'Keywords & Skills',
            'why_critical': 'ATS systems filter resumes based on keyword matches'
        })
    
    # Poor formatting affecting ATS readability
    if component_scores.get('formatting', 0) < 12:
        critical_issues.append({
            'title': 'ATS-Incompatible Formatting',
            'issue': 'Formatting issues that prevent ATS systems from reading your resume',
            'solution': 'Use standard section headers, consistent fonts, and avoid complex layouts',
            'time_to_fix': '20 minutes',
            'points_gain': 8,
            'impact': 'High',
            'component': 'Formatting',
            'why_critical': 'Poor formatting can make your resume invisible to ATS systems'
        })
    
    # QUICK WINS (easy improvements with good impact)
    
    # LinkedIn profile missing
    if not personal_info.get('linkedin_url'):
        quick_wins.append({
            'title': 'Add LinkedIn Profile URL',
            'issue': 'LinkedIn profile not included in contact section',
            'solution': 'Add your LinkedIn profile URL to show professional online presence',
            'time_to_fix': '1 minute',
            'points_gain': 3,
            'impact': 'Medium',
            'component': 'Contact Information'
        })
    
    # Phone number formatting
    phone = personal_info.get('phone', '')
    if phone and (len(phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) < 10):
        quick_wins.append({
            'title': 'Fix Phone Number Format',
            'issue': 'Phone number format may not be ATS-friendly',
            'solution': 'Use standard format: +1 (555) 123-4567 or +1-555-123-4567',
            'time_to_fix': '1 minute',
            'points_gain': 2,
            'impact': 'Low',
            'component': 'Contact Information'
        })
    
    # Missing skills section
    skills = personal_info.get('skills', [])
    if not skills or len(skills) < 5:
        quick_wins.append({
            'title': 'Expand Skills Section',
            'issue': 'Limited or missing technical skills listed',
            'solution': 'Add 8-12 relevant skills including both technical and soft skills',
            'time_to_fix': '5 minutes',
            'points_gain': 5,
            'impact': 'Medium',
            'component': 'Skills'
        })
    
    # Missing years of experience
    if not personal_info.get('years_of_experience'):
        quick_wins.append({
            'title': 'Add Experience Level',
            'issue': 'Years of experience not clearly indicated',
            'solution': 'Include your total years of relevant experience in summary or skills section',
            'time_to_fix': '2 minutes',
            'points_gain': 3,
            'impact': 'Medium',
            'component': 'Experience'
        })
    
    # Poor structure score
    if component_scores.get('structure', 0) < 15:
        structure_data = components.get('structure', {})
        missing_sections = structure_data.get('missing_sections', [])
        
        if missing_sections:
            quick_wins.append({
                'title': 'Add Missing Resume Sections',
                'issue': f"Missing sections: {', '.join(missing_sections)}",
                'solution': 'Add standard resume sections to improve ATS compatibility',
                'time_to_fix': '10 minutes',
                'points_gain': 6,
                'impact': 'Medium',
                'component': 'Structure'
            })
    
    return critical_issues, quick_wins

def generate_transformation_preview(analysis_data: Dict[str, Any], critical_issues: List[Dict], quick_wins: List[Dict]) -> Dict[str, Any]:
    """
    Generate before/after transformation preview
    
    Args:
        analysis_data: Current analysis data
        critical_issues: List of critical issues
        quick_wins: List of quick wins
        
    Returns:
        Dictionary with transformation metrics
    """
    current_score = analysis_data.get('ats_score', 0)
    current_rates = calculate_interview_rates(current_score)
    
    # Calculate potential improvement
    total_points_gain = sum(issue.get('points_gain', 0) for issue in critical_issues + quick_wins)
    potential_score = min(100, current_score + total_points_gain)
    potential_rates = calculate_interview_rates(potential_score)
    
    return {
        'current_score': current_score,
        'potential_score': potential_score,
        'score_improvement': potential_score - current_score,
        'current_grade': get_letter_grade(current_score),
        'potential_grade': get_letter_grade(potential_score),
        'current_interview_rate': current_rates['current_rate'],
        'potential_interview_rate': potential_rates['current_rate'],
        'interview_improvement': f"{potential_rates['current_rate'] - current_rates['current_rate']}x more",
        'total_fixes': len(critical_issues) + len(quick_wins),
        'quick_fixes': len(quick_wins),
        'time_investment': calculate_total_time(critical_issues + quick_wins)
    }

def calculate_total_time(issues: List[Dict]) -> str:
    """Calculate total time needed for all improvements"""
    total_minutes = 0
    
    for issue in issues:
        time_str = issue.get('time_to_fix', '0 minutes')
        # Extract number from time string
        import re
        numbers = re.findall(r'\d+', time_str)
        if numbers:
            total_minutes += int(numbers[0])
    
    if total_minutes < 60:
        return f"{total_minutes} minutes"
    else:
        hours = total_minutes // 60
        remaining_minutes = total_minutes % 60
        if remaining_minutes == 0:
            return f"{hours} hour{'s' if hours > 1 else ''}"
        else:
            return f"{hours}h {remaining_minutes}m"

def enhance_component_breakdown(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhance component analysis with specific issues and solutions
    
    Args:
        analysis_data: Current analysis data
        
    Returns:
        Enhanced component breakdown with specific recommendations
    """
    components = analysis_data.get('detailed_analysis', {})
    component_scores = analysis_data.get('component_scores', {})
    enhanced_components = {}
    
    # Load component weights from config
    max_scores = get_component_weights()
    
    for component, max_score in max_scores.items():
        current_score = component_scores.get(component, 0)
        percentage = round((current_score / max_score) * 100)
        
        # Determine status and specific issues
        if percentage >= 80:
            status = 'excellent'
            status_text = 'Excellent'
            color = 'green'
        elif percentage >= 60:
            status = 'good'
            status_text = 'Good'
            color = 'blue'
        elif percentage >= 40:
            status = 'fair'
            status_text = 'Needs Improvement'
            color = 'yellow'
        else:
            status = 'poor'
            status_text = 'Critical Issue'
            color = 'red'
        
        # Get component-specific data
        component_data = components.get(component, {})
        
        enhanced_components[component] = {
            'name': format_component_name(component),
            'score': current_score,
            'max_score': max_score,
            'percentage': percentage,
            'status': status,
            'status_text': status_text,
            'color': color,
            'specific_issues': get_component_specific_issues(component, component_data, current_score, max_score),
            'recommendations': get_component_recommendations(component, component_data, current_score)
        }
    
    return enhanced_components

def get_component_specific_issues(component: str, data: Dict, current_score: int, max_score: int) -> List[str]:
    """Get specific issues for each component"""
    issues = []
    
    if component == 'structure':
        missing_sections = data.get('missing_sections', [])
        if missing_sections:
            issues.append(f"Missing sections: {', '.join(missing_sections)}")
        if current_score < max_score * 0.6:
            issues.append("Poor overall resume structure and organization")
    
    elif component == 'keywords':
        missing_keywords = data.get('missing_keywords', [])
        if missing_keywords:
            issues.append(f"Missing key industry terms: {', '.join(missing_keywords[:3])}")
        if current_score < max_score * 0.4:
            issues.append("Severely lacking relevant keywords for ATS optimization")
    
    elif component == 'contact':
        if current_score < max_score * 0.7:
            issues.append("Incomplete or improperly formatted contact information")
        if current_score < max_score * 0.4:
            issues.append("Missing essential contact details (phone, email, or location)")
    
    elif component == 'formatting':
        if current_score < max_score * 0.6:
            issues.append("ATS-incompatible formatting detected")
            issues.append("Inconsistent font usage or spacing")
    
    elif component == 'achievements':
        achievements_count = data.get('achievements_count', 0)
        if achievements_count < 3:
            issues.append("Insufficient quantified achievements and results")
        if current_score < max_score * 0.5:
            issues.append("Missing measurable impact statements")
    
    elif component == 'readability':
        if current_score < max_score * 0.5:
            issues.append("Poor readability and unclear language")
            issues.append("Complex sentences that may confuse ATS systems")
    
    return issues

def get_component_recommendations(component: str, data: Dict, current_score: int) -> List[str]:
    """Get specific recommendations for each component"""
    recommendations = []
    
    if component == 'structure':
        recommendations.append("Use standard section headers: Summary, Experience, Education, Skills")
        recommendations.append("Organize content in reverse chronological order")
    
    elif component == 'keywords':
        recommendations.append("Research job descriptions in your field for relevant keywords")
        recommendations.append("Include both technical skills and industry buzzwords")
        recommendations.append("Use keywords naturally throughout your resume")
    
    elif component == 'contact':
        recommendations.append("Include: Full name, phone, professional email, LinkedIn, location")
        recommendations.append("Use consistent formatting for all contact information")
    
    elif component == 'formatting':
        recommendations.append("Use standard fonts (Arial, Calibri, or Times New Roman)")
        recommendations.append("Maintain consistent spacing and bullet point styles")
        recommendations.append("Avoid tables, images, or complex layouts")
    
    elif component == 'achievements':
        recommendations.append("Quantify accomplishments with numbers, percentages, or dollar amounts")
        recommendations.append("Use action verbs to start each bullet point")
        recommendations.append("Focus on results and impact, not just job duties")
    
    elif component == 'readability':
        recommendations.append("Use clear, concise language and shorter sentences")
        recommendations.append("Avoid jargon that ATS systems might not recognize")
        recommendations.append("Ensure proper grammar and spelling")
    
    return recommendations

def format_component_name(component: str) -> str:
    """Format component names for display"""
    names = {
        'structure': 'Resume Structure',
        'keywords': 'Keywords & Skills',
        'contact': 'Contact Information',
        'formatting': 'Formatting & Layout',
        'achievements': 'Achievements & Impact',
        'readability': 'Readability & Clarity'
    }
    return names.get(component, component.title())

def generate_comprehensive_recommendations(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Generate detailed recommendations based on analysis"""
    
    strengths = []
    improvements = []
    critical_issues = []
    suggestions = []
    
    score = analysis['ats_score']
    components = analysis['detailed_analysis']
    
    # Analyze each component for recommendations
    
    # Structure analysis
    structure = components['structure']
    if structure['score'] >= 20:
        strengths.append("Well-organized resume structure with essential sections")
    else:
        missing = structure['missing_sections']
        if missing:
            critical_issues.append(f"Missing essential sections: {', '.join(missing)}")
            improvements.append("Add missing essential resume sections")
    
    # Keywords analysis
    keywords = components['keywords']
    if keywords['score'] >= 20:
        strengths.append("Good use of relevant keywords and action verbs")
    else:
        improvements.append("Increase industry-specific keywords and strong action verbs")
        suggestions.append({
            'title': 'Optimize Keywords',
            'description': 'Add more industry-relevant keywords and quantifiable achievements',
            'priority': 'high'
        })
    
    # Contact information
    contact = components['contact']
    if contact['score'] >= 10:
        strengths.append("Complete contact information provided")
    else:
        missing_contacts = contact['missing']
        if 'email' in missing_contacts or 'phone' in missing_contacts:
            critical_issues.append("Missing essential contact information (email/phone)")
        if 'linkedin' in missing_contacts:
            improvements.append("Add LinkedIn profile for professional networking")
    
    # Formatting quality
    formatting = components['formatting']
    if formatting['score'] >= 15:
        strengths.append("Clean, ATS-friendly formatting")
    else:
        if formatting['issues']:
            improvements.append("Fix formatting issues that may confuse ATS systems")
            suggestions.append({
                'title': 'Improve Formatting',
                'description': 'Clean up formatting issues for better ATS readability',
                'priority': 'medium'
            })
    
    # Quantified achievements
    achievements = components['achievements']
    if achievements['score'] >= 6:
        strengths.append("Good use of quantified achievements and metrics")
    else:
        improvements.append("Add more quantified achievements with specific numbers and percentages")
        suggestions.append({
            'title': 'Add Quantified Results',
            'description': 'Include specific numbers, percentages, and measurable outcomes',
            'priority': 'high'
        })
    
    # Overall score-based recommendations
    if score < 70:
        suggestions.append({
            'title': 'Comprehensive Resume Optimization',
            'description': 'Consider professional resume review for significant improvements',
            'priority': 'high'
        })
    
    return {
        'strengths': strengths,
        'improvements': improvements,
        'critical_issues': critical_issues,
        'suggestions': suggestions,
        'next_steps': generate_next_steps(score, components)
    }

def generate_next_steps(score: int, components: Dict[str, Any]) -> List[str]:
    """Generate prioritized next steps for improvement"""
    next_steps = []
    
    # Prioritize based on component scores
    low_scoring_components = [(k, v['score']) for k, v in components.items() if v['score'] < 10]
    low_scoring_components.sort(key=lambda x: x[1])  # Sort by score, lowest first
    
    for component, component_score in low_scoring_components[:3]:  # Top 3 priorities
        if component == 'structure':
            next_steps.append("1. Add missing resume sections (Experience, Education, Skills)")
        elif component == 'keywords':
            next_steps.append("2. Research and add industry-specific keywords")
        elif component == 'contact':
            next_steps.append("3. Complete your contact information including LinkedIn")
        elif component == 'formatting':
            next_steps.append("4. Clean up formatting and use consistent spacing")
        elif component == 'achievements':
            next_steps.append("5. Add quantified achievements with specific metrics")
    
    if score >= 80:
        next_steps.append("Focus on fine-tuning keyword optimization and formatting")
    elif score >= 60:
        next_steps.append("Prioritize adding quantified achievements and industry keywords")
    else:
        next_steps.append("Start with essential sections and contact information")
    
    return next_steps[:5]  # Limit to 5 steps

def extract_personal_information(content: str) -> Dict[str, Any]:
    """
    Extract personal information from CV content for user profile
    
    Args:
        content: CV text content
        
    Returns:
        Dictionary containing extracted personal information
    """
    extracted_data = {
        'full_name': None,
        'email': None,
        'phone': None,
        'address': None,
        'city': None,
        'state': None,
        'linkedin_url': None,
        'github_url': None,
        'website_url': None,
        'professional_summary': None,
        'skills': [],
        'education': [],
        'work_experience': [],
        'years_of_experience': None
    }
    
    # Extract name
    extracted_data['full_name'] = extract_name(content)
    
    # Extract contact information
    contact_info = analyze_contact_information(content)
    found_contacts = contact_info.get('found_contacts', {})
    
    if found_contacts.get('email'):
        extracted_data['email'] = found_contacts['email'][0]
    if found_contacts.get('phone'):
        # Clean and validate phone number
        phone_raw = found_contacts['phone'][0]
        phone_cleaned = re.sub(r'[^\d+\-\(\)\s]', '', phone_raw)
        # Ensure we have a complete phone number
        digits_only = re.sub(r'[^\d]', '', phone_cleaned)
        if len(digits_only) >= 10:  # Minimum for a valid phone number
            extracted_data['phone'] = phone_cleaned
        else:
            logger.warning(f"Phone number too short: {phone_raw} -> {digits_only} ({len(digits_only)} digits)")
            extracted_data['phone'] = phone_raw  # Store original for debugging
    if found_contacts.get('linkedin'):
        extracted_data['linkedin_url'] = 'https://' + found_contacts['linkedin'][0]
    if found_contacts.get('github'):
        extracted_data['github_url'] = 'https://' + found_contacts['github'][0]
    if found_contacts.get('website'):
        extracted_data['website_url'] = found_contacts['website'][0]
    
    # Extract address information
    address_data = extract_address(content)
    extracted_data.update(address_data)
    
    # Extract professional summary
    extracted_data['professional_summary'] = extract_summary(content)
    
    # Extract skills
    extracted_data['skills'] = extract_skills_list(content)
    
    # Extract education
    extracted_data['education'] = extract_education_list(content)
    
    # Extract work experience
    extracted_data['work_experience'] = extract_work_experience_list(content)
    
    # Estimate years of experience
    extracted_data['years_of_experience'] = estimate_years_of_experience(content)
    
    return extracted_data

def extract_name(content: str) -> Optional[str]:
    """Extract full name from CV content with enhanced Unicode and merged line support"""
    import unicodedata
    
    # Normalize Unicode characters to handle different encodings
    normalized_content = unicodedata.normalize('NFKD', content)
    lines = normalized_content.split('\n')
    logger.info(f"🔍 Name extraction - checking first lines (showing first 100 chars each):")
    
    # Try first non-empty line first
    for i, line in enumerate(lines[:10]):  # Check first 10 lines
        line = line.strip()
        line_preview = line[:100] + "..." if len(line) > 100 else line
        logger.info(f"  Line {i}: '{line_preview}'")
        
        # If line is too long (merged PDF), try to extract name from beginning
        if len(line) > 100:
            # Enhanced regex for merged PDF lines with Unicode support
            import re
            # Try multiple patterns for merged lines
            merged_patterns = [
                r'^([A-Z][a-zA-Z\u00C0-\u017F]+\s+[A-Z][a-zA-Z\u00C0-\u017F]+(?:\s+[A-Z][a-zA-Z\u00C0-\u017F]+)?)',  # Unicode names
                r'^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:[\s\|\-•])',  # Name followed by separator
                r'^([A-Z][a-z]+\s[A-Z][a-z]+)(?:\s*[A-Z][a-z]+@)',  # Name before email
                r'^([A-Z][a-z]+\s[A-Z][a-z]+)(?:\s*\+?\d)',  # Name before phone
            ]
            
            for pattern in merged_patterns:
                name_match = re.match(pattern, line)
                if name_match:
                    potential_name = name_match.group(1).strip()
                    # Validate name length and content
                    if 4 <= len(potential_name) <= 40 and potential_name.count(' ') >= 1:
                        logger.info(f"✅ Found name at start of long line: '{potential_name}'")
                        return potential_name
        
        if line and len(line.split()) >= 2:
            # More flexible name detection with Unicode support
            words = line.split()
            if len(words) >= 2 and len(words) <= 4:  # Names are typically 2-4 words
                # Enhanced check for title case including Unicode characters
                def is_title_case_unicode(word):
                    if not word:
                        return False
                    first_char = word[0]
                    # Check if first character is uppercase (including Unicode)
                    return first_char.isupper() or unicodedata.category(first_char) == 'Lu'
                
                if all(is_title_case_unicode(word) for word in words[:2]):
                    if len(line) < 80 and not any(char in line for char in '@.com|+()'):  # Not email/phone/url
                        # Additional checks to avoid headers
                        if not any(keyword in line.upper() for keyword in ['CURRICULUM', 'RESUME', 'CV', 'PROFILE', 'CONTACT']):
                            # Validate that it looks like a real name
                            name_score = 0
                            for word in words[:2]:
                                if len(word) >= 2 and word.isalpha():
                                    name_score += 1
                            
                            if name_score >= 2:  # At least 2 valid name words
                                logger.info(f"✅ Found potential name: '{line}'")
                                return line
                            else:
                                logger.info(f"❌ Rejected (invalid name pattern): '{line}'")
                        else:
                            logger.info(f"❌ Rejected (keyword): '{line}'")
                    else:
                        logger.info(f"❌ Rejected (long/contact): '{line}'")
                else:
                    logger.info(f"❌ Rejected (not title case): '{line}'")
            else:
                logger.info(f"❌ Rejected (word count): '{line}' ({len(words)} words)")
    
    # Try regex patterns with normalized content
    for pattern in NAME_PATTERNS:
        match = re.search(pattern, normalized_content, re.MULTILINE)
        if match:
            potential_name = match.group(1).strip()
            # Additional validation for regex-found names
            if 4 <= len(potential_name) <= 40 and potential_name.count(' ') >= 1:
                logger.info(f"✅ Found name via regex: '{potential_name}'")
                return potential_name
    
    logger.warning("⚠️ No valid name found in content")
    return None

def extract_address(content: str) -> Dict[str, Optional[str]]:
    """Extract address components from CV content"""
    address_data = {
        'address': None,
        'city': None,
        'state': None
    }
    
    # Try to find full address
    for pattern in ADDRESS_PATTERNS:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
        if match:
            address_data['address'] = match.group(1).strip()
            break
    
    # Try to extract city and state
    for pattern in CITY_STATE_PATTERNS:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            address_data['city'] = match.group(1).strip()
            if len(match.groups()) >= 2:
                address_data['state'] = match.group(2).strip()
            break
    
    return address_data

def extract_summary(content: str) -> Optional[str]:
    """Extract professional summary from CV content"""
    for pattern in SUMMARY_PATTERNS:
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            summary = match.group(1).strip()
            # Clean up the summary
            summary = re.sub(r'\n+', ' ', summary)
            summary = re.sub(r'\s+', ' ', summary)
            if len(summary) > 50 and len(summary) < 500:  # Reasonable length
                return summary
    
    return None

def extract_skills_list(content: str) -> List[str]:
    """Extract skills from CV content"""
    skills = []
    
    for pattern in SKILLS_PATTERNS:
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            skills_text = match.group(1).strip()
            # Parse skills from various formats
            parsed_skills = parse_skills_text(skills_text)
            skills.extend(parsed_skills)
    
    # Remove duplicates and clean up
    unique_skills = list(set(skill.strip() for skill in skills if skill.strip()))
    return unique_skills[:20]  # Limit to 20 skills

def parse_skills_text(skills_text: str) -> List[str]:
    """Parse skills from text using various delimiters"""
    skills = []
    
    # Try different separators
    separators = [',', '•', '|', ';', '\n', '/', '\\']
    
    for separator in separators:
        if separator in skills_text:
            parts = skills_text.split(separator)
            for part in parts:
                skill = part.strip().strip('•').strip('-').strip()
                if skill and len(skill) < 50:
                    skills.append(skill)
            break
    
    # If no separators found, try word-based extraction
    if not skills:
        # Look for technology/skill keywords
        words = skills_text.split()
        for word in words:
            word = word.strip('.,;()[]{}')
            if len(word) > 2 and len(word) < 25:
                skills.append(word)
    
    return skills

def extract_education_list(content: str) -> List[Dict[str, str]]:
    """Extract education information from CV content"""
    education = []
    
    for pattern in EDUCATION_PATTERNS:
        matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
        for match in matches:
            edu_text = match.group(1).strip()
            edu_info = parse_education_entry(edu_text)
            if edu_info:
                education.append(edu_info)
    
    return education[:5]  # Limit to 5 education entries

def parse_education_entry(edu_text: str) -> Optional[Dict[str, str]]:
    """Parse individual education entry"""
    if len(edu_text) < 10 or len(edu_text) > 300:
        return None
    
    edu_info = {
        'degree': '',
        'institution': '',
        'year': '',
        'details': edu_text
    }
    
    # Try to extract degree
    degree_patterns = [
        r'(Bachelor[^,\n]*|Master[^,\n]*|PhD[^,\n]*|MBA[^,\n]*|B\.S\.[^,\n]*|M\.S\.[^,\n]*|B\.A\.[^,\n]*|M\.A\.[^,\n]*)',
        r'(Associate[^,\n]*|Diploma[^,\n]*|Certificate[^,\n]*)'
    ]
    
    for pattern in degree_patterns:
        match = re.search(pattern, edu_text, re.IGNORECASE)
        if match:
            edu_info['degree'] = match.group(1).strip()
            break
    
    # Try to extract institution
    institution_match = re.search(r'([A-Za-z\s]+(?:University|College|Institute|School))', edu_text, re.IGNORECASE)
    if institution_match:
        edu_info['institution'] = institution_match.group(1).strip()
    
    # Try to extract year
    year_match = re.search(r'(19\d{2}|20\d{2})', edu_text)
    if year_match:
        edu_info['year'] = year_match.group(1)
    
    return edu_info

def extract_work_experience_list(content: str) -> List[Dict[str, str]]:
    """Extract work experience from CV content"""
    experience = []
    
    for pattern in EXPERIENCE_PATTERNS:
        matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
        for match in matches:
            exp_text = match.group(1).strip()
            # Split by likely job separators
            job_entries = re.split(r'\n(?=[A-Z][^a-z]*[|•])', exp_text)
            
            for entry in job_entries:
                exp_info = parse_experience_entry(entry.strip())
                if exp_info:
                    experience.append(exp_info)
    
    return experience[:5]  # Limit to 5 experience entries

def parse_experience_entry(exp_text: str) -> Optional[Dict[str, str]]:
    """Parse individual work experience entry"""
    if len(exp_text) < 20 or len(exp_text) > 500:
        return None
    
    exp_info = {
        'title': '',
        'company': '',
        'duration': '',
        'description': exp_text
    }
    
    # Try to extract title | company | duration pattern
    pipe_match = re.search(r'([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)', exp_text)
    if pipe_match:
        exp_info['title'] = pipe_match.group(1).strip()
        exp_info['company'] = pipe_match.group(2).strip()
        exp_info['duration'] = pipe_match.group(3).strip()
    else:
        # Try to extract from first line
        first_line = exp_text.split('\n')[0]
        if '|' in first_line:
            parts = first_line.split('|')
            if len(parts) >= 2:
                exp_info['title'] = parts[0].strip()
                exp_info['company'] = parts[1].strip()
                if len(parts) >= 3:
                    exp_info['duration'] = parts[2].strip()
    
    return exp_info

def estimate_years_of_experience(content: str) -> Optional[int]:
    """Estimate years of professional experience from CV content"""
    
    # First, try to find explicit experience statements
    exp_statements = [
        r'(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience',
        r'(?:professional\s+)?experience.*?(\d+)\s*\+?\s*years?',
        r'(\d+)\s*\+?\s*years?\s+(?:in|with)',
        r'over\s+(\d+)\s*years?\s+(?:of\s+)?(?:professional\s+)?experience'
    ]
    
    for pattern in exp_statements:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            years_exp = int(match.group(1))
            if 0 < years_exp < 50:
                return years_exp
    
    # If no explicit statement, look for work experience years only (not education)
    work_section = ""
    work_patterns = [
        r'(?:WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|EMPLOYMENT\s+HISTORY|CAREER\s+SUMMARY)[\s:]*\n?(.*?)(?:\n\n|\n(?:EDUCATION|SKILLS|CERTIFICATIONS)|$)',
        r'(?:EXPERIENCE|EMPLOYMENT)[\s:]*\n?(.*?)(?:\n\n|\n(?:EDUCATION|SKILLS)|$)'
    ]
    
    for pattern in work_patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            work_section = match.group(1)
            break
    
    if work_section:
        # Extract years from work experience section only
        year_pattern = r'(19\d{2}|20\d{2})'
        matches = re.findall(year_pattern, work_section)
        if matches:
            years = [int(year) for year in matches]
            years.sort()
            
            if len(years) >= 2:
                # Calculate span from earliest to latest work year
                span = years[-1] - years[0]
                if span > 0 and span < 50:  # Reasonable range
                    return span
    
    return None

def generate_session_uuid() -> str:
    """Generate a unique session UUID for tracking"""
    return str(uuid.uuid4())

def generate_temp_email_from_uuid(session_uuid: str) -> str:
    """Generate temporary email from UUID for CVs without email"""
    return f"{session_uuid}@bestcvbuilder.com"

def get_file_info_from_url(file_url: str) -> Optional[Dict[str, Any]]:
    """
    Get file information from URL by making a HEAD request
    
    Args:
        file_url: URL of the uploaded file
        
    Returns:
        Dictionary with file info or None if failed
    """
    try:
        import requests
        from urllib.parse import urlparse
        
        # Make HEAD request to get file metadata
        response = requests.head(file_url, timeout=10)
        
        if response.status_code == 200:
            # Get file size from Content-Length header
            file_size = int(response.headers.get('content-length', 1024))
            
            # Parse filename from URL
            parsed_url = urlparse(file_url)
            filename = parsed_url.path.split('/')[-1] or 'uploaded_resume.pdf'
            
            # Determine file type from filename or content-type
            content_type = response.headers.get('content-type', '')
            if '.pdf' in filename.lower() or 'pdf' in content_type:
                file_type = 'pdf'
            elif '.docx' in filename.lower() or 'docx' in content_type:
                file_type = 'docx'
            elif '.doc' in filename.lower() or 'msword' in content_type:
                file_type = 'doc'
            else:
                file_type = 'pdf'  # Default
            
            return {
                'original_filename': filename,
                'file_size': max(file_size, 1),  # Ensure at least 1 byte
                'file_type': file_type
            }
    except Exception as e:
        logger.warning(f"Failed to get file info from URL: {str(e)}")
    
    return None

def handle_missing_email(extracted_data: Dict[str, Any], session_uuid: str) -> str:
    """
    Handle cases where CV doesn't contain an email address
    
    Args:
        extracted_data: Extracted personal information
        session_uuid: Session UUID for this upload
        
    Returns:
        Email address (real or temporary)
    """
    extracted_email = extracted_data.get('email')
    
    if extracted_email and '@' in extracted_email:
        logger.info(f"Real email found in CV: {extracted_email}")
        return extracted_email
    else:
        temp_email = generate_temp_email_from_uuid(session_uuid)
        logger.info(f"No email found in CV, generated temporary email: {temp_email}")
        return temp_email

def save_user_profile_data(email: str, extracted_data: Dict[str, Any], session_uuid: str = None) -> bool:
    """
    Save extracted CV data to user_profiles table using email-based architecture
    
    Args:
        email: User email address extracted from CV
        extracted_data: Extracted personal information
        
    Returns:
        Boolean indicating success
    """
    try:
        from supabase import create_client, Client
        import os
        
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')  # Fallback to public key
        
        if not supabase_url or not supabase_key:
            logger.warning("Warning: Supabase credentials not found, skipping database save")
            return False
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Prepare profile data for database (only include non-None values)
        profile_data = {
            'full_name': extracted_data.get('full_name'),
            'phone': extracted_data.get('phone'),
            'address': extracted_data.get('address'),
            'city': extracted_data.get('city'),
            'state': extracted_data.get('state'),
            'linkedin_url': extracted_data.get('linkedin_url'),
            'github_url': extracted_data.get('github_url'),
            'website_url': extracted_data.get('website_url'),
            'professional_summary': extracted_data.get('professional_summary'),
            'years_of_experience': extracted_data.get('years_of_experience'),
            'skills': extracted_data.get('skills', []),
            'education': extracted_data.get('education', []),
            'work_experience': extracted_data.get('work_experience', [])
        }
        
        # Clean phone number (remove trailing spaces and validate length)
        if profile_data.get('phone'):
            phone = profile_data['phone'].strip()
            # Only keep phone if it's at least 10 characters (as per constraint)
            if len(phone) >= 10:
                profile_data['phone'] = phone
            else:
                profile_data['phone'] = None
        
        # Remove None values and empty strings/arrays
        profile_data = {k: v for k, v in profile_data.items() 
                       if v is not None and v != '' and v != []}
        
        # Determine email source type
        email_source = 'generated_temp' if '@bestcvbuilder.com' in email else 'cv_extracted'
        
        # Use the enhanced upsert function with UUID support
        logger.info(f"Upserting user profile for email: {email} (source: {email_source})")
        
        # Call the enhanced database function with UUID support
        result = supabase.rpc('upsert_user_profile_with_uuid', {
            'p_email': email,
            'p_session_uuid': session_uuid,
            'p_profile_data': profile_data,
            'p_email_source': email_source
        }).execute()
        
        if result.data:
            logger.info(f"Successfully upserted user profile for email: {email}")
            logger.info(f"Updated fields: {list(profile_data.keys())}")
            return True
        else:
            logger.warning(f"No profile created/updated for email: {email}")
            return False
        
    except Exception as e:
        logger.error(f"Failed to save user profile data for {email}: {str(e)}")
        return False

def save_resume_record(email: str, file_url: str, file_info: Dict[str, Any], session_uuid: str = None) -> Optional[int]:
    """
    Save resume upload record to resumes table
    
    Args:
        email: User email address
        file_url: URL of uploaded file
        file_info: File metadata (filename, size, type, etc.)
        
    Returns:
        Resume ID if successful, None otherwise
    """
    try:
        from supabase import create_client, Client
        import os
        import hashlib
        from urllib.parse import urlparse
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found, skipping resume record save")
            return None
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Generate file hash for duplicate detection
        file_hash = hashlib.sha256(file_url.encode()).hexdigest()[:16]  # Shortened hash
        
        # Parse file info from URL and metadata
        parsed_url = urlparse(file_url)
        filename = file_info.get('original_filename', 'unknown.pdf')
        
        # Determine email source
        email_source = 'generated_temp' if '@bestcvbuilder.com' in email else 'cv_extracted'
        
        resume_data = {
            'email': email,
            'session_uuid': session_uuid,
            'original_filename': filename,
            'file_path': parsed_url.path,
            'file_url': file_url,
            'file_size': file_info.get('file_size', 0),
            'file_type': file_info.get('file_type', 'pdf'),
            'file_hash': file_hash,
            'processing_status': 'processing',
            'upload_source': 'web_app',
            'email_source': email_source
        }
        
        logger.info(f"Saving resume record for email: {email}")
        
        # Insert resume record
        result = supabase.table('resumes').insert(resume_data).execute()
        
        if result.data and len(result.data) > 0:
            resume_id = result.data[0]['id']
            logger.info(f"Successfully saved resume record with ID: {resume_id}")
            return resume_id
        else:
            logger.warning(f"Failed to create resume record for {email}")
            return None
        
    except Exception as e:
        logger.error(f"Failed to save resume record: {str(e)}")
        return None

def save_analysis_results(email: str, resume_id: int, analysis_data: Dict[str, Any], session_uuid: str = None) -> bool:
    """
    Save analysis results to resume_analysis table
    
    Args:
        email: User email address
        resume_id: ID of the resume that was analyzed
        analysis_data: Analysis results from ATS processing
        
    Returns:
        Boolean indicating success
    """
    try:
        from supabase import create_client, Client
        import os
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found, skipping analysis save")
            return False
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Clean analysis data to remove null bytes and other problematic characters
        def clean_for_database(obj):
            """Recursively clean data for database storage"""
            if isinstance(obj, str):
                # Remove null bytes and other problematic Unicode characters
                return obj.replace('\x00', '').replace('\u0000', '').encode('utf-8', 'ignore').decode('utf-8')
            elif isinstance(obj, dict):
                return {k: clean_for_database(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_for_database(item) for item in obj]
            else:
                return obj
        
        # Clean the analysis data
        cleaned_analysis_data = clean_for_database(analysis_data)
        
        # Prepare analysis data for database
        analysis_record = {
            'email': email,
            'resume_id': resume_id,
            'session_uuid': session_uuid,
            'ats_score': min(100, max(0, int(cleaned_analysis_data.get('ats_score', 0)))),
            'score_category': cleaned_analysis_data.get('category', 'poor'),
            'structure_score': min(25, max(0, int(cleaned_analysis_data.get('component_scores', {}).get('structure', 0)))),
            'keywords_score': min(20, max(0, int(cleaned_analysis_data.get('component_scores', {}).get('keywords', 0)))),  # Fixed: 20 not 25
            'contact_score': min(15, max(0, int(cleaned_analysis_data.get('component_scores', {}).get('contact', 0)))),
            'formatting_score': min(20, max(0, int(cleaned_analysis_data.get('component_scores', {}).get('formatting', 0)))),
            'achievements_score': min(10, max(0, int(cleaned_analysis_data.get('component_scores', {}).get('achievements', 0)))),
            'readability_score': min(10, max(0, int(cleaned_analysis_data.get('component_scores', {}).get('readability', 0)))),
            'strengths': cleaned_analysis_data.get('strengths', []),
            'improvements': cleaned_analysis_data.get('improvements', []),
            'missing_keywords': cleaned_analysis_data.get('critical_issues', []),
            'found_keywords': cleaned_analysis_data.get('suggestions', []),
            'detailed_analysis': cleaned_analysis_data.get('detailed_analysis', {}),
            'recommendations': cleaned_analysis_data.get('next_steps', []),
            'detected_industry': cleaned_analysis_data.get('industry', 'general'),
            'analysis_version': '2.0'
        }
        
        logger.info(f"Saving analysis results for resume ID: {resume_id}")
        
        # Insert analysis results
        result = supabase.table('resume_analysis').insert(analysis_record).execute()
        
        if result.data:
            logger.info(f"Successfully saved analysis results for resume {resume_id}")
            return True
        else:
            logger.warning(f"Failed to save analysis results for resume {resume_id}")
            return False
        
    except Exception as e:
        logger.error(f"Failed to save analysis results: {str(e)}")
        return False

def log_activity(email: str, action: str, resource_type: str = None, resource_id: int = None, 
                success: bool = True, error_message: str = None, metadata: Dict = None, session_uuid: str = None):
    """
    Log user activity for audit trail
    
    Args:
        email: User email address
        action: Action performed (upload, analyze, etc.)
        resource_type: Type of resource (resume, payment, etc.)
        resource_id: ID of the resource
        success: Whether the action was successful
        error_message: Error message if failed
        metadata: Additional metadata
    """
    try:
        from supabase import create_client, Client
        import os
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
        
        if not supabase_url or not supabase_key:
            return  # Silently fail for logging
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        activity_data = {
            'email': email,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'success': success,
            'error_message': error_message,
            'metadata': metadata or {},
            'session_uuid': session_uuid
        }
        
        supabase.table('activity_logs').insert(activity_data).execute()
        
    except Exception as e:
        logger.error(f"Failed to log activity: {str(e)}")  # Don't fail the main operation

def analyze_resume_content(file_url: str) -> Dict[str, Any]:
    """
    Main function to analyze resume content and return comprehensive ATS analysis
    
    Args:
        file_url: URL of the uploaded resume file
        
    Returns:
        Dictionary containing comprehensive analysis results
    """
    try:
        # Validate URL
        if not validate_file_url(file_url):
            raise FileProcessingError("Invalid file URL format")
        
        # Download file with timeout and size limits
        response = requests.get(file_url, timeout=30, stream=True)
        response.raise_for_status()
        
        # Check file size (max 10MB)
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) > 10 * 1024 * 1024:
            raise FileProcessingError("File size exceeds 10MB limit")
        
        file_content = response.content
        
        # Clean up response object
        response.close()
        del response
        
        # Extract text content with memory monitoring
        logger.info(f"📝 Starting text extraction from file")
        content = extract_text_from_file(file_content, file_url)
        
        # Clean up file content immediately after extraction
        del file_content
        cleanup_memory()
        
        # Validate extracted content
        if not content or len(content.strip()) < 50:
            raise TextExtractionError("Insufficient text content extracted from file")
        
        logger.info(f"Successfully extracted {len(content)} characters from resume")
        
        # Extract personal information from CV content
        personal_info = extract_personal_information(content)
        logger.info(f"Extracted personal information: {list(personal_info.keys())}")
        
        # Debug: Log what was actually found vs None
        non_empty_fields = {k: v for k, v in personal_info.items() if v is not None and v != [] and v != ''}
        logger.info(f"Non-empty extracted fields: {list(non_empty_fields.keys())}")
        logger.info(f"GitHub found: {personal_info.get('github_url', 'None')}")
        logger.info(f"Website found: {personal_info.get('website_url', 'None')}")
        logger.info(f"Full name found: {personal_info.get('full_name', 'None')}")
        logger.info(f"Years of experience: {personal_info.get('years_of_experience', 'None')}")
        
        # Perform comprehensive ATS analysis
        ats_analysis = calculate_comprehensive_ats_score(content)
        
        # Debug: Log component scores to see why total is 100
        logger.info(f"Component scores breakdown:")
        if 'component_scores' in ats_analysis:
            for component, score in ats_analysis['component_scores'].items():
                logger.info(f"  {component}: {score}")
        logger.info(f"Total ATS score: {ats_analysis.get('ats_score', 'Not found')}")
        
        # Generate recommendations
        recommendations = generate_comprehensive_recommendations(ats_analysis)
        
        # Generate enhanced analysis with all new features
        critical_issues, quick_wins = classify_issues_by_priority(ats_analysis)
        interview_metrics = calculate_interview_rates(ats_analysis['ats_score'])
        transformation_preview = generate_transformation_preview(ats_analysis, critical_issues, quick_wins)
        enhanced_components = enhance_component_breakdown(ats_analysis)
        
        # Combine results with enhanced data
        result = {
            **ats_analysis,
            **recommendations,
            'personal_information': personal_info,
            'extracted_text_length': len(content),
            'analysis_timestamp': json.dumps({}).__class__.__module__, # Simple timestamp
            
            # Enhanced algorithm features
            'letter_grade': get_letter_grade(ats_analysis['ats_score']),
            'interview_metrics': interview_metrics,
            'critical_issues': critical_issues,
            'quick_wins': quick_wins,
            'transformation_preview': transformation_preview,
            'enhanced_components': enhanced_components,
            'total_issues': len(critical_issues) + len(quick_wins),
            'actionable_improvements': len([i for i in critical_issues + quick_wins if i.get('time_to_fix', '').split()[0].isdigit() and int(i.get('time_to_fix', '0').split()[0]) <= 5])
        }
        
        logger.info(f"Analysis completed - Score: {ats_analysis['ats_score']}")
        return result
        
    except requests.exceptions.Timeout:
        raise FileProcessingError("File download timeout - please try again")
    except requests.exceptions.RequestException as e:
        raise FileProcessingError(f"Could not download file: {str(e)}")
    except (FileProcessingError, TextExtractionError):
        raise  # Re-raise specific errors
    except Exception as e:
        import traceback
        logger.error(f"Unexpected error in resume analysis: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise ATSAnalysisError(f"An unexpected error occurred during analysis: {str(e)}")

from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    """
    Main handler class for Vercel serverless function using BaseHTTPRequestHandler
    """
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        for key, value in cors_headers().items():
            if key != 'Content-Type':  # Don't set content-type for OPTIONS
                self.send_header(key.replace('_', '-'), value)
        self.end_headers()
        return
    
    def do_POST(self):
        """Handle POST requests for CV analysis"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body_data = self.rfile.read(content_length).decode('utf-8')
                body = json.loads(body_data)
            else:
                body = {}
            
            file_url = body.get('file_url')
            user_id = body.get('user_id')  # Optional user ID for database saving
            analysis_type = body.get('analysis_type', 'comprehensive')
            include_recommendations = body.get('include_recommendations', True)
            
            if not file_url:
                self.send_error_response({'error': 'file_url is required'}, 400)
                return
            
            # Perform comprehensive analysis
            analysis_result = analyze_resume_content(file_url)
            
            # Extract personal information and handle email with UUID fallback
            personal_info = analysis_result.get('personal_information', {})
            session_uuid = generate_session_uuid()
            
            # Handle missing email with UUID fallback
            final_email = handle_missing_email(personal_info, session_uuid)
            is_temp_email = '@bestcvbuilder.com' in final_email
            
            logger.info(f"Processing CV with email: {final_email} (temporary: {is_temp_email})")
            
            try:
                # Step 1: Save/update user profile with UUID tracking
                profile_saved = save_user_profile_data(final_email, personal_info, session_uuid)
                analysis_result['profile_updated'] = profile_saved
                analysis_result['session_uuid'] = session_uuid
                analysis_result['email_used'] = final_email
                analysis_result['is_temporary_email'] = is_temp_email
                
                # Step 2: Save resume record with UUID
                # Get file info from the actual file URL
                file_info = get_file_info_from_url(file_url)
                if not file_info:
                    file_info = {
                        'original_filename': 'uploaded_resume.pdf',
                        'file_size': 1024,  # Default size to pass constraint (will be updated)
                        'file_type': 'pdf'
                    }
                resume_id = save_resume_record(final_email, file_url, file_info, session_uuid)
                analysis_result['resume_id'] = resume_id
                
                # Step 3: Save analysis results with UUID
                if resume_id:
                    analysis_saved = save_analysis_results(final_email, resume_id, analysis_result, session_uuid)
                    analysis_result['analysis_saved'] = analysis_saved
                    
                    # Update resume status to completed
                    try:
                        from supabase import create_client
                        supabase_url = os.getenv('SUPABASE_URL')
                        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
                        if supabase_url and supabase_key:
                            supabase = create_client(supabase_url, supabase_key)
                            supabase.table('resumes').update({
                                'processing_status': 'completed',
                                'analysis_completed': True,
                                'processed_at': 'now()'
                            }).eq('id', resume_id).execute()
                    except Exception as e:
                        logger.error(f"Failed to update resume status: {str(e)}")
                
                # Step 4: Log activity with UUID (always log for audit trail)
                log_activity(
                    email=final_email,
                    action='resume_analysis',
                    resource_type='resume',
                    resource_id=resume_id,
                    success=True,
                    metadata={
                        'ats_score': analysis_result.get('ats_score'),
                        'file_url': file_url,
                        'is_temporary_email': is_temp_email,
                        'original_email_found': personal_info.get('email') is not None,
                        'profile_saved': profile_saved,
                        'analysis_saved': analysis_result.get('analysis_saved', False)
                    },
                    session_uuid=session_uuid
                )
                
                logger.info(f"Successfully completed processing for {final_email} (UUID: {session_uuid})")
                
                # Add instructions for temporary email users
                if is_temp_email:
                    analysis_result['temp_email_notice'] = {
                        'message': 'Your CV did not contain an email address. We\'ve created a temporary session for you.',
                        'temp_email': final_email,
                        'session_uuid': session_uuid,
                        'instructions': 'To access your results later, you can provide your email during payment.'
                    }
                
            except Exception as e:
                logger.error(f"Error in email-based processing: {str(e)}")
                analysis_result['profile_updated'] = False
                analysis_result['database_error'] = str(e)
                
                # Log failed activity (skip if profile creation failed to avoid FK constraint)
                try:
                    log_activity(
                        email=final_email,
                        action='resume_analysis',
                        resource_type='resume',
                        success=False,
                        error_message=str(e),
                        session_uuid=session_uuid
                    )
                except Exception as log_error:
                    logger.warning(f"Failed to log activity: {str(log_error)}")
            
            # Filter results based on request parameters
            if not include_recommendations:
                # Remove recommendation fields if not requested
                analysis_result = {k: v for k, v in analysis_result.items() 
                                 if k not in ['improvements', 'suggestions', 'next_steps']}
            
            # Return successful results
            self.send_success_response(analysis_result)
            
        except FileProcessingError as e:
            logger.error(f"File processing error: {str(e)}")
            self.send_error_response({'error': str(e)}, 400)
        except TextExtractionError as e:
            logger.error(f"Text extraction error: {str(e)}")
            self.send_error_response({'error': f'Text extraction failed: {str(e)}'}, 422)
        except ATSAnalysisError as e:
            logger.error(f"ATS analysis error: {str(e)}")
            self.send_error_response({'error': str(e)}, 500)
        except Exception as e:
            logger.error(f"Unexpected API error: {str(e)}")
            self.send_error_response({'error': 'Internal server error'}, 500)
    
    def do_GET(self):
        """Handle GET requests for diagnostics"""
        try:
            # Parse the request path
            from urllib.parse import urlparse, parse_qs
            parsed_path = urlparse(self.path)
            
            if parsed_path.path == '/diagnostics' or parsed_path.path == '/api/cv-parser/diagnostics':
                # Return dependency status for diagnostics
                diagnostic_info = {
                    'service': 'CV Parser API',
                    'status': 'running',
                    'dependencies': {
                        'PyPDF2': PYPDF2_AVAILABLE,
                        'pdfplumber': PDFPLUMBER_AVAILABLE,
                        'PyMuPDF': PYMUPDF_AVAILABLE,
                        'pdfminer': PDFMINER_AVAILABLE,
                        'python-docx': DOCX_AVAILABLE
                    },
                    'total_pdf_methods': sum([PYPDF2_AVAILABLE, PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE]),
                    'extraction_quality': (
                        'Excellent' if sum([PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE]) >= 2
                        else 'Good' if sum([PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE]) >= 1
                        else 'Serverless Optimized (PyPDF2 Enhanced)' if PYPDF2_AVAILABLE
                        else 'Critical - No PDF extraction available'
                    ),
                    'runtime_environment': 'Vercel Serverless',
                    'recommendation': (
                        'All dependencies available - optimal performance' if sum([PYPDF2_AVAILABLE, PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE]) >= 3
                        else 'Consider installing missing PDF libraries for better extraction quality' if sum([PYPDF2_AVAILABLE, PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE]) < 3
                        else 'URGENT: Install PDF extraction libraries'
                    )
                }
                
                self.send_success_response(diagnostic_info)
            else:
                self.send_error_response({'error': 'Use POST for CV analysis or GET /diagnostics for status'}, 405)
                
        except Exception as e:
            logger.error(f"Diagnostics error: {str(e)}")
            self.send_error_response({'error': 'Diagnostics failed'}, 500)
    
    def send_success_response(self, data):
        """Send successful JSON response"""
        self.send_response(200)
        for key, value in cors_headers().items():
            self.send_header(key.replace('_', '-'), value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, error_data, status_code):
        """Send error JSON response"""
        self.send_response(status_code)
        for key, value in cors_headers().items():
            self.send_header(key.replace('_', '-'), value)
        self.end_headers()
        self.wfile.write(json.dumps(error_data).encode('utf-8'))

# For local testing
if __name__ == "__main__":
    # Test the function locally
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'file_url': 'https://example.com/test-resume.pdf',
            'analysis_type': 'comprehensive',
            'include_recommendations': True
        })
    }
    
    try:
        result = handler(test_event, None)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Test error: {e}")