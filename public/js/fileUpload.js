/**
 * File upload module for handling resume uploads
 * Integrates with Supabase storage and provides progress tracking
 */

import { StorageService } from './supabase.js';

/**
 * Upload file to Supabase storage
 * @param {File} file - The file to upload
 * @param {string} userId - Optional user ID for organizing files
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadFile(file, userId = null) {
    try {
        console.log('Starting file upload:', file.name);
        
        // Validate file before upload
        if (!validateFile(file)) {
            throw new Error('Invalid file type or size');
        }
        
        // Upload to Supabase storage
        const fileUrl = await StorageService.uploadFile(file, userId);
        
        console.log('File uploaded successfully:', fileUrl);
        return fileUrl;
        
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @returns {boolean} Whether file is valid
 */
function validateFile(file) {
    // Check file type
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type);
        return false;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        console.error('File too large:', file.size);
        return false;
    }
    
    return true;
}

/**
 * Create a unique filename for upload
 * @param {string} originalName - Original filename
 * @param {string} userId - Optional user ID
 * @returns {string} Unique filename
 */
function createUniqueFilename(originalName, userId = null) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    
    const baseName = `${timestamp}_${randomString}`;
    const fileName = `${baseName}.${extension}`;
    
    return userId ? `users/${userId}/${fileName}` : `uploads/${fileName}`;
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename to extract extension from
 * @returns {string} File extension
 */
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

/**
 * Convert file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create upload progress tracker
 * @param {Function} onProgress - Progress callback function
 * @returns {Object} Progress tracker object
 */
export function createProgressTracker(onProgress) {
    return {
        update: (progress) => {
            if (onProgress && typeof onProgress === 'function') {
                onProgress(progress);
            }
        }
    };
}

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback
 * @param {string} userId - Optional user ID
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadFileWithProgress(file, onProgress, userId = null) {
    const progressTracker = createProgressTracker(onProgress);
    
    try {
        // Simulate progress updates (Supabase doesn't provide progress events)
        progressTracker.update(10);
        
        const fileUrl = await uploadFile(file, userId);
        
        progressTracker.update(100);
        return fileUrl;
        
    } catch (error) {
        console.error('Upload with progress failed:', error);
        throw error;
    }
}

/**
 * Batch upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {string} userId - Optional user ID
 * @returns {Promise<string[]>} Array of public URLs
 */
export async function uploadMultipleFiles(files, userId = null) {
    const uploadPromises = files.map(file => uploadFile(file, userId));
    
    try {
        const urls = await Promise.all(uploadPromises);
        console.log('Batch upload completed:', urls.length, 'files');
        return urls;
    } catch (error) {
        console.error('Batch upload failed:', error);
        throw error;
    }
}

/**
 * Delete uploaded file
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<void>}
 */
export async function deleteUploadedFile(filePath) {
    try {
        await StorageService.deleteFile(filePath);
        console.log('File deleted:', filePath);
    } catch (error) {
        console.error('File deletion failed:', error);
        throw error;
    }
}

/**
 * Get file info for display
 * @param {File} file - File to get info for
 * @returns {Object} File information object
 */
export function getFileInfo(file) {
    return {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        extension: getFileExtension(file.name),
        lastModified: new Date(file.lastModified).toLocaleDateString()
    };
} 