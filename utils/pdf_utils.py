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
                       improved_text: str, text_blocks: List[TextBlock]) -> bytes:
        """
        Replace text in PDF while preserving layout and formatting
        
        Args:
            pdf_bytes: Original PDF bytes
            original_text: Original extracted text
            improved_text: Improved text to replace with
            text_blocks: List of text blocks from layout parsing
            
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
        """Replace text in a specific block while preserving formatting"""
        try:
            page = doc[text_block.page_num]
            
            # Find and remove original text
            text_instances = page.search_for(text_block.text)
            
            for inst in text_instances:
                # Check if this instance matches our block position
                if self._bbox_overlap(inst, text_block.bbox) > 0.8:
                    # Add a white rectangle to cover the old text
                    page.add_redact_annot(inst)
                    
                    # Insert new text with preserved formatting
                    page.insert_text(
                        point=(inst.x0, inst.y1 - 2),  # Slightly above baseline
                        text=replacement_text,
                        fontsize=text_block.size,
                        color=(0, 0, 0),  # Black text
                        fontname=text_block.font
                    )
                    break
            
            # Apply redactions (removes old text)
            page.apply_redactions()
            
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
                   layout_info: Dict[str, Any]) -> bytes:
    """
    Main function to update PDF text while preserving formatting
    
    Args:
        pdf_bytes: Original PDF bytes
        original_text: Original text content
        improved_text: Improved text to replace with
        layout_info: Layout information from parse_pdf_layout
        
    Returns:
        Updated PDF as bytes
    """
    replacer = PDFTextReplacer()
    return replacer.update_pdf_text(
        pdf_bytes, original_text, improved_text, layout_info["text_blocks"]
    )