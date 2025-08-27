/**
 * Results page JavaScript for displaying ATS analysis results
 * Handles score display, upgrade flow, and user interactions
 * Updated with sidebar layout to match screenshot design
 * DEBUG VERSION - Professional Summary scoring debug enabled - Aug 16, 2025
 */

console.log('🚀 PROFESSIONAL SUMMARY DEBUG VERSION LOADED');
console.log('🚀 This version has comprehensive debugging for Professional Summary scoring');

import { supabase, DatabaseService } from './supabase.js';
import { getScoreDescription, getImprovementSuggestions, calculatePotentialImprovement } from './atsAnalysis.js';

// DOM Elements - Enhanced for new sidebar UI
const atsScore = document.getElementById('atsScore');
const scoreCircle = document.getElementById('scoreCircle');
const markedAsDone = document.getElementById('markedAsDone');
const topFixesList = document.getElementById('topFixesList');
const completedList = document.getElementById('completedList');
const issuesList = document.getElementById('issuesList');
const strengthsList = document.getElementById('strengthsList');
const strengthsSection = document.getElementById('strengthsSection');
const upgradeBtn = document.getElementById('upgradeBtn');

// Analysis data from session storage
let analysisData = null;
let allIssues = [];

// Config data loaded from JSON files
let skillsBuzzwordsConfig = null;
let actionVerbsConfig = null;

/**
 * Initialize the results page with new sidebar design
 */
