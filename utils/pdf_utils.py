"""
PDF Processing Utilities for Resume Improvement
Handles PDF parsing with layout information and in-place text replacement
while preserving formatting, fonts, and positioning.
"""

import fitz  # PyMuPDF
import io
import logging
from typing import Dict, List, Tuple, Optional, Any
import re

logger = logging.getLogger(__name__)

class TextBlock:
    """Represents a text block with position and formatting information"""
    def __init__(self, text: str, bbox: Tuple[float, float, float, float], 
                 font: str, size: float, flags: int, page_num: int):
        self.text = text.strip()
        self.bbox = bbox  # (x0, y0, x1, y1)
        self.font = font
        self.size = size
        self.flags = flags  # font flags (bold, italic, etc.)
        self.page_num = page_num
        
    def __repr__(self):
        return f"TextBlock('{self.text[:30]}...', page={self.page_num}, font={self.font}, size={self.size})"

class PDFLayoutParser:
    """Parses PDF with detailed layout information"""
    
    def __init__(self):
        self.text_blocks = []
        self.images = []
        self.original_text = ""
        
    def parse_pdf_layout(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Parse PDF and extract text blocks with detailed layout information
        
        Args:
            pdf_bytes: PDF file as bytes
            
        Returns:
            Dictionary with text blocks, layout info, and full text
        """
        try:
            logger.info("🔍 Starting PDF layout analysis...")
            
            # Open PDF document
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            self.text_blocks = []
            full_text_parts = []
            page_count = len(doc)
            
            logger.info(f"📄 Processing {page_count} pages...")
            
            for page_num in range(page_count):
                page = doc[page_num]
                
                # Get text blocks with detailed formatting
                blocks = page.get_text("dict")
                
                for block in blocks["blocks"]:
                    if "lines" in block:  # Text block
                        self._process_text_block(block, page_num, full_text_parts)
                    elif "image" in block:  # Image block
                        self._process_image_block(block, page_num)
            
            # Combine all text
            self.original_text = "\n".join(full_text_parts)
            
            doc.close()
            
            result = {
                "text_blocks": self.text_blocks,
                "original_text": self.original_text,
                "page_count": page_count,
                "images": self.images,
                "total_blocks": len(self.text_blocks)
            }
            
            logger.info(f"✅ Layout analysis complete: {len(self.text_blocks)} text blocks found")
            return result
            
        except Exception as e:
            logger.error(f"❌ PDF layout parsing failed: {e}")
            raise Exception(f"Failed to parse PDF layout: {e}")
    
    def _process_text_block(self, block: Dict, page_num: int, full_text_parts: List[str]):
        """Process a text block and extract formatting info"""
        block_text_parts = []
        
        for line in block["lines"]:
            line_text_parts = []
            
            for span in line["spans"]:
                text = span["text"]
                if text.strip():  # Only process non-empty text
                    # Create text block with formatting info
                    text_block = TextBlock(
                        text=text,
                        bbox=span["bbox"],
                        font=span["font"],
                        size=span["size"],
                        flags=span["flags"],
                        page_num=page_num
                    )
                    
                    self.text_blocks.append(text_block)
                    line_text_parts.append(text)
            
            if line_text_parts:
                line_text = " ".join(line_text_parts)
                block_text_parts.append(line_text)
        
        if block_text_parts:
            block_text = "\n".join(block_text_parts)
            full_text_parts.append(block_text)
    
    def _process_image_block(self, block: Dict, page_num: int):
        """Process image blocks for reference"""
        image_info = {
            "bbox": block["bbox"],
            "page_num": page_num,
            "width": block["width"],
            "height": block["height"]
        }
        self.images.append(image_info)

class PDFTextReplacer:
    """Handles in-place text replacement while preserving PDF formatting"""
    
    def __init__(self):
        self.similarity_threshold = 0.6  # Minimum similarity for text matching
        
    def update_pdf_text(self, pdf_bytes: bytes, original_text: str, 
                       improved_text: str, text_blocks: List[TextBlock], conservative: bool = False) -> bytes:
        """
        Replace text in PDF while preserving layout and formatting
        
        Args:
            pdf_bytes: Original PDF bytes
            original_text: Original extracted text
            improved_text: Improved text to replace with
            text_blocks: List of text blocks from layout parsing
            conservative: If True, only replace obvious errors, not content
            
        Returns:
            Updated PDF as bytes
        """
        try:
            logger.info("🔄 Starting PDF text replacement...")
            
            # Open original document
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            # Create mapping between original and improved text
            text_mapping = self._create_text_mapping(original_text, improved_text)
            
            # Apply text replacements
            replacements_made = 0
            for text_block in text_blocks:
                if self._should_replace_block(text_block, text_mapping):
                    replacement_text = self._get_replacement_text(text_block.text, text_mapping)
                    if replacement_text and replacement_text != text_block.text:
                        self._replace_text_in_block(doc, text_block, replacement_text)
                        replacements_made += 1
            
            # Save updated PDF
            updated_pdf = io.BytesIO()
            doc.save(updated_pdf)
            updated_bytes = updated_pdf.getvalue()
            
            doc.close()
            
            logger.info(f"✅ PDF text replacement complete: {replacements_made} blocks updated")
            return updated_bytes
            
        except Exception as e:
            logger.error(f"❌ PDF text replacement failed: {e}")
            raise Exception(f"Failed to update PDF text: {e}")
    
    def _create_text_mapping(self, original: str, improved: str) -> Dict[str, str]:
        """
        Create intelligent mapping between original and improved text segments
        
        This is a simplified implementation - in production, you'd use more
        sophisticated NLP techniques for better text alignment.
        """
        mapping = {}
        
        # Split texts into sentences for better mapping
        original_sentences = self._split_into_sentences(original)
        improved_sentences = self._split_into_sentences(improved)
        
        # Simple 1:1 mapping - in production, use sequence alignment algorithms
        min_length = min(len(original_sentences), len(improved_sentences))
        
        for i in range(min_length):
            orig_sentence = original_sentences[i].strip()
            improved_sentence = improved_sentences[i].strip()
            
            if orig_sentence and improved_sentence:
                # Also map partial matches
                orig_words = orig_sentence.split()
                if len(orig_words) > 5:  # For longer sentences, map partial phrases
                    for j in range(0, len(orig_words), 3):
                        phrase = " ".join(orig_words[j:j+3])
                        if len(phrase.strip()) > 10:  # Only map meaningful phrases
                            mapping[phrase.strip()] = improved_sentence
                
                mapping[orig_sentence] = improved_sentence
        
        logger.info(f"📝 Created text mapping with {len(mapping)} entries")
        return mapping
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences for better mapping"""
        # Simple sentence splitting - could be improved with NLTK
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _should_replace_block(self, text_block: TextBlock, text_mapping: Dict[str, str]) -> bool:
        """Determine if a text block should be replaced"""
        # Don't replace very short text (likely formatting elements)
        if len(text_block.text.strip()) < 5:
            return False
        
        # Check if we have a mapping for this text
        return self._get_replacement_text(text_block.text, text_mapping) is not None
    
    def _get_replacement_text(self, original_text: str, text_mapping: Dict[str, str]) -> Optional[str]:
        """Get replacement text for a given original text"""
        original_text = original_text.strip()
        
        # Exact match
        if original_text in text_mapping:
            return text_mapping[original_text]
        
        # Partial matches
        for orig_key, replacement in text_mapping.items():
            if self._text_similarity(original_text, orig_key) > self.similarity_threshold:
                return replacement
        
        return None
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity (could be improved with better algorithms)"""
        if not text1 or not text2:
            return 0.0
        
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union) if union else 0.0
    
    def _replace_text_in_block(self, doc: fitz.Document, text_block: TextBlock, 
                              replacement_text: str):
        """Replace text in a specific block while preserving formatting - CLEAN APPROACH"""
        try:
            page = doc[text_block.page_num]
            
            # Find and remove original text
            text_instances = page.search_for(text_block.text)
            
            for inst in text_instances:
                # Check if this instance matches our block position
                if self._bbox_overlap(inst, text_block.bbox) > 0.8:
                    # CLEAN APPROACH: Use white rectangle instead of redaction
                    # Draw white rectangle to cover old text
                    page.draw_rect(inst, color=(1, 1, 1), fill=(1, 1, 1))
                    
                    # Insert new text with preserved formatting
                    page.insert_text(
                        point=(inst.x0, inst.y1 - 2),  # Slightly above baseline
                        text=replacement_text,
                        fontsize=text_block.size,
                        color=(0, 0, 0),  # Black text
                        fontname=text_block.font
                    )
                    break
            
            # NO redaction application - already handled with white rectangle
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to replace text in block: {e}")
    
    def _bbox_overlap(self, bbox1: Tuple[float, float, float, float], 
                     bbox2: Tuple[float, float, float, float]) -> float:
        """Calculate overlap ratio between two bounding boxes"""
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        intersection = (x2 - x1) * (y2 - y1)
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0


# Main API functions
def parse_pdf_layout(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Main function to parse PDF layout with text blocks and formatting info
    
    Args:
        pdf_bytes: PDF file as bytes
        
    Returns:
        Dictionary with layout information
    """
    parser = PDFLayoutParser()
    return parser.parse_pdf_layout(pdf_bytes)


def update_pdf_text(pdf_bytes: bytes, original_text: str, improved_text: str, 
                   layout_info: Dict[str, Any], ats_score: int = 65) -> bytes:
    """
    Main function to update PDF text while preserving formatting or creating clean PDF
    
    Args:
        pdf_bytes: Original PDF bytes
        original_text: Original text content
        improved_text: Improved text to replace with
        layout_info: Layout information from parse_pdf_layout
        ats_score: ATS score to determine approach (≤60 = major overhaul)
        
    Returns:
        Updated PDF as bytes
    """
    try:
        if ats_score <= 60:
            # Complete overhaul - create professional clean PDF from restructured content
            logger.info(f"🔄 Complete Professional Overhaul (ATS {ats_score}) - Creating modern ATS-optimized PDF")
            return create_clean_pdf_from_text(improved_text)
        elif ats_score < 70:  # 61-69
            # Hybrid approach - clean PDF with balanced improvements
            logger.info(f"🔄 Balanced Hybrid (ATS {ats_score}) - Creating improved PDF with selective enhancements")
            return create_clean_pdf_from_text(improved_text)
        else:  # 70+
            # Ultra-conservative - preserve original layout with minimal changes
            logger.info(f"🔄 Ultra-Conservative (ATS {ats_score}) - Preserving original layout with minimal edits")
            replacer = PDFTextReplacer()
            return replacer.update_pdf_text(
                pdf_bytes, original_text, improved_text, layout_info["text_blocks"], conservative=True
            )
    except Exception as e:
        logger.warning(f"⚠️ Layout preservation failed: {e}, falling back to clean PDF")
        return create_clean_pdf_from_text(improved_text)


def create_clean_pdf_from_text(text_content: str) -> bytes:
    """
    Create a clean, professional PDF from improved text content - CONSERVATIVE APPROACH
    
    Args:
        text_content: Improved resume text
        
    Returns:
        Clean PDF as bytes
    """
    try:
        logger.info("📄 Creating clean PDF with CONSERVATIVE text preservation...")
        
        # Create new PDF document
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)  # A4 size
        
        # Define professional styling
        margin_left = 50
        margin_right = 545
        margin_top = 50
        line_height = 14
        current_y = margin_top
        
        # CONSERVATIVE APPROACH: Process line by line without complex parsing
        lines = text_content.split('\n')
        logger.info(f"📝 Processing {len(lines)} lines directly from improved text")
        
        for line_num, line in enumerate(lines):
            line = line.strip()
            if not line:  # Empty line - add small spacing
                current_y += 8
                continue
            
            # Check if we need a new page
            if current_y > 780:  # Near bottom of page
                page = doc.new_page(width=595, height=842)
                current_y = margin_top
            
            # Determine font style based on line characteristics
            fontsize = 10
            fontname = "Helvetica"
            color = (0, 0, 0)
            
            # First few lines (header info)
            if line_num == 0:  # Name
                fontsize = 18
                fontname = "Helvetica-Bold"
            elif line_num <= 3:  # Contact/title info
                fontsize = 11
                if line_num == 1:
                    fontname = "Helvetica-Bold"
                    color = (0.2, 0.2, 0.2)
            # Section headers (ALL CAPS and significant length)
            elif line.isupper() and len(line) > 5 and not line.replace(' ', '').isdigit():
                fontsize = 12
                fontname = "Helvetica-Bold"
                current_y += 8  # Extra spacing before section
            # Job titles/companies (contains certain keywords)
            elif any(keyword in line for keyword in ['Manager', 'Director', 'Officer', 'Engineer', 'Developer', 'Lead', '–', '|', 'Chief', 'Associate', 'Senior', 'Principal']):
                fontsize = 11
                fontname = "Helvetica-Bold"
            
            # Handle long lines by wrapping text
            wrapped_lines = _wrap_text_conservative(line, margin_right - margin_left, fontsize)
            
            for wrapped_line in wrapped_lines:
                # Insert text
                try:
                    page.insert_text(
                        point=(margin_left, current_y),
                        text=wrapped_line,
                        fontsize=fontsize,
                        color=color,
                        fontname=fontname
                    )
                except Exception as e:
                    logger.warning(f"⚠️ Failed to insert text: {wrapped_line[:50]}... Error: {e}")
                    # Fallback with basic font
                    page.insert_text(
                        point=(margin_left, current_y),
                        text=wrapped_line,
                        fontsize=10,
                        color=(0, 0, 0),
                        fontname="Helvetica"
                    )
                
                current_y += line_height
        
        # Save to bytes
        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        doc.close()
        
        result = pdf_bytes.getvalue()
        logger.info(f"✅ Conservative PDF created: {len(result)} bytes")
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to create clean PDF: {e}")
        # Fallback: create basic PDF with text
        return create_basic_pdf_from_text(text_content)


