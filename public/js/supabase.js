/**
 * Supabase configuration and client setup
 * Handles authentication, database operations, and file storage
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// TODO: Replace with your actual Supabase URL and publishable key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_PUBLISHABLE_KEY = 'YOUR_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

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
            
            const { data, error } = await supabase.storage
                .from('resumes')
                .upload(filePath, file);
            
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath);
            
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