async function init() {
    console.log('🚀 DEBUG: Starting result.js initialization...');
    
    // Show loading screen immediately
    showLoadingScreen();
    updateLoadingProgress(10, 'Starting results preparation...');
    
    try {
        console.log('🔍 DEBUG: Step 1 - Loading analysis data from session storage...');
        updateLoadingProgress(25, 'Loading analysis data...');
        
        // Load analysis data from session storage
        const storedData = sessionStorage.getItem('atsAnalysis');
        if (!storedData) {
            console.error('❌ DEBUG: No analysis data found in session storage');
            console.log('🔍 DEBUG: Available session storage keys:', Object.keys(sessionStorage));
            window.location.href = './index.html';
            return;
        }

        console.log('✅ DEBUG: Step 1 Complete - Found stored data, length:', storedData.length);
        
        console.log('🔍 DEBUG: Step 2 - Parsing JSON data...');
        analysisData = JSON.parse(storedData);
        console.log('✅ DEBUG: Step 2 Complete - Analysis data loaded:', {
            hasScore: !!analysisData.score,
            score: analysisData.score,
            hasContent: !!analysisData.content,
            contentLength: analysisData.content?.length || 0,
            keys: Object.keys(analysisData)
        });

        console.log('🔍 DEBUG: Step 3 - Loading config files...');
        updateLoadingProgress(40, 'Loading configuration files...');
        await loadConfigs();
        console.log('✅ DEBUG: Step 3 Complete - Config files loaded');

        console.log('🔍 DEBUG: Step 4 - Displaying overall score...');
        updateLoadingProgress(60, 'Calculating ATS scores...');
        displayOverallScore(analysisData);
        console.log('✅ DEBUG: Step 4 Complete - Overall score displayed');
        
        console.log('🔍 DEBUG: Step 5 - Displaying sidebar categories...');
        updateLoadingProgress(75, 'Organizing analysis categories...');
        const categoryData = displaySidebarCategories(analysisData);
        console.log('✅ DEBUG: Step 5 Complete - Sidebar categories displayed');
        
        console.log('🔍 DEBUG: Step 6 - Displaying main issues list...');
        updateLoadingProgress(85, 'Preparing improvement suggestions...');
        displayMainIssuesList(analysisData, categoryData);
        console.log('✅ DEBUG: Step 6 Complete - Main issues list displayed');
        
        console.log('🔍 DEBUG: Step 7 - Displaying strengths...');
        updateLoadingProgress(95, 'Finalizing results display...');
        displayStrengths(analysisData);
        console.log('✅ DEBUG: Step 7 Complete - Strengths displayed');
        
        console.log('🔍 DEBUG: Step 8 - Setting up event handlers...');
        setupEventHandlers();
        console.log('✅ DEBUG: Step 8 Complete - Event handlers setup');
        
        console.log('🎉 DEBUG: All initialization steps completed successfully!');
        
        // Final progress update before showing content
        updateLoadingProgress(100, 'Ready! Displaying your results...');
        
        // Small delay to show 100% completion
        setTimeout(() => {
            hideLoadingScreen();
        }, 500);

    } catch (error) {
        console.error('❌ DEBUG: Error in initialization step:', error);
        console.error('❌ DEBUG: Full error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        // DON'T redirect - just show what we can
        displayFallbackResults();
        // Always hide loading screen, even on error
        hideLoadingScreen();
    }
}

/**
 * Display fallback results if there are any errors
 */
function displayFallbackResults() {
    console.log('Displaying fallback results...');
    
    // At minimum, show the score if we have analysis data
    if (analysisData && atsScore) {
        atsScore.textContent = Math.round(analysisData.score || 75);
        
        // Set simple score circle color
        if (scoreCircle) {
            const score = analysisData.score || 75;
            if (score >= 80) {
                scoreCircle.style.borderColor = '#10b981'; // green
            } else if (score >= 60) {
                scoreCircle.style.borderColor = '#f59e0b'; // orange  
            } else {
                scoreCircle.style.borderColor = '#ef4444'; // red
            }
        }
    }
    
    // Show a simple message in the main content area
    if (issuesList) {
        issuesList.innerHTML = `
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <h3 class="text-xl font-bold text-blue-900 mb-2">Analysis Complete!</h3>
                <p class="text-blue-700">Your resume has been analyzed. Click the button below to get your optimized version.</p>
            </div>
        `;
    }
}

/**
 * Load configuration files
 */
async function loadConfigs() {
    console.log('🔧 DEBUG: Starting config file loading...');
    
    try {
        console.log('🔧 DEBUG: Config Step 1 - Loading skills-buzzwords.json...');
        
        // Load skills-buzzwords.json
        const skillsResponse = await fetch('./config/skills-buzzwords.json');
        console.log('🔧 DEBUG: Skills response status:', skillsResponse.status, skillsResponse.statusText);
        
        if (skillsResponse.ok) {
            skillsBuzzwordsConfig = await skillsResponse.json();
            console.log('✅ DEBUG: Skills-buzzwords config loaded successfully:', {
                hasConfig: !!skillsBuzzwordsConfig,
                keys: skillsBuzzwordsConfig ? Object.keys(skillsBuzzwordsConfig) : []
            });
        } else {
            console.warn('⚠️ DEBUG: Failed to load skills-buzzwords.json - Status:', skillsResponse.status);
        }
        
        console.log('🔧 DEBUG: Config Step 2 - Loading action-verbs.json...');
        
        // Load action-verbs.json  
        const verbsResponse = await fetch('./config/action-verbs.json');
        console.log('🔧 DEBUG: Verbs response status:', verbsResponse.status, verbsResponse.statusText);
        
        if (verbsResponse.ok) {
            actionVerbsConfig = await verbsResponse.json();
            window.actionVerbsConfig = actionVerbsConfig; // Make it globally available
            console.log('✅ DEBUG: Action-verbs config loaded successfully:', {
                hasConfig: !!actionVerbsConfig,
                keys: actionVerbsConfig ? Object.keys(actionVerbsConfig) : []
            });
        } else {
            console.warn('⚠️ DEBUG: Failed to load action-verbs.json - Status:', verbsResponse.status);
        }
        
        console.log('🔧 DEBUG: Config loading completed');
        
    } catch (error) {
        console.error('❌ DEBUG: Error loading config files:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

/**
 * Generate exactly 21 ATS categories based on real analysis data
 */
function generateAll23Categories(data) {
    console.log('🏗️ DEBUG: Starting generateAll23Categories with data:', {
        hasData: !!data,
        hasContent: !!(data?.content),
        hasText: !!(data?.text),
        contentLength: data?.content?.length || 0,
        textLength: data?.text?.length || 0
    });
    
    const resumeText = data.content || data.text || "";
    console.log('🏗️ DEBUG: Resume text extracted, length:', resumeText.length);
    
    if (!resumeText) {
        console.warn('⚠️ DEBUG: No resume text found, using fallback');
    }
    
    const categories = [];
    console.log('🏗️ DEBUG: Starting category generation...');
    
    // 1. Contact Information
    categories.push({
        name: 'Contact Information',
        score: analyzeContactDetails(resumeText),
        issue: 'Complete contact details with phone, email, LinkedIn',
        impact: 'SECTIONS'
    });
    
    // 2. Professional Summary
    categories.push({
        name: 'Professional Summary',
        score: analyzeSummarySection(resumeText),
        issue: 'Add compelling professional summary section',
        impact: 'SECTIONS'
    });
    
    // 3. Work Experience
    categories.push({
        name: 'Work Experience',
        score: analyzeWorkExperience(resumeText),
        issue: 'Improve work experience descriptions',
        impact: 'SECTIONS'
    });
    
    // 4. Education Section
    categories.push({
        name: 'Education Section',
        score: analyzeEducationSection(resumeText),
        issue: 'Complete education details',
        impact: 'SECTIONS'
    });
    
    // 5. Skills Section
    categories.push({
        name: 'Skills Section',
        score: analyzeSkillsSectionSimple(resumeText),
        issue: 'Add relevant technical skills',
        impact: 'KEYWORDS'
    });
    
    // 6. Keywords Optimization
    categories.push({
        name: 'Keywords Optimization',
        score: analyzeKeywords(resumeText),
        issue: 'Include industry-specific keywords',
        impact: 'KEYWORDS'
    });
    
    // 7. Action Verbs
    categories.push({
        name: 'Action Verbs',
        score: analyzeActionVerbs(resumeText),
        issue: 'Use strong action verbs',
        impact: 'LANGUAGE'
    });
    
    // 8. Quantifiable Achievements
    categories.push({
        name: 'Quantifiable Achievements',
        score: analyzeQuantifiableAchievements(resumeText),
        issue: 'Add measurable accomplishments',
        impact: 'IMPACT'
    });
    
    // 9. Grammar & Spelling
    categories.push({
        name: 'Grammar & Spelling',
        score: analyzeGrammar(resumeText),
        issue: 'Fix grammar and spelling errors',
        impact: 'QUALITY'
    });
    
    // 10. Formatting & Layout
    categories.push({
        name: 'Formatting & Layout',
        score: analyzeFormatting(resumeText),
        issue: 'Improve document formatting',
        impact: 'FORMAT'
    });
    
    // 11. Resume Length
    categories.push({
        name: 'Resume Length',
        score: analyzeResumeLength(resumeText),
        issue: 'Optimize resume length',
        impact: 'FORMAT'
    });
    
    // 12. Section Headers
    categories.push({
        name: 'Section Headers',
        score: analyzeSectionHeaders(resumeText),
        issue: 'Use clear section headers',
        impact: 'STRUCTURE'
    });
    
    // 13. Use of Bullets
    categories.push({
        name: 'Use of Bullets',
        score: analyzeBulletUsage(resumeText),
        issue: 'Use bullet points instead of paragraphs',
        impact: 'READABILITY'
    });
    
    // 14. Job Titles
    categories.push({
        name: 'Job Titles',
        score: analyzeJobTitles(resumeText),
        issue: 'Clear and consistent job titles',
        impact: 'STRUCTURE'
    });
    
    // 15. Company Names
    categories.push({
        name: 'Company Names',
        score: analyzeCompanyNames(resumeText),
        issue: 'Include recognizable company names',
        impact: 'CREDIBILITY'
    });
    
    // 16. Dates & Duration - REMOVED (now handled by backend)
    
    // 17. Certifications
    categories.push({
        name: 'Certifications',
        score: analyzeCertifications(resumeText),
        issue: 'Add relevant certifications',
        impact: 'CREDENTIALS'
    });
    
    // 18. Industry Buzzwords
    categories.push({
        name: 'Industry Buzzwords',
        score: analyzeIndustryBuzzwords(resumeText),
        issue: 'Include industry-specific terms',
        impact: 'RELEVANCE'
    });
    
    // 19. ATS Compatibility
    categories.push({
        name: 'ATS Compatibility',
        score: analyzeATSCompatibility(resumeText),
        issue: 'Improve ATS readability',
        impact: 'TECHNICAL'
    });
    
    // 20. White Space & Design
    categories.push({
        name: 'White Space & Design',
        score: analyzeWhiteSpace(resumeText),
        issue: 'Optimize visual layout',
        impact: 'READABILITY'
    });
    
    // 21. Personal Pronouns
    try {
        console.log('🏗️ DEBUG: Analyzing Personal Pronouns...');
        const pronounScore = analyzePersonalPronouns(resumeText);
        console.log('🏗️ DEBUG: Personal Pronouns score:', pronounScore);
        categories.push({
            name: 'Personal Pronouns',
            score: pronounScore,
            issue: 'Remove personal pronouns (I, me, we)',
            impact: 'LANGUAGE'
        });
    } catch (error) {
        console.error('❌ DEBUG: Error in Personal Pronouns analysis:', error);
        categories.push({
            name: 'Personal Pronouns',
            score: 5, // fallback score
            issue: 'Remove personal pronouns (I, me, we)',
            impact: 'LANGUAGE'
        });
    }
    
    // 22. Dates Format & Chronology - REMOVED (now handled by backend)
    
    // 23. Action Verb Repetition
    try {
        console.log('🏗️ DEBUG: Analyzing Repetition...');
        const repetitionScore = analyzeRepetition(resumeText);
        console.log('🏗️ DEBUG: Repetition score:', repetitionScore);
        categories.push({
            name: 'Action Verb Repetition',
            score: repetitionScore,
            issue: 'Avoid repeating the same action verbs',
            impact: 'LANGUAGE'
        });
    } catch (error) {
        console.error('❌ DEBUG: Error in Repetition analysis:', error);
        categories.push({
            name: 'Action Verb Repetition',
            score: 5, // fallback score
            issue: 'Avoid repeating the same action verbs',
            impact: 'LANGUAGE'
        });
    }
    
    console.log('🏗️ DEBUG: Category generation completed, returning', categories.length, 'categories');
    console.log('🏗️ DEBUG: Final categories:', categories.map(cat => ({ name: cat.name, score: cat.score })));
    
    return categories;
}

// Simple analyzer functions for missing categories
function analyzeWorkExperience(resumeText) {
    const hasExperience = /experience|work|job|position|role/i.test(resumeText);
    const hasAchievements = /achieved|accomplished|increased|improved|led|managed/i.test(resumeText);
    return hasExperience && hasAchievements ? 8 : hasExperience ? 6 : 3;
}

function analyzeSkillsSectionSimple(resumeText) {
    const hasSkillsSection = /skills|technical|technologies|tools/i.test(resumeText);
    return hasSkillsSection ? 8 : 4;
}

function analyzeKeywords(resumeText) {
    const wordCount = resumeText.split(' ').length;
    return wordCount > 200 ? 7 : wordCount > 100 ? 5 : 3;
}

function analyzeActionVerbs(resumeText) {
    let score = 10; // Start with perfect score
    
    // Get all strong verb categories (excluding WEAK_VERBS)
    const strongVerbCategories = [
        'STRONG_ACCOMPLISHMENT_DRIVEN_VERBS',
        'ENTREPRENEURIAL_SKILLS', 
        'MANAGEMENT_SKILLS',
        'LEADERSHIP_MENTORSHIP_AND_TEACHING_SKILLS',
        'PROBLEM_SOLVING_SKILLS',
        'COMMUNICATION_SKILLS',
        'RESEARCH_AND_ANALYSIS_SKILLS',
        'PROCESS_IMPROVEMENT_CONSULTING_AND_OPERATIONS',
        'FINANCIAL_SKILLS',
        'DESIGN_AND_CREATIVE_SKILLS',
        'ENGINEERING_TECHNICAL_ROLES',
        'TEAMWORK_COLLABORATION_SKILLS'
    ];
    
    // Find all action verbs used in resume
    const foundVerbs = extractActionVerbsFromText(resumeText);
    
    if (foundVerbs.length === 0) {
        return 3; // No action verbs found - poor score
    }
    
    // Categorize found verbs - try with fallback
    let categorizedVerbs = {};
    let weakVerbs = [];
    
    console.log('🔍 ACTION VERBS: Starting categorization...');
    console.log('🔍 ACTION VERBS: ActionVerbs module available:', !!(window.ActionVerbs && window.ActionVerbs.getVerbsForCategory));
    console.log('🔍 ACTION VERBS: actionVerbsConfig available:', !!window.actionVerbsConfig);
    console.log('🔍 ACTION VERBS: actionVerbsConfig content check:', window.actionVerbsConfig ? Object.keys(window.actionVerbsConfig).slice(0, 3) : 'null');
    
    if (window.ActionVerbs && window.ActionVerbs.getVerbsForCategory) {
        console.log('🔍 ACTION VERBS: Using ActionVerbs module');
        categorizedVerbs = categorizeFoundVerbs(foundVerbs, strongVerbCategories);
        weakVerbs = window.ActionVerbs.getVerbsForCategory('WEAK_VERBS');
    } else if (window.actionVerbsConfig) {
        console.log('🔍 ACTION VERBS: Using actionVerbsConfig from JSON file');
        categorizedVerbs = categorizeFoundVerbsWithConfig(foundVerbs, strongVerbCategories);
        weakVerbs = window.actionVerbsConfig.WEAK_VERBS || [];
    } else {
        console.log('🔍 ACTION VERBS: No ActionVerbs module or config available, using basic fallback');
        // Use basic classification for common strong verbs
        categorizedVerbs = categorizeFoundVerbsFallback(foundVerbs);
        weakVerbs = ['responsible', 'involved', 'participated', 'helped', 'assisted'];
    }
    
    // Count categories represented
    const categoriesUsed = Object.keys(categorizedVerbs).length;
    console.log('🔍 ACTION VERBS: Categories used:', categoriesUsed);
    console.log('🔍 ACTION VERBS: Categorized verbs:', categorizedVerbs);
    
    // Apply category diversity penalty
    if (categoriesUsed < 5) {
        const originalScore = score;
        if (categoriesUsed === 4) score -= 1;
        else if (categoriesUsed === 3) score -= 2;
        else if (categoriesUsed === 2) score -= 3;
        else if (categoriesUsed === 1) score -= 4;
        else score -= 5; // 0 categories
        console.log('🔍 ACTION VERBS: Category diversity penalty applied. Score changed from', originalScore, 'to', score);
    } else {
        console.log('🔍 ACTION VERBS: No category diversity penalty (used', categoriesUsed, 'categories)');
    }
    
    // Count weak verbs and unknown verbs
    let weakVerbCount = 0;
    let unknownVerbCount = 0;
    
    for (const verb of foundVerbs) {
        const isWeak = weakVerbs.some(weakVerb => 
            verb.toLowerCase().includes(weakVerb.toLowerCase()) ||
            weakVerb.toLowerCase().includes(verb.toLowerCase())
        );
        
        if (isWeak) {
            weakVerbCount++;
        } else {
            // Check if verb is in any strong category using the same fallback approach
            let isInStrongCategory = false;
            
            if (window.ActionVerbs && window.ActionVerbs.getVerbsForCategory) {
                isInStrongCategory = strongVerbCategories.some(category => {
                    const categoryVerbs = window.ActionVerbs.getVerbsForCategory(category);
                    return categoryVerbs.some(strongVerb => 
                        strongVerb.toLowerCase() === verb.toLowerCase() ||
                        strongVerb.toLowerCase().includes(verb.toLowerCase())
                    );
                });
            } else if (window.actionVerbsConfig) {
                isInStrongCategory = strongVerbCategories.some(category => {
                    const categoryVerbs = window.actionVerbsConfig[category] || [];
                    return categoryVerbs.some(strongVerb => 
                        strongVerb.toLowerCase() === verb.toLowerCase() ||
                        strongVerb.toLowerCase().includes(verb.toLowerCase())
                    );
                });
            } else {
                // Use basic fallback - check against basic strong verbs (comprehensive list)
                const basicStrongVerbs = [
                    'managed', 'led', 'supervised', 'coordinated', 'directed', 'guided', 'oversaw',
                    'spearheaded', 'championed', 'mentored', 'coached', 'launched', 'pioneered',
                    'initiated', 'founded', 'established', 'created', 'built', 'developed',
                    'engineered', 'programmed', 'designed', 'implemented', 'achieved', 'delivered',
                    'executed', 'accomplished', 'completed', 'optimized', 'streamlined', 'improved',
                    'enhanced', 'revamped', 'budgeted', 'forecasted', 'analyzed', 'calculated',
                    'scaled', 'boosted', 'drove', 'conceived', 'orchestrated',
                    // Additional strong verbs from resume
                    'conceptualized', 'record', 'design', 'increase', 'boost', 'program', 
                    'develop', 'scale', 'build', 'engineer', 'generated', 'facilitated',
                    'organized', 'produced', 'supported', 'collaborated', 'negotiated',
                    'presented', 'resolved', 'transformed', 'upgraded', 'maintained',
                    'monitored', 'recruited', 'evaluated', 'assessed', 'identified',
                    'researched', 'tested', 'reviewed', 'processed', 'handled'
                ];
                isInStrongCategory = basicStrongVerbs.includes(verb.toLowerCase());
            }
            
            if (!isInStrongCategory) {
                unknownVerbCount++;
            }
        }
    }
    
    // Apply penalties for weak and unknown verbs
    const penaltyScore = weakVerbCount + unknownVerbCount;
    console.log('🔍 ACTION VERBS: Weak verb count:', weakVerbCount);
    console.log('🔍 ACTION VERBS: Unknown verb count:', unknownVerbCount);
    console.log('🔍 ACTION VERBS: Total penalty:', penaltyScore);
    console.log('🔍 ACTION VERBS: Score before penalty:', score);
    
    score -= penaltyScore; // -1 per weak/unknown verb
    console.log('🔍 ACTION VERBS: Score after penalty:', score);
    
    const finalScore = Math.max(Math.min(score, 10), 0);
    console.log('🔍 ACTION VERBS: Final score (clamped 0-10):', finalScore);
    
    return finalScore;
}

function analyzeQuantifiableAchievements(resumeText) {
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Starting analysis...');
    
    // Extract Professional Experience section
    const experienceSection = extractExperienceSection(resumeText);
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Experience section found:', !!experienceSection);
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Experience section length:', experienceSection ? experienceSection.length : 0);
    
    if (!experienceSection) {
        console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: No experience section found, returning score 1');
        return 1; // No experience section found
    }
    
    // Extract all bullet points/responsibilities from experience section
    const allPoints = extractExperiencePoints(experienceSection);
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Total points extracted:', allPoints.length);
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: All points:', allPoints);
    
    if (allPoints.length === 0) {
        console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: No points found in experience section, returning score 1');
        return 1; // No points found in experience section
    }
    
    // Count quantified points
    const quantifiedPoints = allPoints.filter(point => hasQuantifiableData(point));
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Quantified points found:', quantifiedPoints.length);
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Quantified points:', quantifiedPoints);
    
    // Calculate percentage: y = (100 * Quantified Points / Total Points)%
    const y = (quantifiedPoints.length / allPoints.length) * 100;
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Percentage of quantified points:', y.toFixed(1) + '%');
    
    // Score based on percentage
    let score;
    if (y > 90) score = 10;
    else if (y > 80) score = 9;
    else if (y > 70) score = 8;
    else if (y > 60) score = 7;
    else if (y > 50) score = 6;
    else if (y > 40) score = 5;
    else if (y > 30) score = 4;
    else if (y > 20) score = 3;
    else if (y > 10) score = 2;
    else score = 1;
    
    console.log('🔍 QUANTIFIABLE ACHIEVEMENTS: Final score:', score);
    return score;
}

// Extract Professional Experience section from resume
function extractExperienceSection(resumeText) {
    console.log('🔍 EXPERIENCE EXTRACTION: Starting experience section extraction...');
    const text = resumeText.toLowerCase();
    
    // Experience section headers - prioritize more specific ones first
    const experienceHeaders = [
        'professional experience', 'work experience', 'employment history', 
        'career history', 'work history', 'experience'
    ];
    
    // Other section headers that mark end of experience
    const otherHeaders = [
        'education', 'academic background', 'qualifications',
        'skills', 'technical skills', 'core skills', 'key skills',
        'projects', 'personal projects', 'key projects',
        'certifications', 'certificates', 'licenses',
        'awards', 'achievements', 'honors',
        'references', 'contact', 'additional information'
    ];
    
    // Find experience section start - look for headers as section headers (likely at start of line)
    let experienceStart = -1;
    for (let header of experienceHeaders) {
        // Look for the header at the start of a line (after newline or at beginning)
        const headerPattern = new RegExp('(^|\\n)\\s*' + header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*($|\\n)', 'i');
        const match = text.match(headerPattern);
        if (match) {
            experienceStart = match.index + (match[1] ? match[1].length : 0);
            console.log('🔍 EXPERIENCE EXTRACTION: Found experience header:', header, 'at position:', experienceStart);
            break;
        }
    }
    
    if (experienceStart === -1) {
        // No clear experience header, try to find job-like content
        const jobIndicators = ['developer', 'manager', 'analyst', 'engineer', 'coordinator', 'specialist', 'consultant', 'director', 'associate'];
        for (let indicator of jobIndicators) {
            const index = text.indexOf(indicator);
            if (index !== -1) {
                experienceStart = Math.max(0, index - 50); // Start a bit before the job title
                break;
            }
        }
    }
    
    if (experienceStart === -1) return null;
    
    // Find experience section end
    let experienceEnd = resumeText.length;
    for (let header of otherHeaders) {
        const index = text.indexOf(header, experienceStart);
        if (index !== -1 && index > experienceStart) {
            experienceEnd = Math.min(experienceEnd, index);
        }
    }
    
    return resumeText.substring(experienceStart, experienceEnd);
}

// Extract individual points from experience section
function extractExperiencePoints(experienceText) {
    console.log('🔍 EXPERIENCE POINTS: Starting point extraction...');
    console.log('🔍 EXPERIENCE POINTS: Input text length:', experienceText.length);
    
    const lines = experienceText.split('\n');
    console.log('🔍 EXPERIENCE POINTS: Total lines to process:', lines.length);
    
    const points = [];
    let currentPoint = '';
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
            // Empty line - if we have a current point, save it
            if (currentPoint.trim()) {
                points.push(currentPoint.trim());
                currentPoint = '';
            }
            continue;
        }
        
        console.log(`🔍 EXPERIENCE POINTS: Processing line ${i}: "${line}"`);
        
        // Skip job titles, company names, dates
        if (isJobTitleOrCompany(line)) {
            console.log(`🔍 EXPERIENCE POINTS: Skipping job title/company: "${line}"`);
            continue;
        }
        
        // Check if this starts a new bullet point or responsibility
        if (isBulletPoint(line) || isResponsibilityPoint(line)) {
            // Save previous point if exists
            if (currentPoint.trim()) {
                points.push(currentPoint.trim());
                console.log(`🔍 EXPERIENCE POINTS: Saved previous point: "${currentPoint.trim()}"`);
            }
            // Start new point
            currentPoint = line;
            console.log(`🔍 EXPERIENCE POINTS: Started new point: "${line}"`);
        } else if (currentPoint) {
            // Continuation of current point
            currentPoint += ' ' + line;
            console.log(`🔍 EXPERIENCE POINTS: Extended current point: "${line}"`);
        } else {
            // Standalone responsibility line
            points.push(line);
            console.log(`🔍 EXPERIENCE POINTS: Added standalone point: "${line}"`);
        }
    }
    
    // Don't forget the last point
    if (currentPoint.trim()) {
        points.push(currentPoint.trim());
        console.log(`🔍 EXPERIENCE POINTS: Saved final point: "${currentPoint.trim()}"`);
    }
    
    console.log('🔍 EXPERIENCE POINTS: Final extracted points:', points.length);
    console.log('🔍 EXPERIENCE POINTS: Points preview:', points.slice(0, 3));
    
    return points;
}

// Check if line is a job title or company name (should be excluded)
function isJobTitleOrCompany(line) {
    const jobTitlePatterns = [
        /^[A-Z][a-z\s]+(?:Developer|Manager|Analyst|Engineer|Coordinator|Specialist|Consultant|Director|Associate)$/i,
        /\b(Inc\.|Corp\.|Ltd\.|LLC|Company|Corporation)\b/i,
        /^\d{4}\s*[-–]\s*\d{4}|\d{4}\s*[-–]\s*Present/i, // Date ranges
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i // Dates
    ];
    
    return jobTitlePatterns.some(pattern => pattern.test(line));
}

// Check if line is a bullet point
function isBulletPoint(line) {
    return /^[\s]*[•·\*\-\+]\s/.test(line);
}

// Check if line is a responsibility point (sentence describing work)
function isResponsibilityPoint(line) {
    // Must be a substantial sentence (not just keywords)
    if (line.length < 20) return false;
    
    // Should contain action words or responsibility indicators
    const actionWords = ['developed', 'managed', 'led', 'created', 'implemented', 'designed', 'coordinated', 'analyzed', 'improved', 'optimized'];
    const hasActionWord = actionWords.some(word => line.toLowerCase().includes(word));
    
    // Or should look like a complete sentence
    const looksLikeSentence = /[a-z].*[.!?]?$/i.test(line) && line.split(' ').length >= 4;
    
    return hasActionWord || looksLikeSentence;
}

// Check if a point contains quantifiable data
function hasQuantifiableData(point) {
    const quantifiablePatterns = [
        /\d+%/,                                           // Percentages (25%, 100%)
        /[\$₹]\s*\d+/,                                   // Dollar/Rupee amounts ($50K, ₹1L)
        /\d+\s*(million|thousand|lakhs?|crores?|k|m)\b/i, // Large numbers (5M, 10K, 2 lakhs)
        /\d+\s*(years?|months?|weeks?|days?)\b/i,        // Time periods
        /\d+\s*(people|members?|employees?|users?|customers?)\b/i, // People counts
        /\d+\s*(projects?|tasks?|features?|products?)\b/i, // Project counts
        /\d+\s*(clients?|accounts?|companies?)\b/i,       // Business metrics
        /\d+x\b|\bx\d+/i,                                // Multipliers (5x, x3)
        /\d+\+/,                                         // Plus indicators (10+)
        /\b\d{1,3}(,\d{3})*\b/                          // Large formatted numbers (1,000)
    ];
    
    return quantifiablePatterns.some(pattern => pattern.test(point));
}

// Analyze bullet point usage vs paragraphs
function analyzeBulletUsage(resumeText) {
    console.log('🔍 USE OF BULLETS: Starting analysis...');
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('🔍 USE OF BULLETS: Total lines found:', lines.length);
    
    let bulletCount = 0;
    let paragraphBlockCount = 0;
    let totalContentLines = 0;
    let inExperienceSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip headers but track if we're in experience section
        if (isHeaderLine(line)) {
            const lowerLine = line.toLowerCase();
            inExperienceSection = lowerLine.includes('experience') || lowerLine.includes('work') || lowerLine.includes('employment');
            console.log(`🔍 USE OF BULLETS: Header detected: "${line}" -> inExperience: ${inExperienceSection}`);
            continue;
        }
        
        // Skip contact info, dates, and short descriptive lines
        if (line.length < 20 || /^\d+\/\d+|@|•\s*\w+,\s*\w+/.test(line)) {
            continue;
        }
        
        totalContentLines++;
        
        // Check if this line starts with a bullet point
        const isBulletPoint = /^[\s]*[•·\*\-\+\>]\s/.test(line) || 
                             /^\s*\d+[\.\)]\s/.test(line) ||
                             /^[\s]*[\u2022\u2023\u25E6\u2043\u2219]\s/.test(line) ||
                             line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ');
        
        console.log(`🔍 USE OF BULLETS: Line ${i} (${inExperienceSection ? 'EXP' : 'OTHER'}): "${line.substring(0, 50)}..." -> bullet: ${isBulletPoint}`);
        
        if (isBulletPoint) {
            bulletCount++;
        } else if (inExperienceSection && line.length > 50) {
            // This is likely a paragraph-style responsibility in experience section
            paragraphBlockCount++;
            console.log(`🔍 USE OF BULLETS: Paragraph block detected in experience: "${line.substring(0, 50)}..."`);
        }
    }
    
    console.log('🔍 USE OF BULLETS: Analysis summary:');
    console.log('🔍 USE OF BULLETS: - Total content lines:', totalContentLines);
    console.log('🔍 USE OF BULLETS: - Bullet points found:', bulletCount);
    console.log('🔍 USE OF BULLETS: - Paragraph blocks in experience:', paragraphBlockCount);
    
    // Calculate score based on bullet usage
    let score = 0;
    
    if (totalContentLines === 0) {
        score = 5; // Default if no content
    } else {
        // Reward bullet usage, penalize paragraph blocks
        const bulletRatio = bulletCount / Math.max(totalContentLines, 1);
        
        if (bulletRatio > 0.7) score = 10;      // >70% bullets = excellent
        else if (bulletRatio > 0.5) score = 8; // >50% bullets = good  
        else if (bulletRatio > 0.3) score = 6; // >30% bullets = fair
        else if (bulletRatio > 0.1) score = 4; // >10% bullets = poor
        else score = 2;                        // <10% bullets = very poor
        
        // Apply penalty for paragraph blocks in experience sections
        score -= Math.min(paragraphBlockCount, 5); // Max 5 point penalty
    }
    
    const finalScore = Math.max(score, 0);
    console.log('🔍 USE OF BULLETS: Final score calculation:');
    console.log('🔍 USE OF BULLETS: - Bullet ratio:', (bulletCount / Math.max(totalContentLines, 1) * 100).toFixed(1) + '%');
    console.log('🔍 USE OF BULLETS: - Base score from ratio:', score + Math.min(paragraphBlockCount, 5));
    console.log('🔍 USE OF BULLETS: - Paragraph penalty:', Math.min(paragraphBlockCount, 5));
    console.log('🔍 USE OF BULLETS: - Final score:', finalScore);
    
    return finalScore;
}

// Helper function to identify header lines
function isHeaderLine(line) {
    const trimmedLine = line.trim();
    
    // Too short to be a paragraph
    if (trimmedLine.length < 10) return true;
    
    // Common section headers
    const headerKeywords = [
        'experience', 'education', 'skills', 'summary', 'objective', 
        'projects', 'certifications', 'awards', 'achievements', 'contact',
        'work history', 'employment', 'qualifications', 'professional summary',
        'technical skills', 'core competencies', 'professional experience'
    ];
    
    const lowerLine = trimmedLine.toLowerCase();
    if (headerKeywords.some(keyword => lowerLine === keyword || (lowerLine.includes(keyword) && trimmedLine.length < 50))) {
        return true;
    }
    
    // All caps (likely a header)
    if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 30) {
        return true;
    }
    
    // Job titles and company names (not bullet content)
    if (/^[A-Z][a-z\s]+@\s+[A-Z]/.test(trimmedLine) || // "Product @ Company"
        /^\w+\s*@\s*\w+/.test(trimmedLine) || // "Role @ Company"
        /^\d{2}\/\d{4}/.test(trimmedLine) || // Date formats
        /^\w+\s*-\s*\w+/.test(trimmedLine) && trimmedLine.length < 50) { // "Company - Role"
        return true;
    }
    
    // Title case with limited length (likely a header)
    const words = trimmedLine.split(' ');
    if (words.length <= 4 && words.every(word => /^[A-Z][a-z]*$/.test(word))) {
        return true;
    }
    
    return false;
}