def create_basic_pdf_from_text(text_content: str) -> bytes:
    """Basic PDF creation as final fallback"""
    try:
        doc = fitz.open()
        page = doc.new_page()
        
        # Simple text insertion
        text_rect = fitz.Rect(50, 50, 545, 792)  # Margins
        page.insert_textbox(text_rect, text_content, 
                          fontsize=10, fontname="Helvetica", color=(0, 0, 0))
        
        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        doc.close()
        
        return pdf_bytes.getvalue()
        
    except Exception as e:
        logger.error(f"❌ Even basic PDF creation failed: {e}")
        raise Exception(f"PDF generation completely failed: {e}")


def _parse_resume_sections(text_content: str) -> List[Dict[str, Any]]:
    """Parse resume text into structured sections with better detection"""
    sections = []
    lines = text_content.split('\n')
    current_section = None
    header_lines = []
    
    # Common section keywords
    section_keywords = [
        'PROFESSIONAL SUMMARY', 'SUMMARY', 'PROFILE', 'OBJECTIVE',
        'PROFESSIONAL EXPERIENCE', 'EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT',
        'EDUCATION', 'ACADEMIC BACKGROUND',
        'SKILLS', 'CORE COMPETENCIES', 'TECHNICAL SKILLS', 'CORE SKILLS',
        'CERTIFICATIONS', 'CERTIFICATES', 'CREDENTIALS',
        'ACHIEVEMENTS', 'KEY ACHIEVEMENTS', 'ACCOMPLISHMENTS',
        'PROJECTS', 'KEY PROJECTS'
    ]
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Check if this is a section header
        is_section_header = False
        
        # Method 1: All caps and substantial length
        if line.isupper() and len(line) > 4 and not line.replace(' ', '').isdigit():
            is_section_header = True
            
        # Method 2: Exact keyword match
        elif any(keyword == line.upper() for keyword in section_keywords):
            is_section_header = True
            
        # Method 3: Starts with known keywords
        elif any(line.upper().startswith(keyword) for keyword in section_keywords):
            is_section_header = True
        
        if is_section_header:
            # Start new section
            if current_section:
                sections.append(current_section)
            current_section = {
                'type': 'section',
                'header': line,
                'content': []
            }
        elif current_section:
            current_section['content'].append(line)
        else:
            # Header info (name, contact) - collect first few lines
            header_lines.append(line)
    
    # Add header section if we have header lines
    if header_lines:
        sections.insert(0, {
            'type': 'header',
            'content': header_lines
        })
    
    # Add final section
    if current_section:
        sections.append(current_section)
    
    logger.info(f"📝 Parsed sections: {[s.get('header', 'header') for s in sections]}")
    return sections


