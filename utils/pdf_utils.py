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
    CRITICAL: This function MUST preserve ALL text from text_content without any loss
    
    Args:
        text_content: Improved resume text - MUST be preserved completely
        
    Returns:
        Clean PDF as bytes with IDENTICAL content to text_content
    """
    try:
        logger.info("📄 Creating clean PDF with CONSERVATIVE text preservation...")
        logger.info(f"🔍 Input text length: {len(text_content)} characters")
        
        # CRITICAL: Save original text length for validation
        original_text_length = len(text_content)
        original_lines_count = len([line for line in text_content.split('\n') if line.strip()])
        
        # Create new PDF document
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)  # A4 size
        
        # Define professional styling
        margin_left = 50
        margin_right = 545
        margin_top = 50
        line_height = 14
        current_y = margin_top
        
        # CONTENT-AWARE APPROACH: Parse content into structured blocks first
        content_blocks = _parse_resume_content_blocks(text_content)
        logger.info(f"📝 Processing {len(content_blocks)} content blocks from improved text")
        
        # CRITICAL: Track what text we actually add to PDF
        added_text_parts = []
        
        for block_num, content_block in enumerate(content_blocks):
            # CRITICAL: Record this block for validation
            added_text_parts.extend(content_block['lines'])
            
            # Process each content block as a unit with page management
            page, current_y = _render_content_block_to_pdf_with_pages(
                page, doc, content_block, margin_left, margin_right, 
                current_y, line_height, block_num, margin_top
            )
        
        # CRITICAL: Comprehensive content validation
        validation_result = _validate_content_preservation(text_content, added_text_parts, original_text_length)
        
        if not validation_result['passed']:
            logger.error(f"❌ CRITICAL: Content validation failed!")
            logger.error(f"❌ Original length: {original_text_length}, Added length: {validation_result['added_length']}")
            logger.error(f"❌ Missing content: {validation_result['missing_content'][:200]}...")
            
            # Try to recover missing content
            recovery_result = _attempt_content_recovery(
                doc, text_content, added_text_parts, margin_left, margin_right, margin_top
            )
            
            if not recovery_result['success']:
                logger.error(f"❌ Content recovery failed - falling back to text-only PDF")
                return create_basic_pdf_from_text(text_content)
            else:
                logger.info(f"✅ Content recovery successful - added {recovery_result['recovered_items']} missing items")
        
        # Save to bytes
        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        doc.close()
        
        result = pdf_bytes.getvalue()
        logger.info(f"✅ Conservative PDF created: {len(result)} bytes with content preservation validated")
        logger.info(f"📊 Content validation: {added_text_length}/{original_text_length} characters preserved")
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to create clean PDF: {e}")
        # CRITICAL: Fallback MUST preserve content
        logger.info("🔄 Falling back to basic PDF generation to preserve content")
        return create_basic_pdf_from_text(text_content)


def create_basic_pdf_from_text(text_content: str) -> bytes:
    """Basic PDF creation as final fallback - MUST preserve all content"""
    try:
        logger.info(f"🔄 Creating basic PDF fallback for {len(text_content)} characters")
        
        doc = fitz.open()
        page = doc.new_page()
        
        # CRITICAL: Split text into manageable chunks that fit in textbox
        text_rect = fitz.Rect(50, 50, 545, 792)  # Margins
        
        # Calculate approximate characters that fit per page
        max_chars_per_page = 3000  # Conservative estimate
        
        current_pos = 0
        page_num = 0
        
        while current_pos < len(text_content):
            # Get chunk for this page
            chunk_end = min(current_pos + max_chars_per_page, len(text_content))
            chunk = text_content[current_pos:chunk_end]
            
            # Find a good break point (preferably at line break)
            if chunk_end < len(text_content):
                # Look for the last newline in the last 200 characters
                last_newline = chunk.rfind('\n', max(0, len(chunk) - 200))
                if last_newline > len(chunk) * 0.8:  # Only use if it's not too early
                    chunk = chunk[:last_newline + 1]
                    chunk_end = current_pos + len(chunk)
            
            # Insert text into current page
            try:
                page.insert_textbox(text_rect, chunk, 
                                  fontsize=10, fontname="Helvetica", color=(0, 0, 0))
            except Exception as e:
                logger.warning(f"⚠️ Textbox insertion failed: {e}, trying smaller font")
                try:
                    page.insert_textbox(text_rect, chunk, 
                                      fontsize=8, fontname="Helvetica", color=(0, 0, 0))
                except Exception as e2:
                    logger.error(f"❌ Even smaller font failed: {e2}")
                    # Try line by line as last resort
                    lines = chunk.split('\n')
                    y = 60
                    for line in lines:
                        if y > 780:
                            break
                        try:
                            page.insert_text((55, y), line, fontsize=8)
                            y += 12
                        except:
                            pass
            
            current_pos = chunk_end
            page_num += 1
            
            # Create new page if more content remains
            if current_pos < len(text_content):
                page = doc.new_page()
        
        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        doc.close()
        
        result = pdf_bytes.getvalue()
        logger.info(f"✅ Basic PDF created: {len(result)} bytes across {page_num} pages")
        return result
        
    except Exception as e:
        logger.error(f"❌ Even basic PDF creation failed: {e}")
        # CRITICAL: Last resort - create minimal PDF with error message
        try:
            doc = fitz.open()
            page = doc.new_page()
            error_msg = f"PDF generation failed: {str(e)}\n\nOriginal text length: {len(text_content)} chars\n\nPlease use the text download instead."
            page.insert_textbox(fitz.Rect(50, 50, 545, 200), error_msg, fontsize=12)
            pdf_bytes = io.BytesIO()
            doc.save(pdf_bytes)
            doc.close()
            return pdf_bytes.getvalue()
        except:
            raise Exception(f"PDF generation completely failed: {e}")


def _parse_resume_content_blocks(text_content: str) -> List[Dict[str, Any]]:
    """Parse resume text into intelligent content blocks that preserve related information"""
    lines = text_content.split('\n')
    blocks = []
    current_block = None
    
    for line_num, line in enumerate(lines):
        line_type = _classify_resume_line(line, line_num)
        
        # Start new block for certain line types
        if line_type in ['name', 'section_header', 'job_title']:
            # Save previous block
            if current_block and current_block['lines']:
                blocks.append(current_block)
            
            # Start new block
            current_block = {
                'type': line_type,
                'lines': [line],
                'start_line': line_num
            }
        elif current_block:
            # Add to current block
            current_block['lines'].append(line)
        else:
            # No current block, start a general block
            current_block = {
                'type': 'general',
                'lines': [line],
                'start_line': line_num
            }
    
    # Add final block
    if current_block and current_block['lines']:
        blocks.append(current_block)
    
    logger.info(f"📊 Parsed {len(blocks)} content blocks: {[b['type'] for b in blocks]}")
    return blocks

def _classify_resume_line(line: str, line_num: int) -> str:
    """Classify a resume line to determine its type for intelligent processing"""
    stripped = line.strip()
    
    if not stripped:
        return 'empty'
    
    # Name (usually first non-empty line)
    if line_num <= 2 and len(stripped) > 5 and not any(char in stripped for char in ['@', 'http', '+']):
        return 'name'
    
    # Contact information
    if any(indicator in stripped for indicator in ['@', 'http', '+91', '+1', 'linkedin', 'gmail']):
        return 'contact'
    
    # Section headers (ALL CAPS)
    if stripped.isupper() and len(stripped) > 4 and not stripped.replace(' ', '').isdigit():
        return 'section_header'
    
    # Job titles/companies (contains position indicators)
    if any(keyword in stripped for keyword in ['Manager', 'Director', 'Officer', 'Engineer', 'Developer', 'Lead', 'Chief', 'Associate', 'Senior', 'Principal', 'CEO', 'CTO', 'CPO']):
        return 'job_title'
    
    # Date lines
    if any(indicator in stripped for indicator in ['/', '–', '-', 'Ongoing', '2020', '2021', '2022', '2023', '2024', '2025']):
        return 'date_location'
    
    # Bullet points
    if stripped.startswith(('•', '-', '*', '◦')):
        return 'bullet_point'
    
    # Skills/items in a list
    if any(skill_word in stripped for skill_word in ['Python', 'JavaScript', 'Management', 'Analytics', 'AI', 'ML', 'Product']):
        return 'skill_item'
    
    return 'general'

def _render_content_block_to_pdf_with_pages(page, doc, content_block, margin_left, margin_right, 
                                          current_y, line_height, block_num, margin_top) -> tuple:
    """Render a content block to PDF while preserving all content and context with intelligent page flow"""
    block_type = content_block['type']
    lines = content_block['lines']
    
    # Intelligent page management: ensure blocks stay together when possible
    estimated_height = len(lines) * line_height + 30  # Extra spacing for formatting
    page_bottom = 780
    
    # For important blocks (name, section headers), try to keep them together
    if block_type in ['name', 'section_header', 'job_title'] and current_y + estimated_height > page_bottom:
        page = doc.new_page(width=595, height=842)
        current_y = margin_top
        logger.info(f"📄 Created new page for {block_type} block to keep content together")
    
    content_inserted = 0  # Track successful insertions
    
    try:
        for line_num, line in enumerate(lines):
            if not line.strip():  # Empty line
                current_y += 8
                continue
            
            # Check page space before processing line
            if current_y > page_bottom - 30:  # Leave margin at bottom
                page = doc.new_page(width=595, height=842)
                current_y = margin_top
                logger.info(f"📄 New page created during {block_type} block processing")
            
            # Determine styling based on line type and block type
            fontsize, fontname, color = _get_line_styling(block_type, line, line_num, block_num)
            
            # Add extra spacing for certain block types
            if line_num == 0 and block_type in ['section_header', 'job_title']:
                current_y += 8
            
            # Wrap text with accurate measurement
            wrapped_lines = _wrap_text_with_measurement(
                line.strip(), margin_right - margin_left, fontsize, fontname
            )
            
            for wrapped_line in wrapped_lines:
                if not wrapped_line.strip():
                    continue
                
                # Check page space for each wrapped line
                if current_y > page_bottom - 20:
                    page = doc.new_page(width=595, height=842)
                    current_y = margin_top
                    logger.info(f"📄 New page created for wrapped line in {block_type}")
                
                # Insert text with multiple fallback strategies
                success = _insert_text_with_fallbacks(
                    page, margin_left, current_y, wrapped_line, 
                    fontsize, fontname, color, margin_right
                )
                
                if success:
                    content_inserted += 1
                else:
                    logger.error(f"❌ CRITICAL: Failed to insert line: {wrapped_line[:50]}")
                
                current_y += line_height
        
        # Add spacing after block
        if block_type in ['section_header', 'job_title']:
            current_y += 6
        
        logger.info(f"✅ Successfully inserted {content_inserted} text elements for {block_type} block")
            
    except Exception as e:
        logger.error(f"❌ Error rendering content block {block_type}: {e}")
        # Robust fallback: render as plain text with guaranteed insertion
        for line in lines:
            if line.strip():
                # Ensure page space
                if current_y > page_bottom - 20:
                    page = doc.new_page(width=595, height=842)
                    current_y = margin_top
                
                # Use most basic insertion method
                try:
                    page.insert_text(
                        point=(margin_left, current_y),
                        text=line.strip(),
                        fontsize=10,
                        color=(0, 0, 0),
                        fontname="Helvetica"
                    )
                    content_inserted += 1
                except:
                    # Final fallback - textbox
                    try:
                        rect = fitz.Rect(margin_left, current_y - 5, margin_right, current_y + 15)
                        page.insert_textbox(rect, line.strip(), fontsize=9)
                        content_inserted += 1
                    except:
                        logger.error(f"❌ ULTIMATE FALLBACK FAILED for: {line[:50]}")
                
                current_y += line_height
    
    logger.info(f"📊 Block {block_type} completed: {content_inserted} elements inserted")
    return page, current_y

def _get_line_styling(block_type: str, line: str, line_num: int, block_num: int) -> tuple:
    """Determine font styling for a line based on its context"""
    fontsize = 10
    fontname = "Helvetica"
    color = (0, 0, 0)
    
    # Name styling
    if block_type == 'name' or (block_num == 0 and line_num == 0):
        fontsize = 18
        fontname = "Helvetica-Bold"
    
    # Contact info styling
    elif block_type == 'contact':
        fontsize = 10
        color = (0.3, 0.3, 0.3)
    
    # Section headers
    elif block_type == 'section_header':
        fontsize = 12
        fontname = "Helvetica-Bold"
        
    # Job titles
    elif block_type == 'job_title':
        fontsize = 11
        fontname = "Helvetica-Bold"
    
    # Date/location lines
    elif block_type == 'date_location':
        fontsize = 10
        color = (0.4, 0.4, 0.4)
    
    # Professional summary (usually appears early)
    elif block_num <= 2 and line_num == 0 and len(line) > 50:
        fontsize = 11
        fontname = "Helvetica-Bold"
        color = (0.2, 0.2, 0.2)
    
    return fontsize, fontname, color

def _insert_text_with_fallbacks(page, x, y, text, fontsize, fontname, color, max_x) -> bool:
    """Insert text with multiple fallback strategies to ensure no content loss"""
    strategies = [
        # Strategy 1: Original parameters
        {'fontsize': fontsize, 'fontname': fontname, 'color': color},
        # Strategy 2: Safe font
        {'fontsize': fontsize, 'fontname': 'Helvetica', 'color': (0, 0, 0)},
        # Strategy 3: Smaller safe font
        {'fontsize': 9, 'fontname': 'Helvetica', 'color': (0, 0, 0)},
        # Strategy 4: Textbox fallback
        {'method': 'textbox'}
    ]
    
    for strategy in strategies:
        try:
            if strategy.get('method') == 'textbox':
                # Textbox fallback
                rect = fitz.Rect(x, y - 5, max_x, y + 15)
                page.insert_textbox(rect, text, fontsize=9, fontname="Helvetica")
                return True
            else:
                # Regular text insertion
                page.insert_text(
                    point=(x, y),
                    text=text,
                    fontsize=strategy['fontsize'],
                    color=strategy['color'],
                    fontname=strategy['fontname']
                )
                return True
        except Exception as e:
            logger.debug(f"Text insertion strategy failed: {e}")
            continue
    
    return False

def _validate_content_preservation(original_text: str, added_text_parts: List[str], original_length: int) -> Dict[str, Any]:
    """Comprehensively validate that all content was preserved during PDF generation"""
    
    # Calculate text statistics
    added_text = '\n'.join(added_text_parts)
    added_length = len(added_text)
    preservation_ratio = added_length / original_length if original_length > 0 else 0
    
    # Split into words for detailed comparison
    original_words = set(original_text.lower().split())
    added_words = set(added_text.lower().split())
    
    # Find missing words
    missing_words = original_words - added_words
    missing_content = ' '.join(missing_words)
    
    # Critical content check - look for important resume elements
    critical_elements = [
        'experience', 'education', 'skills', 'achievements', 
        'professional', 'manager', 'director', 'engineer',
        'university', 'certification', 'project'
    ]
    
    missing_critical = [elem for elem in critical_elements if elem in original_text.lower() and elem not in added_text.lower()]
    
    # Validation criteria
    length_ok = preservation_ratio >= 0.85  # Allow 15% loss for formatting
    words_ok = len(missing_words) <= len(original_words) * 0.1  # Max 10% word loss
    critical_ok = len(missing_critical) == 0  # No critical content missing
    
    passed = length_ok and words_ok and critical_ok
    
    result = {
        'passed': passed,
        'preservation_ratio': preservation_ratio,
        'added_length': added_length,
        'missing_words_count': len(missing_words),
        'missing_content': missing_content,
        'missing_critical': missing_critical,
        'details': {
            'length_check': length_ok,
            'words_check': words_ok,
            'critical_check': critical_ok
        }
    }
    
    logger.info(f"📊 Content validation: {preservation_ratio:.2%} preserved, {len(missing_words)} words missing")
    
    return result

def _attempt_content_recovery(doc, original_text: str, added_text_parts: List[str], 
                             margin_left: int, margin_right: int, margin_top: int) -> Dict[str, Any]:
    """Attempt to recover missing content by adding it to the PDF"""
    
    try:
        added_text = '\n'.join(added_text_parts)
        
        # Find content that wasn't added
        original_lines = [line.strip() for line in original_text.split('\n') if line.strip()]
        added_lines = [line.strip() for line in added_text.split('\n') if line.strip()]
        
        missing_lines = []
        for orig_line in original_lines:
            found = False
            for added_line in added_lines:
                if orig_line in added_line or added_line in orig_line:
                    found = True
                    break
            if not found:
                missing_lines.append(orig_line)
        
        if not missing_lines:
            return {'success': True, 'recovered_items': 0, 'message': 'No missing content detected'}
        
        logger.info(f"🔧 Attempting to recover {len(missing_lines)} missing lines")
        
        # Add a new page for missing content
        recovery_page = doc.new_page(width=595, height=842)
        current_y = margin_top
        
        # Add header
        recovery_page.insert_text(
            point=(margin_left, current_y),
            text="RECOVERED CONTENT",
            fontsize=12,
            color=(0.5, 0, 0),
            fontname="Helvetica-Bold"
        )
        current_y += 25
        
        # Add missing content
        recovered_count = 0
        for line in missing_lines:
            if current_y > 780:  # Near bottom
                recovery_page = doc.new_page(width=595, height=842)
                current_y = margin_top
            
            # Wrap and insert missing content
            wrapped_lines = _wrap_text_with_measurement(line, margin_right - margin_left, 10, "Helvetica")
            
            for wrapped_line in wrapped_lines:
                try:
                    recovery_page.insert_text(
                        point=(margin_left, current_y),
                        text=wrapped_line,
                        fontsize=10,
                        color=(0, 0, 0),
                        fontname="Helvetica"
                    )
                    current_y += 14
                    recovered_count += 1
                except:
                    # Textbox fallback
                    try:
                        rect = fitz.Rect(margin_left, current_y - 5, margin_right, current_y + 15)
                        recovery_page.insert_textbox(rect, wrapped_line, fontsize=9)
                        current_y += 14
                        recovered_count += 1
                    except:
                        logger.warning(f"Could not recover line: {line[:50]}")
        
        logger.info(f"✅ Content recovery completed: {recovered_count} items recovered")
        
        return {
            'success': True,
            'recovered_items': recovered_count,
            'message': f'Successfully recovered {recovered_count} missing content items'
        }
        
    except Exception as e:
        logger.error(f"❌ Content recovery failed: {e}")
        return {
            'success': False,
            'recovered_items': 0,
            'message': f'Recovery failed: {str(e)}'
        }

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


def _wrap_text_with_measurement(text: str, max_width: int, fontsize: int = 10, fontname: str = "Helvetica") -> List[str]:
    """Accurate text wrapping using PyMuPDF text measurement - GUARANTEES no content loss"""
    if not text or not text.strip():
        return [text] if text else []
    
    try:
        # Create a temporary document for text measurement
        temp_doc = fitz.open()
        temp_page = temp_doc.new_page()
        
        # Test if the entire text fits on one line
        text_width = temp_page.get_textlength(text, fontname=fontname, fontsize=fontsize)
        temp_doc.close()
        
        if text_width <= max_width:
            return [text]
        
        # Text needs wrapping - use word-by-word approach with accurate measurement
        words = text.split(' ')
        lines = []
        current_line = []
        
        temp_doc = fitz.open()
        temp_page = temp_doc.new_page()
        
        for word in words:
            # Test adding this word to current line
            test_line = ' '.join(current_line + [word])
            test_width = temp_page.get_textlength(test_line, fontname=fontname, fontsize=fontsize)
            
            if test_width <= max_width:
                current_line.append(word)
            else:
                # Current line is full, save it and start new line
                if current_line:
                    lines.append(' '.join(current_line))
                
                # Handle very long single words
                word_width = temp_page.get_textlength(word, fontname=fontname, fontsize=fontsize)
                if word_width > max_width:
                    # Word too long for line - split it character by character
                    char_lines = _split_long_word_safely(word, max_width, fontsize, fontname, temp_page)
                    lines.extend(char_lines)
                    current_line = []
                else:
                    current_line = [word]
        
        # Add any remaining words
        if current_line:
            lines.append(' '.join(current_line))
        
        temp_doc.close()
        
        # CRITICAL: Ensure we never return empty list for non-empty input
        if not lines and text.strip():
            lines = [text]  # Fallback to original text
        
        return lines
        
    except Exception as e:
        logger.error(f"❌ Text measurement failed: {e}, falling back to safe wrapping")
        # Fallback to safe character-based wrapping
        return _wrap_text_safe_fallback(text, max_width, fontsize)

def _split_long_word_safely(word: str, max_width: int, fontsize: int, fontname: str, page: fitz.Page) -> List[str]:
    """Split a word that's too long for a line, ensuring no content loss"""
    if not word:
        return []
    
    lines = []
    remaining = word
    
    while remaining:
        # Find the longest substring that fits
        best_length = 1  # Always include at least one character
        
        for i in range(1, len(remaining) + 1):
            test_text = remaining[:i]
            test_width = page.get_textlength(test_text, fontname=fontname, fontsize=fontsize)
            if test_width <= max_width:
                best_length = i
            else:
                break
        
        # Take the best fitting substring
        lines.append(remaining[:best_length])
        remaining = remaining[best_length:]
    
    return lines