function analyzeFormatting(resumeText) {
    const hasStructure = resumeText.includes('\n') && resumeText.length > 100;
    return hasStructure ? 9 : 5;
}

function analyzePersonalPronouns(resumeText) {
    // Start with maximum score of 10
    let score = 10;
    
    // Define personal pronouns to detect (case insensitive)
    const pronouns = ['\\bi\\b', '\\bme\\b', '\\bwe\\b', '\\bmy\\b', '\\bour\\b', '\\bus\\b'];
    
    // Count total pronoun usage
    let totalPronounCount = 0;
    
    pronouns.forEach(pronounPattern => {
        const regex = new RegExp(pronounPattern, 'gi');
        const matches = resumeText.match(regex) || [];
        totalPronounCount += matches.length;
    });
    
    // Deduct 1 point for each pronoun usage
    score -= totalPronounCount;
    
    // Ensure score doesn't go below 0
    return Math.max(score, 0);
}

function analyzeResumeLength(resumeText) {
    // Count words
    const wordCount = resumeText.split(' ').filter(word => word.trim().length > 0).length;
    
    // Count bullet points (various bullet styles)
    const bulletPoints = (resumeText.match(/[•·\*\-]\s+|^\s*\d+\.\s+/gm) || []).length;
    
    // Optimal ranges
    const optimalWordRange = [420, 875];
    const optimalBulletRange = [12, 32];
    
    // Calculate word score (0-5 scale)
    let wordScore = 0;
    if (wordCount >= optimalWordRange[0] && wordCount <= optimalWordRange[1]) {
        wordScore = 5; // Perfect word count
    } else if (wordCount > 0) {
        // Calculate distance from optimal range
        const distanceFromOptimal = wordCount < optimalWordRange[0] 
            ? optimalWordRange[0] - wordCount
            : wordCount - optimalWordRange[1];
        
        // Reduce score based on distance (max penalty of 5 points)
        const penalty = Math.min(distanceFromOptimal / 100, 5);
        wordScore = Math.max(0, 5 - penalty);
    }
    
    // Calculate bullet score (0-5 scale)
    let bulletScore = 0;
    if (bulletPoints >= optimalBulletRange[0] && bulletPoints <= optimalBulletRange[1]) {
        bulletScore = 5; // Perfect bullet count
    } else if (bulletPoints > 0) {
        // Calculate distance from optimal range
        const distanceFromOptimal = bulletPoints < optimalBulletRange[0]
            ? optimalBulletRange[0] - bulletPoints
            : bulletPoints - optimalBulletRange[1];
        
        // Reduce score based on distance (max penalty of 5 points)
        const penalty = Math.min(distanceFromOptimal / 5, 5);
        bulletScore = Math.max(0, 5 - penalty);
    }
    
    // Combine scores (total out of 10)
    const totalScore = Math.round(wordScore + bulletScore);
    
    return Math.max(0, Math.min(10, totalScore));
}