def _render_section_to_pdf(page: fitz.Page, section: Dict[str, Any], margin_left: int, 
                          margin_right: int, current_y: int, line_height: int, section_spacing: int) -> int:
    """Render a resume section to PDF page with professional formatting"""
    try:
        if section['type'] == 'header':
            # Render header (name, contact info)
            for i, line in enumerate(section['content']):
                if not line:
                    continue
                    
                if i == 0:  # First line is usually the name
                    # Name in large, bold font
                    page.insert_text(
                        point=(margin_left, current_y),
                        text=line,
                        fontsize=16,
                        color=(0, 0, 0),
                        fontname="Helvetica-Bold"
                    )
                    current_y += 20
                elif i == 1:  # Second line is usually the title
                    # Title in medium font
                    page.insert_text(
                        point=(margin_left, current_y),
                        text=line,
                        fontsize=11,
                        color=(0.2, 0.2, 0.2),
                        fontname="Helvetica"
                    )
                    current_y += 15
                else:  # Contact info
                    page.insert_text(
                        point=(margin_left, current_y),
                        text=line,
                        fontsize=10,
                        color=(0, 0, 0),
                        fontname="Helvetica"
                    )
                    current_y += line_height
            
            current_y += section_spacing
            
        elif section['type'] == 'section':
            # Add line above section header
            page.draw_line(
                fitz.Point(margin_left, current_y - 5),
                fitz.Point(margin_right, current_y - 5),
                color=(0.3, 0.3, 0.3),
                width=1
            )
            
            # Render section header
            page.insert_text(
                point=(margin_left, current_y + 8),
                text=section['header'].upper(),
                fontsize=12,
                color=(0, 0, 0),
                fontname="Helvetica-Bold"
            )
            current_y += 25
            
            # Render section content
            for line in section['content']:
                if not line:
                    current_y += 5  # Small space for empty lines
                    continue
                
                # Wrap long lines
                wrapped_lines = _wrap_text(line, margin_right - margin_left, fontsize=10)
                
                for wrapped_line in wrapped_lines:
                    # Check if it's a bullet point
                    if wrapped_line.startswith('•') or wrapped_line.startswith('-') or wrapped_line.startswith('*'):
                        page.insert_text(
                            point=(margin_left + 15, current_y),
                            text=wrapped_line,
                            fontsize=10,
                            color=(0, 0, 0),
                            fontname="Helvetica"
                        )
                    else:
                        # Check if it looks like a job title/company (often bold)
                        is_title = any(keyword in wrapped_line for keyword in ['Manager', 'Director', 'Officer', 'Engineer', 'Developer', '–', '|'])
                        
                        page.insert_text(
                            point=(margin_left, current_y),
                            text=wrapped_line,
                            fontsize=10,
                            color=(0, 0, 0),
                            fontname="Helvetica-Bold" if is_title else "Helvetica"
                        )
                    current_y += line_height
            
            current_y += section_spacing
            
        return current_y
        
    except Exception as e:
        logger.warning(f"⚠️ Failed to render section: {e}")
        return current_y + 20


