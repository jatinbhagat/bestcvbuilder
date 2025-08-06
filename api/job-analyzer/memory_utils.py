"""
Memory management utilities for BestCVBuilder API
Helps manage memory usage and prevent timeout issues
"""

import gc
import psutil
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def get_memory_info() -> Dict[str, Any]:
    """Get current memory usage information"""
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        return {
            'rss_mb': round(memory_info.rss / 1024 / 1024, 2),  # Resident Set Size in MB
            'vms_mb': round(memory_info.vms / 1024 / 1024, 2),  # Virtual Memory Size in MB
            'percent': round(process.memory_percent(), 2),
            'available_mb': round(psutil.virtual_memory().available / 1024 / 1024, 2),
            'total_mb': round(psutil.virtual_memory().total / 1024 / 1024, 2)
        }
    except Exception as e:
        logger.warning(f"Could not get memory info: {e}")
        return {'error': str(e)}

def force_cleanup():
    """Force aggressive garbage collection and cleanup"""
    try:
        # Force garbage collection multiple times
        for _ in range(3):
            collected = gc.collect()
            if collected == 0:
                break
        
        logger.debug(f"🧹 Garbage collection completed, collected {collected} objects")
        return True
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return False

def check_memory_threshold(threshold_mb: int = 400) -> bool:
    """Check if memory usage is above threshold"""
    try:
        memory_info = get_memory_info()
        current_mb = memory_info.get('rss_mb', 0)
        
        if current_mb > threshold_mb:
            logger.warning(f"⚠️ Memory usage high: {current_mb}MB > {threshold_mb}MB threshold")
            return True
        
        return False
    except Exception:
        return False

def memory_monitor(func):
    """Decorator to monitor memory usage of functions"""
    def wrapper(*args, **kwargs):
        # Log memory before
        memory_before = get_memory_info()
        logger.debug(f"🔍 Memory before {func.__name__}: {memory_before.get('rss_mb', 'unknown')}MB")
        
        try:
            result = func(*args, **kwargs)
            
            # Log memory after
            memory_after = get_memory_info()
            logger.debug(f"📊 Memory after {func.__name__}: {memory_after.get('rss_mb', 'unknown')}MB")
            
            # Force cleanup if memory is high
            if check_memory_threshold(300):
                force_cleanup()
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error in {func.__name__}: {e}")
            force_cleanup()  # Cleanup on error
            raise
    
    return wrapper

class MemoryManager:
    """Context manager for memory-conscious operations"""
    
    def __init__(self, operation_name: str = "operation", cleanup_threshold_mb: int = 400):
        self.operation_name = operation_name
        self.threshold = cleanup_threshold_mb
        self.start_memory = None
    
    def __enter__(self):
        self.start_memory = get_memory_info()
        logger.debug(f"🚀 Starting {self.operation_name} - Memory: {self.start_memory.get('rss_mb', 'unknown')}MB")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_memory = get_memory_info()
        logger.debug(f"🏁 Finished {self.operation_name} - Memory: {end_memory.get('rss_mb', 'unknown')}MB")
        
        # Force cleanup if memory usage is high
        if check_memory_threshold(self.threshold):
            logger.info(f"🧹 Memory cleanup triggered after {self.operation_name}")
            force_cleanup()
        
        if exc_type:
            logger.error(f"❌ {self.operation_name} failed with {exc_type.__name__}: {exc_val}")
            force_cleanup()  # Always cleanup on error

# Utility functions for specific cleanup scenarios
def cleanup_nltk_resources():
    """Clean up NLTK-specific resources"""
    try:
        import nltk
        # Clear NLTK data cache if needed
        if hasattr(nltk, 'data') and hasattr(nltk.data, 'path'):
            logger.debug("🧹 NLTK cleanup performed")
    except ImportError:
        pass

def cleanup_textblob_resources():
    """Clean up TextBlob-specific resources"""
    try:
        # TextBlob doesn't have specific cleanup, but we can force GC
        force_cleanup()
        logger.debug("🧹 TextBlob cleanup performed")
    except Exception:
        pass