/**
 * Supabase configuration and client setup
 * Handles authentication, database operations, and file storage
 */


import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Always use production instance
const SUPABASE_URL = 'https://rletapisdadphfdmqdxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZXRhcGlzZGFkcGhmZG1xZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTUzOTAsImV4cCI6MjA2OTY5MTM5MH0.oXw8UtxIQDSt-aWyHKEmX20DGYGrzcovoOtl5dOqVHA';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * User authentication functions
 */
export class AuthService {
    /**
     * Sign up user with email
     */
    static async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    /**
     * Sign in user with email
     */
    static async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    /**
     * Sign out user
     */
    static async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Get current user session
     */
    static async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    static async isAuthenticated() {
        const user = await this.getCurrentUser();
        return user !== null;
    }
}

/**
 * Database operations for user data and analysis results
 */
export class DatabaseService {
    /**
     * Save analysis result to database
     */
    static async saveAnalysisResult(userId, analysisData) {
        try {
            const { data, error } = await supabase
                .from('analysis_results')
                .insert({
                    user_id: userId,
                    original_score: analysisData.score,
                    analysis_data: analysisData,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Save analysis error:', error);
            throw error;
        }
    }

    /**
     * Get user's analysis history
     */
    static async getAnalysisHistory(userId) {
        try {
            const { data, error } = await supabase
                .from('analysis_results')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get analysis history error:', error);
            throw error;
        }
    }

    /**
     * Save payment record
     */
    static async savePaymentRecord(userId, paymentData) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert({
                    user_id: userId,
                    amount: paymentData.amount,
                    status: paymentData.status,
                    payment_method: paymentData.method,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Save payment error:', error);
            throw error;
        }
    }

    /**
     * Save user feedback
     */
    static async saveFeedback(userId, feedbackData) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .insert({
                    user_id: userId,
                    rating: feedbackData.rating,
                    comment: feedbackData.comment,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Save feedback error:', error);
            throw error;
        }
    }

    /**
     * Save job analysis to database
     */
    static async saveJobAnalysis(userId, jobAnalysisData) {
        try {
            console.log('📊 Saving job analysis to database...');
            
            const { data, error } = await supabase
                .from('job_analysis')
                .insert({
                    user_id: userId,
                    role_title: jobAnalysisData.role_title,
                    company_name: jobAnalysisData.company_name,
                    job_description: jobAnalysisData.job_description,
                    extracted_requirements: jobAnalysisData.extracted_requirements,
                    user_expectations: jobAnalysisData.user_expectations,
                    analysis_score: jobAnalysisData.analysis_score,
                    matching_keywords: jobAnalysisData.matching_keywords,
                    created_at: new Date().toISOString()
                });
            
            if (error) {
                console.error('❌ Job analysis save failed:', error);
                throw error;
            }
            
            console.log('✅ Job analysis saved successfully:', data);
            return data;
        } catch (error) {
            console.error('Job analysis save error:', error);
            throw error;
        }
    }

    /**
     * Log user activity for tracking and analytics
     */
    static async logActivity(userId, activityType, activityData = null) {
        try {
            // Get user info if userId not provided
            if (!userId) {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id || null; // Use null instead of 'anonymous' for UUID field
            }
            
            const activityRecord = {
                user_id: userId, // This will be null for anonymous users
                activity_type: activityType,
                activity_data: activityData,
                ip_address: null, // Will be handled by server-side if needed
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
            
            console.log('📊 Logging activity:', activityType, activityData);
            
            const { data, error } = await supabase
                .from('activity_logs')
                .insert(activityRecord);
            
            if (error) {
                console.error('❌ Activity logging failed:', error);
                // Don't throw error for activity logging - it shouldn't break user flow
                return null;
            }
            
            console.log('✅ Activity logged successfully:', activityType);
            return data;
        } catch (error) {
            console.error('Activity logging error:', error);
            // Don't throw error for activity logging - it shouldn't break user flow
            return null;
        }
    }
}

/**
 * File storage operations
 */
export class StorageService {
    /**
     * Upload file to Supabase storage
     */
    static async uploadFile(file, userId = null) {
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = userId ? `users/${userId}/${fileName}` : `uploads/${fileName}`;
            
            console.log('Uploading file:', fileName, 'to path:', filePath);
            console.log('File info:', { name: file.name, type: file.type, size: file.size });
            
            const { data, error } = await supabase.storage
                .from('resumes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (error) {
                console.error('❌ Upload failed:', error);
                throw new Error(`File upload failed: ${error.message}`);
            }
            
            console.log('✅ Upload successful:', data);
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath);
            
            console.log('📁 Public URL generated:', urlData.publicUrl);
            return urlData.publicUrl;
            
        } catch (error) {
            console.error('Upload file error:', error);
            throw error;
        }
    }

    /**
     * Delete file from storage
     */
    static async deleteFile(filePath) {
        try {
            const { error } = await supabase.storage
                .from('resumes')
                .remove([filePath]);
            
            if (error) throw error;
        } catch (error) {
            console.error('Delete file error:', error);
            throw error;
        }
    }

    /**
     * Get file URL
     */
    static getFileUrl(filePath) {
        const { data } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);
        
        return data.publicUrl;
    }
}

// Export default supabase client
export default supabase; 