/**
 * Optimization Results JavaScript
 * Handles display of job-optimized resume results
 */

import { supabase, DatabaseService } from './supabase.js';

// DOM Elements
const optimizedScore = document.getElementById('optimizedScore');
const originalAtsScore = document.getElementById('originalAtsScore');
const finalOptimizedScore = document.getElementById('finalOptimizedScore');
const totalImprovement = document.getElementById('totalImprovement');
const improvementMessage = document.getElementById('improvementMessage');
const keywordMatchRate = document.getElementById('keywordMatchRate');
const experienceAlignment = document.getElementById('experienceAlignment');
const matchedKeywords = document.getElementById('matchedKeywords');
const enhancedSkills = document.getElementById('enhancedSkills');
const downloadOptimizedBtn = document.getElementById('downloadOptimizedBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');
const optimizeAnotherJobBtn = document.getElementById('optimizeAnotherJobBtn');
const newResumeBtn = document.getElementById('newResumeBtn');

// Data storage
let jobAnalysisData = null;
let optimizationData = null;

/**
 * Initialize the optimization results page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Optimization results page initialized');
    
    loadOptimizationData();
    setupEventListeners();
});

/**
 * Load optimization data from session storage
 */
function loadOptimizationData() {
    try {
        // Load job analysis result
        const jobAnalysisResult = sessionStorage.getItem('jobAnalysisResult');
        if (jobAnalysisResult) {
            jobAnalysisData = JSON.parse(jobAnalysisResult);
            console.log('Job analysis data loaded:', jobAnalysisData);
        }
        
        // Load original resume analysis
        const originalAnalysis = sessionStorage.getItem('atsAnalysis');
        if (originalAnalysis) {
            const originalData = JSON.parse(originalAnalysis);
            console.log('Original ATS analysis loaded:', originalData);
            
            // Create mock optimization data based on job analysis
            optimizationData = generateOptimizationResults(originalData, jobAnalysisData);
        }
        
        // Display the results
        displayOptimizationResults();
        
    } catch (error) {
        console.error('Error loading optimization data:', error);
        showError('Failed to load optimization results.');
    }
}

/**
 * Generate mock optimization results based on job analysis
 */
function generateOptimizationResults(originalData, jobData) {
    const originalScore = originalData?.ats_score || originalData?.score || 65;
    const jobScore = jobData?.analysis_score || 85;
    
    // Calculate optimized score (combine original + job-specific improvements)
    const optimizedScore = Math.min(95, Math.max(85, originalScore + 25 + (jobScore - 75)));
    const improvement = optimizedScore - originalScore;
    
    return {
        original_score: originalScore,
        optimized_score: optimizedScore,
        improvement: improvement,
        keyword_match_rate: Math.min(98, 85 + Math.floor(Math.random() * 13)),
        experience_alignment: optimizedScore >= 90 ? 'Perfect' : optimizedScore >= 80 ? 'Excellent' : 'Good',
        matched_keywords: jobData?.matching_keywords || ['JavaScript', 'React', 'Node.js', 'API', 'Agile'],
        enhanced_skills: jobData?.priority_skills || ['Project Management', 'Team Leadership', 'Problem Solving'],
        job_info: {
            role_title: jobData?.basic_info?.role_title || 'Software Engineer',
            company_name: jobData?.basic_info?.company_name || 'Tech Company'
        }
    };
}

/**
 * Display optimization results
 */
function displayOptimizationResults() {
    if (!optimizationData) {
        console.warn('No optimization data to display');
        return;
    }
    
    // Update score displays
    if (optimizedScore) {
        optimizedScore.textContent = optimizationData.optimized_score;
    }
    
    if (originalAtsScore) {
        originalAtsScore.textContent = optimizationData.original_score;
    }
    
    if (finalOptimizedScore) {
        finalOptimizedScore.textContent = optimizationData.optimized_score;
    }
    
    if (totalImprovement) {
        totalImprovement.textContent = `+${optimizationData.improvement}`;
    }
    
    // Update improvement message
    if (improvementMessage) {
        const multiplier = Math.ceil(optimizationData.improvement / 5);
        improvementMessage.textContent = `That's ${multiplier}x more likely to get interviews!`;
    }
    
    // Update job-specific metrics
    if (keywordMatchRate) {
        keywordMatchRate.textContent = `${optimizationData.keyword_match_rate}%`;
    }
    
    if (experienceAlignment) {
        experienceAlignment.textContent = optimizationData.experience_alignment;
    }
    
    // Display matched keywords
    displayMatchedKeywords();
    
    // Display enhanced skills
    displayEnhancedSkills();
}

/**
 * Display matched keywords
 */