function analyzeSectionHeaders(resumeText) {
    const headers = ['experience', 'education', 'skills', 'summary'];
    const foundHeaders = headers.filter(h => resumeText.toLowerCase().includes(h));
    return Math.min(foundHeaders.length * 2.5, 10);
}

function analyzeBulletPoints(resumeText) {
    const hasBullets = /•|·|\*|-/.test(resumeText);
    return hasBullets ? 8 : 4;
}

function analyzeJobTitles(resumeText) {
    const titles = ['developer', 'manager', 'analyst', 'engineer', 'coordinator', 'specialist'];
    const foundTitles = titles.filter(t => resumeText.toLowerCase().includes(t));
    return foundTitles.length > 0 ? 8 : 5;
}

function analyzeCompanyNames(resumeText) {
    const hasCompanies = /inc\.|corp\.|ltd\.|llc|company|corporation/i.test(resumeText);
    return hasCompanies ? 9 : 6;
}


function analyzeCertifications(resumeText) {
    const certs = ['certified', 'certification', 'license', 'credential'];
    const foundCerts = certs.filter(c => resumeText.toLowerCase().includes(c));
    return foundCerts.length > 0 ? 8 : 5;
}

function analyzeIndustryBuzzwords(resumeText) {
    if (!skillsBuzzwordsConfig) return 5;
    const allBuzzwords = [];
    if (skillsBuzzwordsConfig.buzzwords) {
        Object.values(skillsBuzzwordsConfig.buzzwords).forEach(industryBuzzwords => {
            allBuzzwords.push(...industryBuzzwords);
        });
    }
    const foundBuzzwords = allBuzzwords.filter(word => resumeText.toLowerCase().includes(word.toLowerCase()));
    return Math.min(foundBuzzwords.length, 10);
}