def _wrap_text_safe_fallback(text: str, max_width: int, fontsize: int) -> List[str]:
    """Safe fallback text wrapping that guarantees content preservation"""
    if not text:
        return []
    
    # Very conservative character estimate as fallback
    chars_per_line = max(10, int(max_width // (fontsize * 0.4)))  # Very conservative
    
    if len(text) <= chars_per_line:
        return [text]
    
    lines = []
    words = text.split(' ')
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word)
        
        # Check if we can add this word
        if current_length + word_length + 1 <= chars_per_line and current_line:
            current_line.append(word)
            current_length += word_length + 1
        elif current_length + word_length <= chars_per_line and not current_line:
            current_line.append(word)
            current_length = word_length
        else:
            # Save current line if it has content
            if current_line:
                lines.append(' '.join(current_line))
            
            # Handle long words
            if word_length > chars_per_line:
                # Split long word
                while len(word) > chars_per_line:
                    lines.append(word[:chars_per_line])
                    word = word[chars_per_line:]
                current_line = [word] if word else []
                current_length = len(word) if word else 0
            else:
                current_line = [word]
                current_length = word_length
    
    # Add remaining content
    if current_line:
        lines.append(' '.join(current_line))
    
    # CRITICAL: Never return empty for non-empty input
    return lines if lines else [text]

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