function displayMatchedKeywords() {
    if (!matchedKeywords || !optimizationData.matched_keywords) return;
    
    matchedKeywords.innerHTML = '';
    
    optimizationData.matched_keywords.slice(0, 5).forEach(keyword => {
        const keywordDiv = document.createElement('div');
        keywordDiv.className = 'bg-green-50 rounded-lg p-3 border-l-4 border-green-400';
        keywordDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-gray-800 font-medium">${keyword}</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Matched</span>
            </div>
        `;
        matchedKeywords.appendChild(keywordDiv);
    });
}

/**
 * Display enhanced skills
 */
function displayEnhancedSkills() {
    if (!enhancedSkills || !optimizationData.enhanced_skills) return;
    
    enhancedSkills.innerHTML = '';
    
    optimizationData.enhanced_skills.slice(0, 5).forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400';
        skillDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-gray-800 font-medium">${skill}</span>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">Enhanced</span>
            </div>
        `;
        enhancedSkills.appendChild(skillDiv);
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Download buttons
    if (downloadOptimizedBtn) {
        downloadOptimizedBtn.addEventListener('click', handleDownloadOptimized);
    }
    
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', handleDownloadReport);
    }
    
    // Navigation buttons
    if (optimizeAnotherJobBtn) {
        optimizeAnotherJobBtn.addEventListener('click', handleOptimizeAnotherJob);
    }
    
    if (newResumeBtn) {
        newResumeBtn.addEventListener('click', handleNewResume);
    }
}

/**
 * Handle download optimized resume
 */
function handleDownloadOptimized() {
    console.log('Downloading optimized resume...');
    
    // In a real implementation, this would download the actual optimized file
    // For now, show success message
    showSuccess('Your optimized resume download will be available soon! Check your email.');
    
    // Track download event
    trackEvent('optimized_resume_download', {
        job_title: optimizationData?.job_info?.role_title,
        company: optimizationData?.job_info?.company_name,
        optimized_score: optimizationData?.optimized_score
    });
}

/**
 * Handle download analysis report
 */
function handleDownloadReport() {
    console.log('Downloading analysis report...');
    
    // Generate and download a simple report
    generateAnalysisReport();
    
    // Track download event
    trackEvent('analysis_report_download', {
        job_title: optimizationData?.job_info?.role_title,
        original_score: optimizationData?.original_score,
        optimized_score: optimizationData?.optimized_score
    });
}

/**
 * Generate and download analysis report
 */
function generateAnalysisReport() {
    const reportContent = `
BestCVBuilder - Job Optimization Report
=====================================

Job Details:
- Role: ${optimizationData?.job_info?.role_title || 'N/A'}
- Company: ${optimizationData?.job_info?.company_name || 'N/A'}

Score Improvement:
- Original ATS Score: ${optimizationData?.original_score}/100
- Optimized Score: ${optimizationData?.optimized_score}/100
- Total Improvement: +${optimizationData?.improvement} points

Job Match Analysis:
- Keyword Match Rate: ${optimizationData?.keyword_match_rate}%
- Experience Alignment: ${optimizationData?.experience_alignment}

Matched Keywords:
${optimizationData?.matched_keywords?.map(k => `- ${k}`).join('\n') || '- N/A'}

Enhanced Skills:
${optimizationData?.enhanced_skills?.map(s => `- ${s}`).join('\n') || '- N/A'}

Generated by BestCVBuilder on ${new Date().toLocaleDateString()}
Visit bestcvbuilder.com for more optimizations
    `.trim();
    
    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimization-report-${Date.now()}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    showSuccess('Analysis report downloaded successfully!');
}

/**
 * Handle optimize for another job
 */
function handleOptimizeAnotherJob() {
    console.log('User wants to optimize for another job');
    
    // Clear job-specific data but keep original resume analysis
    sessionStorage.removeItem('jobAnalysisResult');
    sessionStorage.removeItem('jobInputData');
    
    // Navigate back to job input
    window.location.href = './job-input.html';
}

/**
 * Handle new resume analysis
 */
function handleNewResume() {
    console.log('User wants to analyze new resume');
    
    // Clear all session data
    sessionStorage.clear();
    
    // Navigate to home page
    window.location.href = './index.html';
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center';
    successDiv.innerHTML = `
        <span class="mr-2">✅</span>
        <div>
            <div class="font-bold">Success!</div>
            <div class="text-sm opacity-90">${message}</div>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `<span class="mr-2">❌</span> ${message}`;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Track user events
 */
function trackEvent(eventName, properties = {}) {
    try {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        console.log('Event tracked:', eventName, properties);
    } catch (error) {
        console.error('Error tracking event:', error);
    }
}

// Track page view
trackEvent('optimization_results_page_view', {
    page_title: 'Optimization Results',
    page_location: window.location.href
});