function analyzeATSCompatibility(resumeText) {
    const hasGoodStructure = resumeText.length > 200 && /\n/.test(resumeText);
    return hasGoodStructure ? 8 : 5;
}

function analyzeWhiteSpace(resumeText) {
    const hasProperSpacing = resumeText.includes('\n\n') || resumeText.includes('\n');
    return hasProperSpacing ? 9 : 6;
}

/**
 * Display overall ATS score in the sidebar circle - NOW USING REAL DATA
 */
function displayOverallScore(data) {
    if (!atsScore) return;
    
    // Calculate overall score from our 26 categories (sum / 260 * 100) 
    const categories = generateComprehensiveATSScores(data); // 26 categories total
    console.log('🔍 DEBUG: All category scores:', categories.map(cat => ({ name: cat.name, score: cat.score })));
    
    // Filter out undefined/NaN scores and handle them gracefully
    const validScores = categories.map(cat => {
        const score = cat.score;
        if (typeof score !== 'number' || isNaN(score)) {
            console.warn(`⚠️ WARNING: Invalid score for category ${cat.name}:`, score, 'Using fallback score of 7');
            return 7; // Fallback score for categories with API failures
        }
        return Math.max(0, Math.min(10, score)); // Ensure score is between 0-10
    });
    
    const categorySum = validScores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = categories.length * 10; // Dynamic calculation based on actual category count
    const calculatedScore = Math.round((categorySum / maxPossibleScore) * 100); // Scale to 100
    let score = calculatedScore;
    
    console.log(`🔍 DEBUG: Valid scores:`, validScores);
    console.log(`🔍 DEBUG: Category sum: ${categorySum}/${maxPossibleScore}`);
    console.log(`🔍 DEBUG: Calculated overall score from ${categories.length} categories: ${calculatedScore}`);
    
    // Ensure final score is valid
    if (isNaN(score) || typeof score !== 'number') {
        console.error('❌ ERROR: Final score is invalid:', score, 'Using fallback score of 75');
        score = 75; // Fallback score
    }
    
    console.log(`🔍 DEBUG: Final ATS score: ${score}`);
    
    atsScore.textContent = Math.round(score);
    
    // Update circle color based on actual score
    if (scoreCircle) {
        if (score >= 80) {
            scoreCircle.style.borderColor = '#10b981'; // Green
        } else if (score >= 60) {
            scoreCircle.style.borderColor = '#f59e0b'; // Orange
        } else {
            scoreCircle.style.borderColor = '#ef4444'; // Red
        }
    }
}