def _wrap_text_conservative(text: str, max_width: int, fontsize: int = 10) -> List[str]:
    """Conservative text wrapping that preserves all content"""
    if not text:
        return []
    
    # More conservative character estimate
    chars_per_line = int(max_width // (fontsize * 0.5))  # More conservative estimate
    
    if len(text) <= chars_per_line:
        return [text]
    
    words = text.split(' ')
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        # Check if adding this word would exceed the line length
        if current_length + len(word) + 1 <= chars_per_line:
            current_line.append(word)
            current_length += len(word) + 1
        else:
            # Finish current line if it has content
            if current_line:
                lines.append(' '.join(current_line))
            
            # Handle very long single words
            if len(word) > chars_per_line:
                # Split long words
                while len(word) > chars_per_line:
                    lines.append(word[:chars_per_line])
                    word = word[chars_per_line:]
                if word:  # Add remaining part
                    current_line = [word]
                    current_length = len(word)
                else:
                    current_line = []
                    current_length = 0
            else:
                current_line = [word]
                current_length = len(word)
    
    # Add any remaining content
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines if lines else [text]  # Ensure we never return empty

def _wrap_text(text: str, max_width: int, fontsize: int = 10) -> List[str]:
    """Simple text wrapping based on character count"""
    if not text:
        return []
    
    # Approximate characters per line based on font size and width
    chars_per_line = max_width // (fontsize * 0.6)  # Rough estimate
    
    if len(text) <= chars_per_line:
        return [text]
    
    words = text.split(' ')
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) + 1 <= chars_per_line:
            current_line.append(word)
            current_length += len(word) + 1
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
            current_length = len(word)
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines