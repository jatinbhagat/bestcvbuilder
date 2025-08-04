#!/usr/bin/env python3
"""
Test script to verify Render.com setup with enhanced PDF extraction
Tests the new priority system: pdfplumber > PyMuPDF > pdfminer > PyPDF2
"""

import sys
import os
import logging

# Add the api directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'cv-parser'))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_dependencies():
    """Test all PDF extraction dependencies"""
    print("🔍 Testing PDF extraction dependencies for Render.com...")
    
    dependencies = {
        'PyPDF2': False,
        'pdfplumber': False, 
        'PyMuPDF': False,
        'pdfminer': False,
        'python-docx': False,
        'supabase': False,
        'flask': False
    }
    
    # Test PyPDF2
    try:
        import PyPDF2
        dependencies['PyPDF2'] = True
        print("✅ PyPDF2 available")
    except ImportError as e:
        print(f"❌ PyPDF2 not available: {e}")
    
    # Test pdfplumber
    try:
        import pdfplumber
        dependencies['pdfplumber'] = True
        print("✅ pdfplumber available")
    except ImportError as e:
        print(f"❌ pdfplumber not available: {e}")
    
    # Test PyMuPDF
    try:
        import fitz  # PyMuPDF
        dependencies['PyMuPDF'] = True
        print("✅ PyMuPDF/fitz available")
    except ImportError as e:
        print(f"❌ PyMuPDF not available: {e}")
    
    # Test pdfminer
    try:
        from pdfminer.high_level import extract_text
        dependencies['pdfminer'] = True
        print("✅ pdfminer available")
    except ImportError as e:
        print(f"❌ pdfminer not available: {e}")
    
    # Test python-docx
    try:
        import docx
        dependencies['python-docx'] = True
        print("✅ python-docx available")
    except ImportError as e:
        print(f"❌ python-docx not available: {e}")
    
    # Test supabase
    try:
        import supabase
        dependencies['supabase'] = True
        print("✅ supabase available")
    except ImportError as e:
        print(f"❌ supabase not available: {e}")
    
    # Test flask
    try:
        import flask
        dependencies['flask'] = True
        print("✅ flask available")
    except ImportError as e:
        print(f"❌ flask not available: {e}")
    
    # Summary
    available_count = sum(dependencies.values())
    total_count = len(dependencies)
    
    print(f"\n📊 Dependency Summary: {available_count}/{total_count} available")
    
    # PDF extraction specific summary
    pdf_deps = ['PyPDF2', 'pdfplumber', 'PyMuPDF', 'pdfminer']
    pdf_available = sum(1 for dep in pdf_deps if dependencies[dep])
    
    print(f"📄 PDF extraction methods: {pdf_available}/{len(pdf_deps)} available")
    
    if pdf_available >= 3:
        print("🎉 Excellent: Multiple high-quality PDF extraction methods available!")
    elif pdf_available >= 2:
        print("✅ Good: Multiple PDF extraction methods available")
    elif pdf_available == 1:
        print("⚠️  Warning: Only one PDF extraction method available")
    else:
        print("❌ Critical: No PDF extraction methods available!")
    
    return dependencies

def test_flask_import():
    """Test Flask app import"""
    print("\n🌐 Testing Flask app import...")
    
    try:
        # Add main directory to path
        sys.path.append(os.path.dirname(__file__))
        from app import app
        print("✅ Flask app imported successfully")
        
        # Test that routes are registered
        routes = [rule.rule for rule in app.url_map.iter_rules()]
        print(f"📍 Available routes: {routes}")
        
        return True
    except Exception as e:
        print(f"❌ Flask app import failed: {e}")
        return False

def test_pdf_extraction_priority():
    """Test the new PDF extraction priority system"""
    print("\n🏆 Testing PDF extraction priority system...")
    
    try:
        from index import extract_pdf_text, PDFPLUMBER_AVAILABLE, PYMUPDF_AVAILABLE, PDFMINER_AVAILABLE, PYPDF2_AVAILABLE
        
        print(f"Priority order status:")
        print(f"  1. pdfplumber: {'✅' if PDFPLUMBER_AVAILABLE else '❌'}")
        print(f"  2. PyMuPDF: {'✅' if PYMUPDF_AVAILABLE else '❌'}")
        print(f"  3. pdfminer: {'✅' if PDFMINER_AVAILABLE else '❌'}")
        print(f"  4. PyPDF2: {'✅' if PYPDF2_AVAILABLE else '❌'}")
        
        # Test would require actual PDF file
        print("⏳ PDF extraction test requires actual PDF file (skipped for now)")
        
        return True
    except Exception as e:
        print(f"❌ PDF extraction priority test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Render.com Setup Test for BestCVBuilder")
    print("=" * 50)
    
    # Test all components
    deps = test_dependencies()
    flask_ok = test_flask_import()
    priority_ok = test_pdf_extraction_priority()
    
    print("\n" + "=" * 50)
    print("🎯 RENDER.COM READINESS SUMMARY:")
    
    critical_deps = ['PyPDF2', 'supabase', 'flask']
    critical_available = all(deps.get(dep, False) for dep in critical_deps)
    
    if critical_available and flask_ok:
        print("🎉 READY FOR RENDER.COM DEPLOYMENT!")
        print("✅ All critical dependencies available")
        print("✅ Flask app imports successfully")
        
        if deps.get('pdfplumber', False) and deps.get('PyMuPDF', False):
            print("🏆 BONUS: Premium PDF extraction methods available!")
            print("📧 This should resolve email parsing issues")
        
    else:
        print("❌ NOT READY - Missing critical dependencies")
        
        missing = [dep for dep in critical_deps if not deps.get(dep, False)]
        if missing:
            print(f"Missing: {', '.join(missing)}")
            
        if not flask_ok:
            print("Missing: Flask app import failed")
    
    print("\nNext steps:")
    print("1. pip install -r requirements.txt")
    print("2. Deploy to Render.com")
    print("3. Update DNS/frontend to point to Render API")