/**
 * Display categorized issues in the sidebar with comprehensive scoring
 */
function displaySidebarCategories(data) {
    console.log('📊 DEBUG: Starting displaySidebarCategories...');
    
    if (!topFixesList || !completedList) {
        console.error('❌ DEBUG: Missing DOM elements - topFixesList:', !!topFixesList, 'completedList:', !!completedList);
        return;
    }
    
    console.log('📊 DEBUG: DOM elements found, proceeding with data:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : []
    });
    
    // Clear existing content
    topFixesList.innerHTML = '';
    completedList.innerHTML = '';
    console.log('📊 DEBUG: Cleared existing content');
    
    console.log('📊 DEBUG: Calling generateComprehensiveATSScores...');
    // Generate ALL 26 ATS categories based on actual analysis data
    const allCategories = generateComprehensiveATSScores(data);
    console.log('📊 DEBUG: Generated categories:', {
        count: allCategories.length,
        categories: allCategories.map(cat => ({ name: cat.name, score: cat.score }))
    });
    
    // Divide into High Priority (<6), Need Fixes (6-8), Completed (9-10)
    const topFixes = allCategories.filter(cat => cat.score < 6); // High Priority
    const needFixes = allCategories.filter(cat => cat.score >= 6 && cat.score < 9); // Need Fixes
    const completed = allCategories.filter(cat => cat.score >= 9); // Completed
    
    console.log('📊 DEBUG: Categories divided:', {
        topFixes: topFixes.length,
        needFixes: needFixes.length,
        completed: completed.length
    });
    
    console.log('🔍 High Priority (<6):', topFixes.length, topFixes);
    console.log('🔍 Need Fixes (6-8):', needFixes.length, needFixes);
    console.log('🔍 Completed (9-10):', completed.length, completed);
    console.log('🔍 Total categories:', allCategories.length);
    
    // Update summary stats in the main content area
    updateSummaryStats(topFixes, needFixes, completed, allCategories.length);
    
    // Display HIGH PRIORITY FIXES (score < 6)
    console.log('🔍 DEBUG: Processing topFixes:', topFixes.length, topFixes.map(cat => cat.name));
    topFixes.forEach(category => {
        // Skip categories with invalid data
        if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
            console.warn('⚠️ Skipping category with missing/invalid name:', {
                name: category.name,
                nameType: typeof category.name,
                score: category.score,
                issue: category.issue,
                impact: category.impact
            });
            return;
        }
        
        const safeIssue = category.issue || 'Needs improvement';
        const safeScore = (typeof category.score === 'number' && !isNaN(category.score)) ? category.score : 0;
        
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.innerHTML = `
            <span class="text-sm text-gray-700">${category.name}</span>
            <span class="text-sm font-bold text-red-600">${safeScore}/10</span>
        `;
        topFixesList.appendChild(item);
        
        // Add to allIssues for main display
        allIssues.push({
            title: category.name,
            description: safeIssue,
            score: safeScore,
            category: 'High Priority',
            severity: 'high',
            impact: category.impact || 'IMPROVEMENT'
        });
    });
    
    // Display NEED FIXES (score 6-8) - also go to TOP FIXES section
    console.log('🔍 DEBUG: Processing needFixes:', needFixes.length, needFixes.map(cat => cat.name));
    needFixes.forEach(category => {
        // Skip categories with invalid data
        if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
            console.warn('⚠️ Skipping category with missing/invalid name:', {
                name: category.name,
                nameType: typeof category.name,
                score: category.score,
                issue: category.issue,
                impact: category.impact
            });
            return;
        }
        
        const safeIssue = category.issue || 'Needs improvement';
        const safeScore = (typeof category.score === 'number' && !isNaN(category.score)) ? category.score : 6;
        
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.innerHTML = `
            <span class="text-sm text-gray-700">${category.name}</span>
            <span class="text-sm font-bold text-orange-600">${safeScore}/10</span>
        `;
        topFixesList.appendChild(item);
        
        // Add to allIssues for main display
        allIssues.push({
            title: category.name,
            description: safeIssue,
            score: safeScore,
            category: 'Need Fixes',
            severity: 'medium',
            impact: category.impact || 'IMPROVEMENT'
        });
    });
    
    // Display COMPLETED sections (score 9-10)
    completed.forEach(category => {
        // Skip categories with invalid data
        if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
            console.warn('⚠️ Skipping category with missing/invalid name:', {
                name: category.name,
                nameType: typeof category.name,
                score: category.score,
                issue: category.issue,
                impact: category.impact
            });
            return;
        }
        
        const safeScore = (typeof category.score === 'number' && !isNaN(category.score)) ? category.score : 10;
        
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.innerHTML = `
            <span class="text-sm text-gray-700">${category.name}</span>
            <span class="text-sm font-bold text-green-600">${safeScore}/10</span>
        `;
        completedList.appendChild(item);
    });
    
    // Update the counter to show all categories (dynamic count)
    if (markedAsDone) {
        markedAsDone.textContent = `${completed.length} COMPLETED OF ${allCategories.length}`;
    }
    
    // Return the category data for use by other functions
    return {
        topFixes,
        needFixes,
        completed,
        allCategories
    };
}

/**
 * Use backend comprehensive categories - NO FRONTEND SCORING
 */
function generateComprehensiveATSScores(data) {
    console.log('✅ Using backend comprehensive categories - NO frontend scoring');
    
    // Use backend comprehensive categories directly
    const backendCategories = data.comprehensive_categories || [];
    
    if (backendCategories.length > 0) {
        console.log('✅ Found backend comprehensive categories:', {
            count: backendCategories.length,
            categories: backendCategories.map(cat => ({ name: cat.name, score: cat.score }))
        });
        return backendCategories;
    }
    
    // Fallback: if no comprehensive categories, return empty array
    console.error('❌ No backend comprehensive categories found!');
    console.log('Available data keys:', Object.keys(data));
    return [];
}

// =====================================================================================
    
    // 1. CONTACT INFORMATION (from backend 'contact' component)
    const contactData = detailedAnalysis.contact || {};
    categories.push({
        name: 'Contact Details',
        score: analyzeContactDetails(resumeText),
        issue: 'Ensure all contact information is complete and professional',
        impact: 'SECTIONS'
    });
    
    // 2-3. STRUCTURE ANALYSIS (from backend 'structure' component) 
    const structureData = detailedAnalysis.structure || {};
    const structureScore = componentScores.structure || 0;
    categories.push({
        name: 'Education Section',
        score: analyzeEducationSection(resumeText, structureData),
        issue: 'Optimize education section format and content',
        impact: 'SECTIONS'
    });
    categories.push({
        name: 'Skills Section', 
        score: analyzeSkillsSection(resumeText, structureData),
        issue: 'Improve skills presentation and relevance',
        impact: 'SECTIONS'
    });
    
    // 4-6. KEYWORD OPTIMIZATION (from backend 'keywords' component)
    const keywordsData = detailedAnalysis.keywords || {};
    categories.push({
        name: 'Analytical',
        score: analyzeAnalyticalSkills(resumeText, keywordsData),
        issue: 'Highlight analytical and problem-solving skills',
        impact: 'ALL'
    });
    categories.push({
        name: 'Leadership',
        score: analyzeLeadershipSkills(resumeText, keywordsData),
        issue: 'Emphasize leadership experiences and impact',
        impact: 'ALL'
    });
    
    // 7-11. FORMATTING & STYLE (from backend 'formatting' component)
    const formattingData = detailedAnalysis.formatting || {};
    const formattingScore = componentScores.formatting || 0;
    categories.push({
        name: 'Page Density',
        score: analyzePageDensity(resumeText),
        issue: 'Optimize page layout and white space usage',
        impact: 'STYLE'
    });
    categories.push({
        name: 'Use of Bullets',
        score: analyzeBulletUsage(resumeText, formattingData),
        issue: 'Improve bullet point structure and formatting',
        impact: 'STYLE'
    });
    // Removed 'Spelling & Consistency' as we now have dedicated LLM-powered 'Spelling' category
    const grammarScore = analyzeGrammar(resumeText);
    console.log('🔍 NEW CATEGORY - Grammar (LLM-powered):', {
        score: grammarScore,
        maxScore: 10,
        percentage: Math.round((grammarScore / 10) * 100) + '%',
        analysis: 'Uses AI-powered grammar checking for accuracy'
    });
    categories.push({
        name: 'Grammar',
        score: grammarScore,
        issue: 'Fix grammar errors and improve language accuracy',
        impact: 'BREVITY'
    });
    const spellingScore = analyzeLLMSpelling(resumeText);
    console.log('🔍 NEW CATEGORY - Spelling (LLM-powered):', {
        score: spellingScore,
        maxScore: 10,
        percentage: Math.round((spellingScore / 10) * 100) + '%',
        analysis: 'Uses AI-powered spelling detection for accuracy'
    });
    categories.push({
        name: 'Spelling',
        score: spellingScore,
        issue: 'Fix spelling errors using AI-powered detection',
        impact: 'BREVITY'
    });
    categories.push({
        name: 'Verb Tenses',
        score: analyzeVerbTenses(resumeText),
        issue: 'Use consistent and appropriate verb tenses',
        impact: 'BREVITY'
    });
    const personalPronounsScore = analyzePersonalPronouns(resumeText);
    console.log('🔍 NEW CATEGORY - Personal Pronouns:', {
        score: personalPronounsScore,
        maxScore: 10,
        percentage: Math.round((personalPronounsScore / 10) * 100) + '%',
        analysis: 'Checks for "I", "me", "my", "myself", "our", "we" pronouns'
    });
    categories.push({
        name: 'Personal Pronouns',
        score: personalPronounsScore,
        issue: 'Remove first-person pronouns like "I", "me", "my"',
        impact: 'BREVITY'
    });
    // Dates scoring removed - now handled by backend
    console.log('🔍 NEW CATEGORY - Dates: Now handled by backend');
    
    // 12-16. ACHIEVEMENTS & CONTENT (from backend 'achievements' component)
    const achievementsData = detailedAnalysis.achievements || {};
    const achievementsScore = componentScores.achievements || 0;
    const quantifiableAchievementsScore = analyzeQuantifiableAchievements(resumeText);
    console.log('🔄 REPLACED CATEGORY - Quantifiable Achievements (was Quantity Impact):', {
        score: quantifiableAchievementsScore,
        maxScore: 10,
        percentage: Math.round((quantifiableAchievementsScore / 10) * 100) + '%',
        analysis: 'Searches for quantified achievements and measurable results'
    });
    categories.push({
        name: 'Quantifiable Achievements',
        score: quantifiableAchievementsScore,
        issue: 'Add more quantified achievements with specific numbers',
        impact: 'IMPACT'
    });
    const actionVerbsScore = analyzeActionVerbs(resumeText);
    console.log('🔄 REPLACED CATEGORY - Action Verbs (was Weak Verbs):', {
        score: actionVerbsScore,
        maxScore: 10,
        percentage: Math.round((actionVerbsScore / 10) * 100) + '%',
        analysis: 'Analyzes use of strong action verbs instead of weak verbs'
    });
    categories.push({
        name: 'Action Verbs',
        score: actionVerbsScore,
        issue: 'Use more strong action verbs to start bullet points',
        impact: 'IMPACT'
    });
    categories.push({
        name: 'Active Voice',
        score: analyzeActiveVoice(resumeText),
        issue: 'Convert passive voice to active voice for impact',
        impact: 'IMPACT'
    });
    categories.push({
        name: 'Summary',
        score: analyzeSummarySection(resumeText),
        issue: 'Professional summary needs improvement for better impact',
        impact: 'IMPACT'
    });
    categories.push({
        name: 'Teamwork',
        score: analyzeTeamworkSkills(resumeText),
        issue: 'Better showcase collaborative experiences',
        impact: 'ALL'
    });
    
    // 17-21. READABILITY & CONTENT QUALITY (from backend 'readability' component)
    const readabilityData = detailedAnalysis.readability || {};
    const readabilityScore = componentScores.readability || 0;
    categories.push({
        name: 'Verbosity',
        score: Math.round(readabilityScore / 10 * 10), // Backend gives 0-10, scale to 0-10
        issue: 'Reduce wordiness for better readability',
        impact: 'BREVITY'
    });
    categories.push({
        name: 'Repetition',
        score: analyzeRepetition(resumeText),
        issue: 'Eliminate repetitive phrases and content',
        impact: 'BREVITY'
    });
    categories.push({
        name: 'Unnecessary Sections',
        score: analyzeUnnecessarySections(resumeText),
        issue: 'Remove sections that don\'t add value',
        impact: 'SECTIONS'
    });
    categories.push({
        name: 'Growth Signals',
        score: analyzeGrowthSignals(resumeText),
        issue: 'Demonstrate career progression and learning',
        impact: 'ALL'
    });
    categories.push({
        name: 'Drive',
        score: analyzeDriveAndInitiative(resumeText),
        issue: 'Show initiative and self-motivation examples',
        impact: 'ALL'
    });
    const certificationsScore = analyzeCertifications(resumeText);
    console.log('🔍 NEW CATEGORY - Certifications:', {
        score: certificationsScore,
        maxScore: 10,
        percentage: Math.round((certificationsScore / 10) * 100) + '%',
        analysis: 'Checks for professional certifications and credentials'
    });
    categories.push({
        name: 'Certifications',
        score: certificationsScore,
        issue: 'Add relevant certifications and professional credentials',
        impact: 'ALL'
    });
    
    console.log('🔍 DEBUG: Generated categories with real scores:', categories.length, 'total');
    
    // Summary log for new categories verification
    console.log('🎯 NEW CATEGORIES SUMMARY - Verification Log:', {
        totalCategories: categories.length,
        newCategories: [
            'Personal Pronouns',
            'Dates', 
            'Grammar (LLM-powered)',
            'Spelling (LLM-powered)',
            'Certifications'
        ],
        replacedCategories: [
            'Quantifiable Achievements (was Quantity Impact)',
            'Action Verbs (was Weak Verbs)'
        ],
        allCategoryScores: categories.map(cat => ({
            name: cat.name,
            score: cat.score,
            percentage: Math.round((cat.score / 10) * 100) + '%'
        }))
    });
    
    return categories;
}

// =====================================================================================
// REAL ANALYSIS FUNCTIONS - These analyze actual resume content, no more fake scoring!
// =====================================================================================

// =====================================================================================
// REMOVED ALL FRONTEND SCORING FUNCTIONS - BACKEND ONLY SCORING
// User explicitly stated: "There should not be any frontend scoring logic"
// =====================================================================================

// REMOVED: hasMobileNumber() - frontend scoring not allowed

// =====================================================================================
// ALL FRONTEND SCORING FUNCTIONS REMOVED PER USER REQUEST
// "There should not be any frontend scoring logic. Remove if it exists, frontend logic should not be there for any category."
// =====================================================================================

// Frontend now uses ONLY backend comprehensive_categories data
// No more duplicate scoring logic that conflicts with backend

/**
 * Update loading progress indicator
 */
function updateLoadingProgress(percentage, statusText) {
    const progressBar = document.getElementById('resultProgressBar');
    const statusElement = document.getElementById('resultLoadingStatus');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    if (statusElement && statusText) {
        statusElement.innerHTML = `${statusText} <span class="font-semibold text-green-400">${percentage}%</span>`;
    }
    
    console.log(`📈 Progress: ${percentage}% - ${statusText}`);
}

/**
 * Show loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('resultLoadingScreen');
    const mainContent = document.getElementById('mainResultContent');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
        console.log('📱 Loading screen shown');
    }
    
    if (mainContent) {
        mainContent.style.display = 'none';
        mainContent.style.opacity = '0';
        console.log('📱 Main content hidden');
    }
}

/**
 * Hide loading screen and show main content with smooth transition
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('resultLoadingScreen');
    const mainContent = document.getElementById('mainResultContent');
    
    if (loadingScreen && mainContent) {
        // Start fade out of loading screen
        loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            // Hide loading screen and show main content
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Trigger fade in of main content after a short delay
            setTimeout(() => {
                mainContent.style.opacity = '1';
                console.log('📱 Main content shown with smooth transition');
            }, 50);
            
            console.log('📱 Loading screen hidden');
        }, 500); // Wait for fade out transition
    } else {
        // Fallback for missing elements
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('📱 Loading screen hidden (fallback)');
        }
        
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
            console.log('📱 Main content shown (fallback)');
        }
    }
}

// Export for debugging
window.debugResults = {
    analysisData: () => analysisData,
    allIssues: () => allIssues,
    reinit: init
};
