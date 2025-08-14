/**
 * Results page JavaScript for displaying ATS analysis results
 * Handles score display, upgrade flow, and user interactions
 * Updated with sidebar layout to match screenshot design
 * Clean version - Aug 14, 2025
 */

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

/**
 * Initialize the results page with new sidebar design
 */
function init() {
    try {
        // Load analysis data from session storage
        const storedData = sessionStorage.getItem('atsAnalysis');
        if (!storedData) {
            console.error('No analysis data found in session storage');
            window.location.href = './index.html';
            return;
        }

        analysisData = JSON.parse(storedData);
        console.log('Analysis data loaded:', analysisData);

        // Display results in new sidebar format
        displayOverallScore(analysisData);
        displaySidebarCategories(analysisData);
        displayMainIssuesList(analysisData);
        displayStrengths(analysisData);
        
        setupEventHandlers();

    } catch (error) {
        console.error('Error initializing results page:', error);
        // Fallback to home page if there's an error
        setTimeout(() => {
            window.location.href = './index.html';
        }, 3000);
    }
}

/**
 * Display overall ATS score in the sidebar circle - NOW USING REAL DATA
 */
function displayOverallScore(data) {
    if (!atsScore) return;
    
    // Get REAL score from backend analysis - no more hardcoded 75!
    let score = data.ats_score || data.overall_score || data.insights?.overall_score || 0;
    
    // ALTERNATIVE: Calculate from our 21 categories if we want to override backend
    // Uncomment this to use frontend calculation instead of backend
    /*
    const categories = generateComprehensiveATSScores(data);
    const categorySum = categories.reduce((sum, cat) => sum + cat.score, 0);
    const calculatedScore = Math.round((categorySum / 210) * 100); // 21 categories * 10 max each = 210, scale to 100
    score = calculatedScore;
    console.log(`Calculated score from 21 categories: ${calculatedScore} (sum: ${categorySum}/210)`);
    */
    
    console.log(`Using ATS score: ${score}`);
    
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
    if (!topFixesList || !completedList) return;
    
    // Comprehensive ATS scoring categories with scores out of 10
    const atsCategories = generateComprehensiveATSScores(data);
    
    // Clear existing content
    topFixesList.innerHTML = '';
    completedList.innerHTML = '';
    
    // Separate categories into TOP FIXES (<10/10) and COMPLETED (10/10)
    const topFixes = atsCategories.filter(cat => cat.score < 10);
    const completed = atsCategories.filter(cat => cat.score === 10);
    
    // Display TOP FIXES
    topFixes.forEach(category => {
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.innerHTML = `
            <span class="text-sm text-gray-700">${category.name}</span>
            <span class="text-sm font-bold text-red-600">${category.score}/10</span>
        `;
        topFixesList.appendChild(item);
        
        // Add to allIssues for main display
        allIssues.push({
            title: category.name,
            description: category.issue,
            score: category.score,
            category: 'Top Fixes',
            severity: category.score <= 6 ? 'high' : 'medium',
            impact: category.impact
        });
    });
    
    // Display COMPLETED sections
    completed.forEach(category => {
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.innerHTML = `
            <span class="text-sm text-gray-700">${category.name}</span>
            <span class="text-sm font-bold text-green-600">10/10</span>
        `;
        completedList.appendChild(item);
    });
    
    // Update the "MARKED AS DONE" counter
    if (markedAsDone) {
        markedAsDone.textContent = `${completed.length} MARKED AS DONE`;
    }
}

/**
 * Generate comprehensive ATS scores for all 21 categories - NOW USING REAL DATA
 */
function generateComprehensiveATSScores(data) {
    console.log('Generating scores with real data:', data);
    
    // Extract real backend analysis components
    const componentScores = data.component_scores || {};
    const detailedAnalysis = data.detailed_analysis || {};
    const resumeText = data.content || data.text || "";
    
    console.log('Backend component scores:', componentScores);
    console.log('Backend detailed analysis:', detailedAnalysis);
    
    // Now calculate REAL scores for each category based on actual backend analysis
    const categories = [];
    
    // Map backend components to our 21 frontend categories with real analysis
    
    // 1. CONTACT INFORMATION (from backend 'contact' component)
    const contactData = detailedAnalysis.contact || {};
    categories.push({
        name: 'Contact Details',
        score: analyzeContactDetails(resumeText),
        issue: generateContactIssue(contactData),
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
    const keywordScore = componentScores.keywords || 0;
    categories.push({
        name: 'Job Fit',
        score: Math.round(keywordScore / 20 * 10), // Backend gives 0-20, scale to 0-10
        issue: 'Better align experience with target role requirements',
        impact: 'ALL'
    });
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
    categories.push({
        name: 'Spelling & Consistency',
        score: analyzeSpellingConsistency(resumeText),
        issue: 'Fix spelling errors and maintain consistency',
        impact: 'BREVITY'
    });
    categories.push({
        name: 'Grammar',
        score: analyzeGrammar(resumeText),
        issue: 'Correct grammatical errors throughout resume',
        impact: 'BREVITY'
    });
    categories.push({
        name: 'Verb Tenses',
        score: analyzeVerbTenses(resumeText),
        issue: 'Use consistent and appropriate verb tenses',
        impact: 'BREVITY'
    });
    
    // 12-16. ACHIEVEMENTS & CONTENT (from backend 'achievements' component)
    const achievementsData = detailedAnalysis.achievements || {};
    const achievementsScore = componentScores.achievements || 0;
    categories.push({
        name: 'Quantity Impact',
        score: analyzeQuantityImpact(resumeText),
        issue: 'Add more quantified achievements with specific numbers',
        impact: 'IMPACT'
    });
    categories.push({
        name: 'Weak Verbs',
        score: analyzeWeakVerbs(resumeText),
        issue: 'Replace weak verbs with stronger action words',
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
    
    console.log('Generated categories with real scores:', categories);
    return categories;
}

// =====================================================================================
// REAL ANALYSIS FUNCTIONS - These analyze actual resume content, no more fake scoring!
// =====================================================================================

/**
 * Analyze contact details completeness (mobile, email, LinkedIn, location)
 */
function analyzeContactDetails(resumeText) {
    let score = 10; // Start with perfect score, deduct 2.5 for each missing element
    
    // 1. Mobile Number (2.5 points)
    const hasMobile = hasMobileNumber(resumeText);
    if (!hasMobile) {
        score -= 2.5;
    }
    
    // 2. Email Address (2.5 points)
    const hasEmail = hasEmailAddress(resumeText);
    if (!hasEmail) {
        score -= 2.5;
    }
    
    // 3. LinkedIn Profile (2.5 points)
    const hasLinkedIn = hasLinkedInProfile(resumeText);
    if (!hasLinkedIn) {
        score -= 2.5;
    }
    
    // 4. Location (2.5 points)
    const hasLocation = hasLocationInfo(resumeText);
    if (!hasLocation) {
        score -= 2.5;
    }
    
    return Math.max(score, 0);
}

/**
 * Check for mobile number presence
 */
function hasMobileNumber(resumeText) {
    const phonePatterns = [
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,           // US format: 123-456-7890
        /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g,          // US format: (123) 456-7890
        /\b\+\d{1,3}[-.\s]?\d{1,14}[-.\s]?\d{1,14}\b/g, // International: +1-234-567-8900
        /\b\d{10,15}\b/g,                              // Simple 10+ digit number
        /\bphone\s*:?\s*\d/gi,                         // "Phone: 123..."
        /\bmobile\s*:?\s*\d/gi,                        // "Mobile: 123..."
        /\bcell\s*:?\s*\d/gi                           // "Cell: 123..."
    ];
    
    return phonePatterns.some(pattern => pattern.test(resumeText));
}

/**
 * Check for email address presence
 */
function hasEmailAddress(resumeText) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return emailPattern.test(resumeText);
}

/**
 * Check for LinkedIn profile presence
 */
function hasLinkedInProfile(resumeText) {
    const text = resumeText.toLowerCase();
    
    const linkedinPatterns = [
        /linkedin\.com\/in\/[a-z0-9-]+/gi,              // Full LinkedIn URL
        /linkedin\.com\/pub\/[a-z0-9-]+/gi,             // Public LinkedIn URL
        /www\.linkedin\.com/gi,                         // LinkedIn domain
        /linkedin:\s*[a-z0-9.-]+/gi,                    // "LinkedIn: username"
        /\blinkedin\b.*profile/gi,                      // "LinkedIn profile"
        /\blinkedin\b/gi && /profile/gi                 // LinkedIn + profile mentioned
    ];
    
    // Check for explicit LinkedIn mentions
    if (/\blinkedin\b/gi.test(resumeText)) {
        return true;
    }
    
    // Check for LinkedIn URL patterns
    return linkedinPatterns.some(pattern => pattern.test(resumeText));
}

/**
 * Check for location information presence
 */
function hasLocationInfo(resumeText) {
    const text = resumeText.toLowerCase();
    
    // US States (abbreviated and full names)
    const usStates = [
        'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 
        'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 
        'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 
        'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 
        'wi', 'wy', 'alabama', 'alaska', 'arizona', 'arkansas', 'california', 
        'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 
        'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 
        'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 
        'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 
        'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 
        'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 
        'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 
        'washington', 'west virginia', 'wisconsin', 'wyoming'
    ];
    
    // Common location patterns
    const locationPatterns = [
        /\b\w+,\s*[A-Z]{2}\b/g,                         // City, ST format
        /\b\w+,\s*\w+\s*\d{5}\b/g,                      // City, State ZIP
        /\b\d{5}(-\d{4})?\b/g,                          // ZIP code
        /location\s*:?\s*\w+/gi,                        // "Location: City"
        /address\s*:?\s*\w+/gi,                         // "Address: ..."
        /based\s+in\s+\w+/gi,                           // "Based in City"
        /located\s+in\s+\w+/gi                          // "Located in City"
    ];
    
    // Check for US states
    const hasUSState = usStates.some(state => text.includes(` ${state} `) || text.includes(`,${state}`) || text.includes(` ${state},`));
    
    // Check for location patterns
    const hasLocationPattern = locationPatterns.some(pattern => pattern.test(resumeText));
    
    return hasUSState || hasLocationPattern;
}

/**
 * Generate contact issue based on actual missing contact information
 */
function generateContactIssue(contactData) {
    const missing = contactData.missing || [];
    if (missing.length > 0) {
        return `Missing ${missing.join(', ')} - complete contact information required`;
    }
    return 'Contact information is complete and professional';
}

/**
 * Analyze education section quality with GPA requirements based on experience
 */
function analyzeEducationSection(resumeText, structureData) {
    let score = 0; // Start from 0, add points for each element
    const text = resumeText.toLowerCase();
    
    // Extract years of experience for GPA requirement logic
    const yearsOfExperience = extractYearsOfExperience(resumeText);
    
    // 1. Has Education Section (3 points)
    const hasEducationSection = text.includes('education') || 
                               text.includes('academic') || 
                               text.includes('qualification');
    if (hasEducationSection) {
        score += 3;
    }
    
    // 2. Degree/Qualification (3 points)
    const degreeWords = [
        'bachelor', 'master', 'phd', 'doctorate', 'associate', 
        'diploma', 'certificate', 'degree', 'b.s.', 'b.a.', 
        'm.s.', 'm.a.', 'mba', 'ph.d.'
    ];
    const hasDegree = degreeWords.some(degree => text.includes(degree));
    if (hasDegree) {
        score += 3;
    }
    
    // 3. Institution Name (2 points)
    const hasInstitution = hasEducationInstitution(resumeText);
    if (hasInstitution) {
        score += 2;
    }
    
    // 4. Graduation Dates with proper formatting (2 points)
    const hasProperDates = hasEducationDates(resumeText);
    if (hasProperDates) {
        score += 2;
    }
    
    // Special logic for GPA/Honors based on experience
    if (yearsOfExperience < 3) {
        // For <3 years experience: GPA/honors are important
        const hasGPAOrHonors = hasGPAOrHonorsInfo(resumeText);
        if (!hasGPAOrHonors) {
            score -= 2; // Deduct for missing GPA/honors for junior professionals
        }
    }
    // For 3+ years experience: GPA/honors don't matter (no bonus/penalty)
    
    return Math.max(Math.min(score, 10), 0);
}

/**
 * Check for education institution names
 */
function hasEducationInstitution(resumeText) {
    const institutionKeywords = [
        'university', 'college', 'institute', 'school', 'academy',
        'tech', 'polytechnic', 'community college'
    ];
    
    const text = resumeText.toLowerCase();
    return institutionKeywords.some(keyword => text.includes(keyword));
}

/**
 * Check for proper education date formatting
 */
function hasEducationDates(resumeText) {
    const datePatterns = [
        /\b(19|20)\d{2}\b/g,           // Year format (2020)
        /\d{1,2}\/\d{4}/g,             // MM/YYYY format
        /[A-Za-z]+\s+\d{4}/g,          // Month Year format
        /\d{4}\s*[-–]\s*\d{4}/g        // Range format (2018-2022)
    ];
    
    return datePatterns.some(pattern => pattern.test(resumeText));
}

/**
 * Check for GPA or honors information
 */
function hasGPAOrHonorsInfo(resumeText) {
    const text = resumeText.toLowerCase();
    
    // GPA patterns
    const gpaPatterns = [
        /gpa\s*:?\s*\d\.\d/gi,         // GPA: 3.8
        /\d\.\d{1,2}\s*gpa/gi,         // 3.8 GPA
        /\d\.\d{1,2}\/4\.0/gi          // 3.8/4.0
    ];
    
    // Honors patterns
    const honorsKeywords = [
        'magna cum laude', 'summa cum laude', 'cum laude',
        'honors', 'dean\'s list', 'honor roll', 'distinction',
        'academic excellence', 'merit', 'scholarship'
    ];
    
    const hasGPA = gpaPatterns.some(pattern => pattern.test(resumeText));
    const hasHonors = honorsKeywords.some(honor => text.includes(honor));
    
    return hasGPA || hasHonors;
}

/**
 * Analyze skills section quality
 */
function analyzeSkillsSection(resumeText, structureData) {
    let score = 0; // Start from 0, add points for each component
    
    // Extract years of experience for skill count expectations
    const yearsOfExperience = extractYearsOfExperience(resumeText);
    
    // 1. Has Skills Section (2 points)
    const hasSkillsSection = hasSkillsSectionPresent(resumeText);
    if (hasSkillsSection) {
        score += 2;
    }
    
    // 2. Technical Skills Count based on experience (3 points)
    const skillsCount = countSkillsMentioned(resumeText);
    const expectedSkills = getExpectedSkillsCount(yearsOfExperience);
    
    if (skillsCount >= expectedSkills.ideal) {
        score += 3; // Meets or exceeds ideal count
    } else if (skillsCount >= expectedSkills.minimum) {
        score += 2; // Meets minimum but below ideal
    } else if (skillsCount >= expectedSkills.minimum * 0.5) {
        score += 1; // Below minimum but has some skills
    }
    // 0 points if very few skills
    
    // 3. Industry Buzz Words/Relevant Terms (3 points)
    const buzzWordScore = analyzeBuzzWordsInSkills(resumeText);
    score += Math.min(buzzWordScore, 3);
    
    // 4. Organization Quality (2 points)
    const organizationScore = analyzeSkillsOrganization(resumeText);
    score += Math.min(organizationScore, 2);
    
    return Math.min(score, 10);
}

/**
 * Check if skills section is present
 */
function hasSkillsSectionPresent(resumeText) {
    const text = resumeText.toLowerCase();
    const skillsMarkers = [
        'skills', 'technical skills', 'core competencies', 'competencies',
        'expertise', 'proficiencies', 'technologies', 'tools'
    ];
    
    return skillsMarkers.some(marker => text.includes(marker));
}

/**
 * Count skills mentioned in resume
 */
function countSkillsMentioned(resumeText) {
    const text = resumeText.toLowerCase();
    
    // Comprehensive skill categories
    const technicalSkills = [
        // Programming Languages
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
        
        // Frameworks & Libraries
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
        'bootstrap', 'jquery', 'tensorflow', 'pytorch', 'pandas', 'numpy',
        
        // Databases
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
        
        // Cloud & DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
        'terraform', 'ansible', 'ci/cd', 'linux', 'bash',
        
        // Tools & Software
        'jira', 'confluence', 'slack', 'trello', 'figma', 'photoshop', 'excel',
        'tableau', 'power bi', 'salesforce', 'hubspot'
    ];
    
    const professionalSkills = [
        'project management', 'agile', 'scrum', 'kanban', 'waterfall',
        'leadership', 'team management', 'communication', 'presentation',
        'problem solving', 'analytical thinking', 'strategic planning',
        'business analysis', 'process improvement', 'quality assurance',
        'stakeholder management', 'budget management', 'risk management'
    ];
    
    const allSkills = [...technicalSkills, ...professionalSkills];
    const foundSkills = allSkills.filter(skill => text.includes(skill));
    
    return foundSkills.length;
}

/**
 * Get expected skills count based on experience level
 */
function getExpectedSkillsCount(yearsOfExperience) {
    if (yearsOfExperience < 3) {
        return { minimum: 8, ideal: 12 }; // Junior: 8-12 skills
    } else if (yearsOfExperience < 6) {
        return { minimum: 12, ideal: 18 }; // Mid-level: 12-18 skills
    } else {
        return { minimum: 18, ideal: 25 }; // Senior: 18+ skills
    }
}

/**
 * Analyze buzz words and industry relevance in skills
 */
function analyzeBuzzWordsInSkills(resumeText) {
    const text = resumeText.toLowerCase();
    
    const industryBuzzWords = [
        // Modern Tech
        'artificial intelligence', 'machine learning', 'deep learning', 'ai/ml',
        'cloud computing', 'microservices', 'apis', 'restful', 'graphql',
        'blockchain', 'iot', 'big data', 'data science', 'analytics',
        
        // Methodologies
        'agile methodology', 'devops', 'continuous integration', 'automation',
        'test-driven development', 'object-oriented', 'responsive design',
        
        // Business Terms
        'digital transformation', 'scalability', 'performance optimization',
        'user experience', 'customer satisfaction', 'roi', 'kpi'
    ];
    
    const foundBuzzWords = industryBuzzWords.filter(word => text.includes(word));
    
    if (foundBuzzWords.length >= 4) return 3;
    if (foundBuzzWords.length >= 2) return 2;
    if (foundBuzzWords.length >= 1) return 1;
    return 0;
}

/**
 * Analyze skills section organization quality
 */
function analyzeSkillsOrganization(resumeText) {
    let organizationScore = 0;
    const text = resumeText.toLowerCase();
    
    // Check for categorization indicators
    const categoryIndicators = [
        'programming languages', 'frameworks', 'databases', 'tools',
        'technical skills', 'soft skills', 'languages', 'certifications'
    ];
    
    const foundCategories = categoryIndicators.filter(category => text.includes(category));
    if (foundCategories.length >= 2) {
        organizationScore += 1; // Well-categorized skills
    }
    
    // Check for proper formatting (bullets, commas, etc.)
    const skillsSection = extractSkillsSection(resumeText);
    if (skillsSection) {
        const hasBullets = /[•▪▫■□◦‣⁃-]/.test(skillsSection);
        const hasCommas = skillsSection.includes(',');
        const hasLineBreaks = skillsSection.includes('\n');
        
        if (hasBullets || hasCommas || hasLineBreaks) {
            organizationScore += 1; // Good formatting
        }
    }
    
    return organizationScore;
}

/**
 * Extract skills section from resume
 */
function extractSkillsSection(resumeText) {
    const text = resumeText.toLowerCase();
    
    // Find skills section
    const skillsMarkers = ['skills', 'technical skills', 'competencies'];
    let skillsStart = -1;
    
    for (const marker of skillsMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1) {
            skillsStart = index;
            break;
        }
    }
    
    if (skillsStart === -1) return null;
    
    // Find end of skills section
    const endMarkers = ['experience', 'education', 'projects', 'certifications'];
    let skillsEnd = resumeText.length;
    
    for (const endMarker of endMarkers) {
        const endIndex = text.indexOf(endMarker, skillsStart + 10);
        if (endIndex !== -1 && endIndex < skillsEnd) {
            skillsEnd = endIndex;
        }
    }
    
    return resumeText.substring(skillsStart, skillsEnd);
}

/**
 * Analyze analytical skills mentions using categorized action verbs
 */
function analyzeAnalyticalSkills(resumeText, keywordsData) {
    let score = 0; // Start from 0 - purely content-based
    
    if (window.ActionVerbs) {
        // Count research and analysis action verbs
        const researchVerbCount = window.ActionVerbs.countVerbsInText(resumeText, 'RESEARCH_AND_ANALYSIS_SKILLS');
        const problemSolvingCount = window.ActionVerbs.countVerbsInText(resumeText, 'PROBLEM_SOLVING_SKILLS');
        
        // Score based on strong analytical action verbs found
        score += Math.min(researchVerbCount * 1.5, 6); // Up to 6 points for research verbs
        score += Math.min(problemSolvingCount * 1.2, 4); // Up to 4 points for problem-solving verbs
        
        // Check for analytical keywords in text
        const analyticalKeywords = ['analysis', 'analytical', 'data', 'research', 'statistics', 'metrics', 'insights'];
        const keywordCount = analyticalKeywords.filter(keyword => 
            resumeText.toLowerCase().includes(keyword)).length;
        score += Math.min(keywordCount * 0.3, 2); // Up to 2 points for keywords
    } else {
        // Fallback to original method if ActionVerbs not available
        const text = resumeText.toLowerCase();
        const analyticalWords = ['analysis', 'analytical', 'data', 'research', 'investigate', 'evaluate', 'assess', 'statistics'];
        const foundWords = analyticalWords.filter(word => text.includes(word)).length;
        score += Math.min(foundWords * 1.25, 10);
    }
    
    return Math.min(score, 10);
}

/**
 * Analyze leadership skills and experience using categorized action verbs
 */
function analyzeLeadershipSkills(resumeText, keywordsData) {
    let score = 0; // Start from 0 - purely content-based
    
    if (window.ActionVerbs) {
        // Count leadership and management action verbs
        const leadershipVerbCount = window.ActionVerbs.countVerbsInText(resumeText, 'LEADERSHIP_MENTORSHIP_AND_TEACHING_SKILLS');
        const managementVerbCount = window.ActionVerbs.countVerbsInText(resumeText, 'MANAGEMENT_SKILLS');
        
        // Score based on strong leadership action verbs found
        score += Math.min(leadershipVerbCount * 0.8, 6); // Up to 6 points for leadership verbs
        score += Math.min(managementVerbCount * 0.7, 4); // Up to 4 points for management verbs
        
        // Check for leadership position indicators
        const leadershipTitles = ['director', 'manager', 'lead', 'supervisor', 'head', 'chief', 'senior'];
        const titleCount = leadershipTitles.filter(title => 
            resumeText.toLowerCase().includes(title)).length;
        score += Math.min(titleCount * 0.3, 1); // Up to 1 point for titles
    } else {
        // Fallback to original method if ActionVerbs not available
        const text = resumeText.toLowerCase();
        const leadershipWords = ['lead', 'leader', 'manage', 'director', 'supervisor', 'team', 'mentor', 'coach'];
        const foundWords = leadershipWords.filter(word => text.includes(word)).length;
        score += Math.min(foundWords * 1.25, 10);
    }
    
    return Math.min(score, 10);
}

/**
 * Analyze bullet point usage and formatting
 */
function analyzeBulletUsage(resumeText, formattingData) {
    const bulletCount = (resumeText.match(/[•▪▫■□◦‣⁃]/g) || []).length;
    const dashCount = (resumeText.match(/^\s*[-*]\s/gm) || []).length;
    
    let score = 0; // Start from 0 - purely content-based
    
    if (bulletCount + dashCount > 10) {
        score += 6; // Excellent use of bullets
    } else if (bulletCount + dashCount > 5) {
        score += 4; // Good use of bullets
    } else if (bulletCount + dashCount > 0) {
        score += 2; // Some bullets
    }
    
    // Check for consistent bullet usage (2 points)
    if (bulletCount > dashCount || dashCount > bulletCount) {
        score += 2; // Consistent style
    }
    
    // Bonus for proper formatting (2 points)
    if ((bulletCount + dashCount) >= 3) {
        score += 2;
    }
    
    return Math.min(score, 10);
}

/**
 * Analyze spelling and consistency issues
 */
function analyzeSpellingConsistency(resumeText) {
    // Start async LLM analysis but return immediate fallback score
    analyzeLLMSpelling(resumeText).then(score => {
        updateSpellingScore(score);
    });
    
    // Return immediate fallback score  
    return getFallbackSpellingScore(resumeText);
}

/**
 * Analyze spelling using LLM for accurate assessment
 */
async function analyzeLLMSpelling(resumeText) {
    try {
        const response = await fetch('/api/grammar-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.dumps({
                text: resumeText,
                check_type: 'spelling'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return Math.max(Math.min(result.spelling_score || 8, 10), 0);
        }
    } catch (error) {
        console.warn('LLM spelling check failed, using fallback:', error);
    }
    
    // Fallback to basic spelling check
    let score = 0; // Start from 0 - purely content-based
    
    // Start with base score based on content length and quality indicators
    if (resumeText.length > 200) score = 8;
    else if (resumeText.length > 100) score = 6;
    else if (resumeText.length > 50) score = 4;
    else score = 2;
    
    // Common spelling errors to check for
    const commonErrors = ['recieved', 'seperate', 'managment', 'acheivement', 'excelent', 'experiance', 'responsibilty', 'occured'];
    const foundErrors = commonErrors.filter(error => resumeText.toLowerCase().includes(error)).length;
    
    score -= foundErrors * 1.5;
    
    // Check for inconsistent date formats
    const dateFormats = [
        /\d{1,2}\/\d{4}/g, // MM/YYYY
        /\d{4}-\d{2}/g,    // YYYY-MM
        /[A-Za-z]+ \d{4}/g // Month YYYY
    ];
    
    const formatCounts = dateFormats.map(regex => (resumeText.match(regex) || []).length);
    const multipleFormats = formatCounts.filter(count => count > 0).length;
    
    if (multipleFormats > 1) {
        score -= 1; // Inconsistent date formats
    }
    
    return Math.max(score, 0);
}

/**
 * Analyze grammar issues
 */
function analyzeGrammar(resumeText) {
    // Start async LLM analysis but return immediate fallback score
    analyzeLLMGrammar(resumeText).then(score => {
        updateGrammarScore(score);
    });
    
    // Return immediate fallback score
    return getFallbackGrammarScore(resumeText);
}

/**
 * Analyze grammar using LLM for accurate assessment
 */
async function analyzeLLMGrammar(resumeText) {
    try {
        const response = await fetch('/api/grammar-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: resumeText,
                check_type: 'grammar'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return Math.max(Math.min(result.grammar_score || 8, 10), 0);
        }
    } catch (error) {
        console.warn('LLM grammar check failed, using fallback:', error);
    }
    
    // Fallback to basic grammar check
    let score = 0; // Start from 0 - purely content-based
    
    // Check for basic grammar issues
    const grammarIssues = [
        /\bis\s+are\b/gi,  // Subject-verb disagreement
        /\bare\s+is\b/gi,
        /\bi\s+are\b/gi,
        /\byou\s+is\b/gi
    ];
    
    let issueCount = 0;
    grammarIssues.forEach(pattern => {
        issueCount += (resumeText.match(pattern) || []).length;
    });
    
    // Start with base score based on content quality
    if (resumeText.length > 100) score = 8;
    else if (resumeText.length > 50) score = 6;
    else score = 4;
    
    score -= Math.min(issueCount * 2, 6);
    
    return Math.max(score, 0);
}

/**
 * Analyze verb tense consistency
 */
function analyzeVerbTenses(resumeText) {
    let score = 0; // Start from 0 - purely content-based
    
    // Base score based on content quality
    if (resumeText.length > 100) score = 7;
    else if (resumeText.length > 50) score = 5;
    else score = 3;
    
    // Count present vs past tense in experience descriptions
    const pastTenseMarkers = resumeText.match(/\b\w+ed\b/g) || [];
    const presentTenseMarkers = resumeText.match(/\b(manage|lead|develop|create|implement)\b/gi) || [];
    
    // Mixed tenses in same role indicate problems
    if (pastTenseMarkers.length > 0 && presentTenseMarkers.length > 0) {
        const ratio = Math.min(pastTenseMarkers.length, presentTenseMarkers.length) / 
                     Math.max(pastTenseMarkers.length, presentTenseMarkers.length);
        
        if (ratio > 0.3) { // Significant mixing
            score -= 3;
        }
    }
    
    return Math.max(score, 3);
}

/**
 * Analyze weak verbs usage
 */
function analyzeWeakVerbs(resumeText) {
    if (window.ActionVerbs) {
        return analyzeActionVerbsComprehensive(resumeText);
    } else {
        // Fallback method if ActionVerbs not available
        return analyzeActionVerbsFallback(resumeText);
    }
}

/**
 * Comprehensive action verb analysis using the config system
 */
function analyzeActionVerbsComprehensive(resumeText) {
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
    
    // Categorize found verbs
    const categorizedVerbs = categorizeFoundVerbs(foundVerbs, strongVerbCategories);
    const weakVerbs = window.ActionVerbs.getVerbsForCategory('WEAK_VERBS');
    
    // Count categories represented
    const categoriesUsed = Object.keys(categorizedVerbs).length;
    
    // Apply category diversity penalty
    if (categoriesUsed < 5) {
        if (categoriesUsed === 4) score -= 1;
        else if (categoriesUsed === 3) score -= 2;
        else if (categoriesUsed === 2) score -= 3;
        else if (categoriesUsed === 1) score -= 4;
        else score -= 5; // 0 categories
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
            // Check if verb is in any strong category
            const isInStrongCategory = strongVerbCategories.some(category => {
                const categoryVerbs = window.ActionVerbs.getVerbsForCategory(category);
                return categoryVerbs.some(strongVerb => 
                    strongVerb.toLowerCase() === verb.toLowerCase() ||
                    strongVerb.toLowerCase().includes(verb.toLowerCase())
                );
            });
            
            if (!isInStrongCategory) {
                unknownVerbCount++;
            }
        }
    }
    
    // Apply penalties for weak and unknown verbs
    score -= (weakVerbCount + unknownVerbCount); // -1 per weak/unknown verb
    
    return Math.max(Math.min(score, 10), 0);
}

/**
 * Extract action verbs from resume text
 */
function extractActionVerbsFromText(resumeText) {
    const verbs = [];
    const text = resumeText.toLowerCase();
    
    // Common action verb patterns in resumes
    const verbPatterns = [
        // Past tense verbs (most common in experience)
        /\b(managed|led|developed|created|implemented|achieved|increased|reduced|improved|delivered|executed|coordinated|supervised|administered|analyzed|designed|established|facilitated|generated|initiated|launched|optimized|organized|planned|produced|provided|supported|trained|collaborated|communicated|negotiated|presented|resolved|streamlined|transformed|upgraded|built|maintained|monitored|oversaw|recruited|directed|guided|mentored|coached|evaluated|assessed|identified|researched|tested|reviewed|audited|calculated|forecasted|interviewed|investigated|traced|classified|collected|compiled|processed|recorded|scheduled|arranged|prepared|operated|handled|assisted|helped|contributed|participated|worked|responsible)\b/g,
        
        // Present tense verbs (for current roles)
        /\b(manage|lead|develop|create|implement|achieve|increase|reduce|improve|deliver|execute|coordinate|supervise|administer|analyze|design|establish|facilitate|generate|initiate|launch|optimize|organize|plan|produce|provide|support|train|collaborate|communicate|negotiate|present|resolve|streamline|transform|upgrade|build|maintain|monitor|oversee|recruit|direct|guide|mentor|coach|evaluate|assess|identify|research|test|review|audit|calculate|forecast|interview|investigate|trace|classify|collect|compile|process|record|schedule|arrange|prepare|operate|handle|assist|help|contribute|participate|work)\b/g
    ];
    
    for (const pattern of verbPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            verbs.push(...matches);
        }
    }
    
    // Remove duplicates and return unique verbs
    return [...new Set(verbs)];
}

/**
 * Categorize found verbs into strong verb categories
 */
function categorizeFoundVerbs(foundVerbs, categories) {
    const categorizedVerbs = {};
    
    for (const category of categories) {
        const categoryVerbs = window.ActionVerbs.getVerbsForCategory(category);
        const matchingVerbs = [];
        
        for (const verb of foundVerbs) {
            const isMatch = categoryVerbs.some(categoryVerb => 
                categoryVerb.toLowerCase() === verb.toLowerCase() ||
                categoryVerb.toLowerCase().includes(verb.toLowerCase()) ||
                verb.toLowerCase().includes(categoryVerb.toLowerCase())
            );
            
            if (isMatch) {
                matchingVerbs.push(verb);
            }
        }
        
        if (matchingVerbs.length > 0) {
            categorizedVerbs[category] = matchingVerbs;
        }
    }
    
    return categorizedVerbs;
}

/**
 * Fallback action verb analysis when ActionVerbs config not available
 */
function analyzeActionVerbsFallback(resumeText) {
    let score = 0; // Start from 0 for fallback
    
    const weakVerbs = ['responsible for', 'duties included', 'helped with', 'assisted in', 'involved in', 'worked on'];
    const strongVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'achieved', 'increased', 'improved'];
    
    const weakCount = weakVerbs.reduce((count, verb) => {
        return count + (resumeText.toLowerCase().split(verb).length - 1);
    }, 0);
    
    const strongCount = strongVerbs.reduce((count, verb) => {
        return count + (resumeText.toLowerCase().split(verb).length - 1);
    }, 0);
    
    if (strongCount > 0 && weakCount === 0) {
        score = 10;
    } else if (strongCount > weakCount) {
        score = 7;
    } else if (strongCount === weakCount && strongCount > 0) {
        score = 5;
    } else if (weakCount > strongCount && strongCount > 0) {
        score = 3;
    } else if (weakCount > 0 && strongCount === 0) {
        score = 1;
    } else {
        score = 4;
    }
    
    return Math.max(Math.min(score, 10), 0);
}

/**
 * Analyze active vs passive voice usage
 */
function analyzeActiveVoice(resumeText) {
    const passiveIndicators = ['was completed', 'were handled', 'was managed', 'were developed', 'was created'];
    let score = 0; // Start from 0 - purely content-based
    
    // Base score based on content quality
    if (resumeText.length > 100) score = 8;
    else if (resumeText.length > 50) score = 6;
    else score = 4;
    
    const passiveCount = passiveIndicators.reduce((count, phrase) => {
        return count + (resumeText.toLowerCase().split(phrase).length - 1);
    }, 0);
    
    score -= Math.min(passiveCount * 2, 6);
    
    return Math.max(score, 2);
}

/**
 * Analyze summary section quality with equal weightage for 5 components
 */
function analyzeSummarySection(resumeText) {
    let score = 0; // Start from 0, add 2 points for each component
    
    // Extract summary section
    const summarySection = extractSummarySection(resumeText);
    
    if (!summarySection || summarySection.length < 20) {
        return 1; // Minimal score if no summary found
    }
    
    // 1. Years of Experience (2 points)
    if (hasYearsOfExperience(summarySection)) {
        score += 2;
    }
    
    // 2. Key Skills (2 points) 
    if (hasKeySkills(summarySection)) {
        score += 2;
    }
    
    // 3. Buzz Words (2 points)
    if (hasBuzzWords(summarySection)) {
        score += 2;
    }
    
    // 4. Quantification (2 points)
    if (hasQuantification(summarySection)) {
        score += 2;
    }
    
    // 5. Brevity (2 points)
    if (checkBrevity(summarySection)) {
        score += 2;
    }
    
    return Math.min(score, 10);
}

/**
 * Extract summary/objective section from resume
 */
function extractSummarySection(resumeText) {
    const text = resumeText.toLowerCase();
    
    // Look for summary section markers
    const summaryMarkers = [
        'professional summary', 'executive summary', 'career summary',
        'summary', 'objective', 'profile', 'overview', 'about'
    ];
    
    let summaryStart = -1;
    let usedMarker = '';
    
    for (const marker of summaryMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1 && (summaryStart === -1 || index < summaryStart)) {
            summaryStart = index;
            usedMarker = marker;
        }
    }
    
    if (summaryStart === -1) {
        // If no explicit summary, try to extract first paragraph
        const paragraphs = resumeText.split('\n\n').filter(p => p.trim().length > 50);
        return paragraphs[0] || '';
    }
    
    // Find end of summary section
    const remainingText = resumeText.substring(summaryStart);
    const endMarkers = ['experience', 'work history', 'employment', 'education', 'skills'];
    let summaryEnd = remainingText.length;
    
    for (const endMarker of endMarkers) {
        const endIndex = remainingText.toLowerCase().indexOf(endMarker);
        if (endIndex !== -1 && endIndex < summaryEnd && endIndex > usedMarker.length + 10) {
            summaryEnd = endIndex;
        }
    }
    
    return remainingText.substring(0, summaryEnd).trim();
}

/**
 * Check for years of experience mention in summary
 */
function hasYearsOfExperience(summaryText) {
    const experiencePatterns = [
        /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi,
        /over\s*(\d+)\s*years?\s*(of\s*)?(experience|exp)/gi,
        /more than\s*(\d+)\s*years?\s*(of\s*)?(experience|exp)/gi,
        /(\d+)\+?\s*year\s*(experienced|professional)/gi,
        /(experienced|seasoned|veteran)\s*(professional|expert)/gi
    ];
    
    return experiencePatterns.some(pattern => pattern.test(summaryText));
}

/**
 * Check for key skills mention in summary
 */
function hasKeySkills(summaryText) {
    const text = summaryText.toLowerCase();
    
    // Technical skills
    const technicalSkills = [
        'python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'azure', 
        'docker', 'kubernetes', 'git', 'api', 'microservices', 'database',
        'machine learning', 'data science', 'analytics', 'cloud'
    ];
    
    // Professional skills  
    const professionalSkills = [
        'project management', 'leadership', 'team management', 'strategic planning',
        'business analysis', 'process improvement', 'stakeholder management',
        'cross-functional', 'agile', 'scrum', 'devops'
    ];
    
    const allSkills = [...technicalSkills, ...professionalSkills];
    const foundSkills = allSkills.filter(skill => text.includes(skill));
    
    return foundSkills.length >= 2; // At least 2 key skills mentioned
}

/**
 * Check for industry buzz words in summary
 */
function hasBuzzWords(summaryText) {
    const text = summaryText.toLowerCase();
    
    const buzzWords = [
        // Action/Impact words
        'drive', 'deliver', 'optimize', 'transform', 'innovate', 'scale', 'streamline',
        'accelerate', 'enhance', 'maximize', 'leverage', 'spearhead', 'pioneer',
        
        // Business terms
        'roi', 'revenue', 'growth', 'efficiency', 'performance', 'productivity',
        'competitive advantage', 'market leader', 'best practices', 'solutions',
        'strategy', 'vision', 'mission', 'goals', 'objectives',
        
        // Industry terms
        'digital transformation', 'automation', 'integration', 'scalability',
        'user experience', 'customer satisfaction', 'quality assurance',
        'compliance', 'security', 'innovation', 'emerging technologies'
    ];
    
    const foundBuzzWords = buzzWords.filter(word => text.includes(word));
    return foundBuzzWords.length >= 2; // At least 2 buzz words
}

/**
 * Check for quantification in summary
 */
function hasQuantification(summaryText) {
    const quantificationPatterns = [
        /\b\d+\.?\d*\s*%/g,                    // Percentages
        /\$[\d,]+\.?\d*[kmb]?/gi,             // Dollar amounts
        /\b\d{2,}[,\d]*\s*(users?|customers?|clients?|people|projects?|systems?|applications?)\b/gi, // Numbers with context
        /\b(\d+x|doubled?|tripled?)\b/gi,      // Multipliers
        /\b(over|more than|up to|above|exceeding?)\s*\d{2,}/gi, // Large numbers
        /\b\d+\s*(years?|months?)\s*(of\s*)?(experience|exp)/gi  // Experience numbers
    ];
    
    return quantificationPatterns.some(pattern => pattern.test(summaryText));
}

/**
 * Check brevity (2-4 sentences, 50-150 words)
 */
function checkBrevity(summaryText) {
    const wordCount = summaryText.trim().split(/\s+/).length;
    const sentenceCount = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
    
    // Optimal: 2-4 sentences, 50-150 words
    return (sentenceCount >= 2 && sentenceCount <= 4 && wordCount >= 50 && wordCount <= 150);
}

/**
 * Analyze teamwork and collaboration mentions using categorized action verbs
 */
function analyzeTeamworkSkills(resumeText) {
    let score = 0; // Start from 0 - purely content-based
    
    if (window.ActionVerbs) {
        // Count teamwork and collaboration action verbs
        const teamworkVerbCount = window.ActionVerbs.countVerbsInText(resumeText, 'TEAMWORK_COLLABORATION_SKILLS');
        const communicationVerbCount = window.ActionVerbs.countVerbsInText(resumeText, 'COMMUNICATION_SKILLS');
        
        // Score based on collaboration action verbs found
        score += Math.min(teamworkVerbCount * 1.5, 6); // Up to 6 points for teamwork verbs
        score += Math.min(communicationVerbCount * 0.2, 2); // Up to 2 points for communication verbs
        
        // Check for teamwork keywords
        const teamKeywords = ['team', 'cross-functional', 'partnership', 'stakeholders', 'collaboration'];
        const keywordCount = teamKeywords.filter(keyword => 
            resumeText.toLowerCase().includes(keyword)).length;
        score += Math.min(keywordCount * 0.4, 2); // Up to 2 points for keywords
    } else {
        // Fallback to original method if ActionVerbs not available
        const teamWords = ['team', 'collaborate', 'cooperation', 'partnership', 'group', 'cross-functional'];
        const text = resumeText.toLowerCase();
        const foundWords = teamWords.filter(word => text.includes(word)).length;
        score += Math.min(foundWords * 1.7, 10);
    }
    
    return Math.min(score, 10);
}

/**
 * Analyze repetition in content
 */
function analyzeRepetition(resumeText) {
    let score = 10; // Start at max, deduct for repetition issues
    
    // Check for repeated phrases (simple analysis)
    const words = resumeText.toLowerCase().split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
        if (word.length > 4) { // Only check substantial words
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    });
    
    // Count words that appear more than 5 times
    const overusedWords = Object.values(wordCount).filter(count => count > 5).length;
    score -= Math.min(overusedWords, 5);
    
    return Math.max(score, 3);
}

/**
 * Analyze unnecessary sections
 */
function analyzeUnnecessarySections(resumeText) {
    const text = resumeText.toLowerCase();
    let score = 10; // Start at max, deduct for unnecessary sections
    
    // Check for potentially unnecessary sections
    const unnecessarySections = ['references available', 'hobbies', 'interests', 'personal information'];
    const foundUnnecessary = unnecessarySections.filter(section => text.includes(section)).length;
    
    score -= foundUnnecessary * 2;
    
    return Math.max(score, 4);
}

/**
 * Analyze career growth and progression signals
 */
function analyzeGrowthSignals(resumeText) {
    const text = resumeText.toLowerCase();
    const growthWords = ['promoted', 'advancement', 'progression', 'senior', 'lead', 'principal', 'director'];
    
    let score = 0; // Start from 0 - purely content-based
    const foundWords = growthWords.filter(word => text.includes(word)).length;
    // Each growth word adds 1.4 points (up to 10 total)
    score += Math.min(foundWords * 1.4, 10);
    
    return Math.min(score, 10);
}

/**
 * Analyze page density based on formatting, word count, and experience-appropriate page count
 */
function analyzePageDensity(resumeText) {
    let score = 10; // Start with perfect score, deduct for issues
    
    // Calculate basic metrics
    const wordCount = resumeText.trim().split(/\s+/).length;
    const charCount = resumeText.length;
    const lineCount = resumeText.split('\n').length;
    
    // Estimate page count (roughly 500-600 words per page)
    const estimatedPages = Math.ceil(wordCount / 550);
    
    // Extract years of experience
    const yearsOfExperience = extractYearsOfExperience(resumeText);
    
    // Page count penalties based on experience
    if (yearsOfExperience < 6) {
        // For <6 years experience: should be 1 page
        if (estimatedPages > 1) {
            if (estimatedPages === 2) {
                score -= 4; // Heavy penalty for 2 pages when should be 1
            } else if (estimatedPages >= 3) {
                score -= 7; // Very heavy penalty for 3+ pages
            }
        }
    } else {
        // For 6+ years experience: can be 1-2 pages
        if (estimatedPages > 2) {
            score -= 5; // Heavy penalty for >2 pages regardless of experience
        }
    }
    
    // Word density analysis per estimated page
    const wordsPerPage = wordCount / estimatedPages;
    
    if (wordsPerPage < 300) {
        score -= 2; // Too sparse - wasting space
    } else if (wordsPerPage > 700) {
        score -= 3; // Too dense - hard to read
    }
    // Optimal range: 300-700 words per page (no penalty)
    
    // Character density analysis
    const avgWordsPerLine = wordCount / lineCount;
    if (avgWordsPerLine < 3) {
        score -= 1; // Too many short lines
    } else if (avgWordsPerLine > 15) {
        score -= 2; // Lines too long/dense
    }
    
    // Formatting quality analysis
    const formattingScore = analyzeFormattingQuality(resumeText);
    score += formattingScore; // Can add up to 2 points for excellent formatting
    
    // White space analysis
    const whitespaceRatio = (resumeText.match(/\s/g) || []).length / charCount;
    if (whitespaceRatio < 0.15) {
        score -= 2; // Too little white space - cramped
    } else if (whitespaceRatio > 0.25) {
        score -= 1; // Too much white space - wasteful
    }
    // Optimal whitespace ratio: 15-25%
    
    return Math.max(Math.min(score, 10), 0);
}

/**
 * Extract years of experience from resume text
 */
function extractYearsOfExperience(resumeText) {
    const text = resumeText.toLowerCase();
    
    // Look for explicit experience statements
    const experiencePatterns = [
        /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi,
        /over\s*(\d+)\s*years?\s*(of\s*)?(experience|exp)/gi,
        /more than\s*(\d+)\s*years?\s*(of\s*)?(experience|exp)/gi
    ];
    
    for (const pattern of experiencePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            const years = matches[0].match(/\d+/);
            if (years) {
                return parseInt(years[0]);
            }
        }
    }
    
    // Fallback: estimate from date ranges in experience section
    const currentYear = new Date().getFullYear();
    const yearMatches = resumeText.match(/\b(19|20)\d{2}\b/g);
    
    if (yearMatches && yearMatches.length >= 2) {
        const years = yearMatches.map(year => parseInt(year)).sort();
        const oldestYear = years[0];
        const newestYear = years[years.length - 1];
        
        // If newest year is current or recent, calculate experience
        if (newestYear >= currentYear - 1) {
            return Math.min(currentYear - oldestYear, 20); // Cap at 20 years
        }
    }
    
    // Default fallback based on resume length/complexity
    if (resumeText.length > 2000) return 8; // Assume experienced
    if (resumeText.length > 1500) return 5; // Assume mid-level
    return 3; // Assume junior
}

/**
 * Analyze formatting quality (sections, structure, consistency)
 */
function analyzeFormattingQuality(resumeText) {
    let formattingBonus = 0;
    
    // Check for proper section headers
    const sectionHeaders = [
        /\b(professional\s+)?(summary|objective|profile)\b/gi,
        /\b(professional\s+|work\s+)?experience\b/gi,
        /\beducation\b/gi,
        /\bskills\b/gi,
        /\b(contact|contact\s+information)\b/gi
    ];
    
    const sectionsFound = sectionHeaders.filter(pattern => pattern.test(resumeText)).length;
    if (sectionsFound >= 4) formattingBonus += 1; // Good section structure
    
    // Check for consistent bullet point usage
    const bulletCount = (resumeText.match(/[•▪▫■□◦‣⁃-]/g) || []).length;
    if (bulletCount >= 5) formattingBonus += 0.5; // Good use of bullets
    
    // Check for proper date formatting consistency
    const dateFormats = [
        (resumeText.match(/\d{4}\s*[-–]\s*\d{4}/g) || []).length, // 2020-2024
        (resumeText.match(/\d{1,2}\/\d{4}/g) || []).length,       // 01/2024
        (resumeText.match(/[A-Za-z]+\s+\d{4}/g) || []).length     // January 2024
    ];
    
    const maxDateFormat = Math.max(...dateFormats);
    const totalDates = dateFormats.reduce((sum, count) => sum + count, 0);
    
    if (totalDates > 0 && maxDateFormat / totalDates >= 0.8) {
        formattingBonus += 0.5; // Consistent date formatting
    }
    
    return Math.min(formattingBonus, 2); // Max 2 points bonus
}

/**
 * Analyze quantity impact based on quantified achievements in Professional Experience section
 */
function analyzeQuantityImpact(resumeText) {
    // Extract Professional Experience section
    const experienceSection = extractProfessionalExperience(resumeText);
    
    if (!experienceSection || experienceSection.length < 50) {
        return 0; // No experience section found
    }
    
    // Extract all bullet points/achievements from experience section
    const bulletPoints = extractBulletPoints(experienceSection);
    
    if (bulletPoints.length === 0) {
        return 0; // No bullet points found
    }
    
    // Count quantified vs total bullet points
    const quantifiedPoints = bulletPoints.filter(point => isQuantified(point));
    const totalPoints = bulletPoints.length;
    const quantificationPercentage = (quantifiedPoints.length / totalPoints) * 100;
    
    // Apply your exact scoring logic
    if (quantificationPercentage > 80) return 10;
    if (quantificationPercentage >= 70) return 9;
    if (quantificationPercentage >= 60) return 8;
    if (quantificationPercentage >= 50) return 7;
    if (quantificationPercentage >= 40) return 5;
    if (quantificationPercentage >= 30) return 4;
    if (quantificationPercentage >= 20) return 3;
    if (quantificationPercentage >= 10) return 2;
    if (quantificationPercentage > 0) return 1;
    return 0;
}

/**
 * Extract Professional Experience section from resume text
 */
function extractProfessionalExperience(resumeText) {
    const text = resumeText.toLowerCase();
    
    // Look for experience section markers
    const experienceMarkers = [
        'professional experience', 'work experience', 'employment history', 
        'career history', 'experience', 'employment', 'work history'
    ];
    
    // Find the start of experience section
    let experienceStart = -1;
    let usedMarker = '';
    
    for (const marker of experienceMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1 && (experienceStart === -1 || index < experienceStart)) {
            experienceStart = index;
            usedMarker = marker;
        }
    }
    
    if (experienceStart === -1) {
        // Fallback: look for job titles or company patterns
        return resumeText; // Analyze entire resume if no clear section found
    }
    
    // Find the end of experience section (before next major section)
    const endMarkers = ['education', 'skills', 'certifications', 'projects', 'awards'];
    let experienceEnd = resumeText.length;
    
    const remainingText = text.substring(experienceStart + usedMarker.length);
    for (const endMarker of endMarkers) {
        const endIndex = remainingText.indexOf(endMarker);
        if (endIndex !== -1 && endIndex < (experienceEnd - experienceStart - usedMarker.length)) {
            experienceEnd = experienceStart + usedMarker.length + endIndex;
        }
    }
    
    return resumeText.substring(experienceStart, experienceEnd);
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text) {
    // Look for bullet points with various markers
    const bulletPatterns = [
        /^[\s]*[•▪▫■□◦‣⁃]\s*(.+)$/gm,  // Unicode bullets
        /^[\s]*[-*]\s*(.+)$/gm,         // Dash/asterisk bullets  
        /^[\s]*\d+\.\s*(.+)$/gm,        // Numbered lists
        /^[\s]*[→‣►]\s*(.+)$/gm         // Arrow bullets
    ];
    
    const bulletPoints = [];
    
    for (const pattern of bulletPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].trim().length > 10) { // Only substantial bullet points
                bulletPoints.push(match[1].trim());
            }
        }
    }
    
    // If no formal bullets found, try to extract achievement-like sentences
    if (bulletPoints.length === 0) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        // Look for sentences that seem like achievements (contain action verbs)
        const achievementSentences = sentences.filter(sentence => {
            const lowerSentence = sentence.toLowerCase();
            return /\b(led|managed|developed|created|implemented|achieved|increased|reduced|improved|delivered|executed|coordinated|supervised)\b/.test(lowerSentence);
        });
        bulletPoints.push(...achievementSentences.map(s => s.trim()));
    }
    
    return bulletPoints;
}

/**
 * Check if a bullet point contains quantification
 */
function isQuantified(bulletPoint) {
    const text = bulletPoint.toLowerCase();
    
    // Pattern 1: Percentages (10%, 25%, etc.)
    if (/\b\d+\.?\d*\s*%/.test(text)) return true;
    
    // Pattern 2: Dollar amounts ($50K, $1.2M, $500,000, etc.)
    if (/\$[\d,]+\.?\d*[kmb]?/i.test(text)) return true;
    
    // Pattern 3: Large numbers with context (500 users, 10,000 customers, etc.)
    if (/\b\d{3,}[,\d]*\s*(users?|customers?|clients?|employees?|people|projects?|systems?|applications?|processes?|hours?|days?|months?|years?)\b/i.test(text)) return true;
    
    // Pattern 4: Time savings (2 hours, 30 minutes, 5 days, etc.)
    if (/\b\d+\.?\d*\s*(hours?|minutes?|days?|weeks?|months?|years?)\b.*\b(saved?|reduced?|faster|quicker)\b/i.test(text)) return true;
    
    // Pattern 5: Multipliers (2x, 3x faster, doubled, tripled, etc.)
    if (/\b(\d+x|doubled?|tripled?|quadrupled?)\b/i.test(text)) return true;
    
    // Pattern 6: Ranges (10-20, 5 to 15, between 100-200, etc.)
    if (/\b\d+[-–to]\d+\b/i.test(text)) return true;
    
    // Pattern 7: Team size (team of 5, managed 10 people, etc.)
    if (/\b(team of|managed?|led|supervised?)\s*\d+/i.test(text)) return true;
    
    // Pattern 8: Project scope (over 1000, more than 500, up to 2000, etc.)
    if (/\b(over|more than|up to|above|exceeding?)\s*\d{2,}/i.test(text)) return true;
    
    return false;
}

/**
 * Analyze drive and initiative indicators
 */
function analyzeDriveAndInitiative(resumeText) {
    const text = resumeText.toLowerCase();
    const driveWords = ['initiative', 'self-motivated', 'proactive', 'launched', 'founded', 'created', 'innovated'];
    
    let score = 0; // Start from 0 - purely content-based
    const foundWords = driveWords.filter(word => text.includes(word)).length;
    // Each drive word adds 1.4 points (up to 10 total)
    score += Math.min(foundWords * 1.4, 10);
    
    return Math.min(score, 10);
}

/**
 * Display main issues list with cards and FIX buttons
 */
function displayMainIssuesList(data) {
    if (!issuesList) return;
    
    issuesList.innerHTML = '';
    
    // Only show issues that need fixing (score < 10)
    const issuesNeedingFix = allIssues.filter(issue => issue.score && issue.score < 10);
    
    if (issuesNeedingFix.length === 0) {
        issuesList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Perfect ATS Score!</h3>
                <p class="text-gray-600">All categories are optimized. Your resume is ready!</p>
            </div>
        `;
        return;
    }
    
    // Create issue cards with scoring information
    issuesNeedingFix.forEach((issue, index) => {
        const card = document.createElement('div');
        card.className = `issue-card severity-${issue.severity}`;
        
        // Get score color
        const scoreColor = issue.score >= 8 ? 'text-yellow-600' : 
                          issue.score >= 6 ? 'text-orange-600' : 'text-red-600';
        
        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">${issue.title}</h3>
                    <div class="text-sm font-bold ${scoreColor}">${issue.score}/10</div>
                </div>
                <p class="text-gray-600 mb-3">${issue.description}</p>
                <div class="flex items-center justify-between">
                    <div class="impact-badge">
                        ${getImpactIcon(issue.impact)} ${getImpactLabel(issue.impact)}
                    </div>
                    <div class="text-xs text-gray-500">
                        ${getSeverityText(issue.severity)}
                    </div>
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${issue.title}', ${index})">
                FIX →
            </button>
        `;
        issuesList.appendChild(card);
    });
    
    // Add summary at the top
    const summaryCard = document.createElement('div');
    summaryCard.className = 'bg-blue-50 border border-blue-200 rounded-12 p-6 mb-6';
    summaryCard.innerHTML = `
        <div class="flex items-center mb-3">
            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900">ATS Analysis Summary</h3>
                <p class="text-sm text-gray-600">${issuesNeedingFix.length} areas need improvement out of 21 categories analyzed</p>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-center">
            <div>
                <div class="text-2xl font-bold text-red-600">${issuesNeedingFix.filter(i => i.severity === 'high').length}</div>
                <div class="text-xs text-gray-600 uppercase">High Priority</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-yellow-600">${issuesNeedingFix.length}</div>
                <div class="text-xs text-gray-600 uppercase">Need Fixes</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-green-600">${21 - issuesNeedingFix.length}</div>
                <div class="text-xs text-gray-600 uppercase">Completed</div>
            </div>
        </div>
    `;
    issuesList.insertBefore(summaryCard, issuesList.firstChild);
}

/**
 * Display strengths section
 */
function displayStrengths(data) {
    if (!strengthsList || !strengthsSection) return;
    
    const insights = data.insights || {};
    const strengths = insights.strengths || [
        { title: "Page density", description: "Your page layout looks right." },
        { title: "Dates are in the right format", description: "Your dates are in the right format." },
        { title: "Unique action verbs and phrases", description: "You didn't overuse any verbs or phrases." }
    ];
    
    strengthsList.innerHTML = '';
    
    strengths.slice(0, 3).forEach(strength => {
        const item = document.createElement('div');
        item.className = 'strength-item';
        item.innerHTML = `
            <div class="check-icon">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-900">${strength.title}:</h4>
                <p class="text-gray-600 mt-1">${strength.description}</p>
            </div>
        `;
        strengthsList.appendChild(item);
    });
}

/**
 * Get impact category from issue content
 */
function getImpactFromIssue(issue) {
    const text = (issue.title || issue.issue || '').toLowerCase();
    
    if (text.includes('bullet') || text.includes('length') || text.includes('brief')) return 'BREVITY';
    if (text.includes('verb') || text.includes('action') || text.includes('achieve')) return 'IMPACT';
    if (text.includes('education') || text.includes('section') || text.includes('format')) return 'SECTIONS';
    if (text.includes('style') || text.includes('font') || text.includes('format')) return 'STYLE';
    
    return 'ALL';
}

/**
 * Get impact icon for badge
 */
function getImpactIcon(impact) {
    const icons = {
        'BREVITY': '📝',
        'IMPACT': '⚡',
        'SECTIONS': '📋',
        'STYLE': '🎨',
        'ALL': '🎯'
    };
    return icons[impact] || '📌';
}

/**
 * Get impact label for badge
 */
function getImpactLabel(impact) {
    return impact || 'ALL';
}

/**
 * Get severity text for display
 */
function getSeverityText(severity) {
    const severityMap = {
        'high': 'High Priority',
        'medium': 'Medium Priority', 
        'low': 'Low Priority'
    };
    return severityMap[severity] || 'Medium Priority';
}

/**
 * Handle fix issue button click - Show specific CV lines with issues
 */
window.handleFixIssue = function(issueTitle, issueIndex) {
    console.log(`Fix requested for: ${issueTitle}`);
    
    // Generate specific examples for this issue
    const specificExamples = generateSpecificExamples(issueTitle, analysisData);
    
    // Show modal with specific line highlighting
    showIssueDetailModal(issueTitle, specificExamples);
};

/**
 * Generate specific examples from user's actual resume content
 */
function generateSpecificExamples(issueTitle, data) {
    const insights = data.insights || {};
    const resumeText = data.resume_text || data.text || "";
    
    // Extract actual problematic content from the analysis insights
    const examples = extractRealIssuesFromInsights(issueTitle, insights, resumeText);
    
    return examples;
}

/**
 * Extract real issues directly from ATS analysis insights
 */
function extractRealIssuesFromInsights(issueTitle, insights, resumeText) {
    const examples = [];
    
    // Get specific issues from the actual ATS analysis
    const quickWins = insights.quick_wins || [];
    const criticalIssues = insights.critical_issues || [];
    const improvementSuggestions = insights.improvement_suggestions || [];
    
    // Combine all analysis data
    const allAnalysisIssues = [...quickWins, ...criticalIssues, ...improvementSuggestions];
    
    // Find issues related to the current category
    const relatedIssues = findRelatedIssues(issueTitle, allAnalysisIssues, resumeText);
    
    // If we found specific issues from analysis, use them
    if (relatedIssues.length > 0) {
        relatedIssues.forEach(analysisIssue => {
            examples.push({
                line: extractRelevantLineFromResume(analysisIssue, resumeText),
                issue: analysisIssue.title || analysisIssue.issue || analysisIssue.suggestion || 'Issue needs attention',
                fix: analysisIssue.recommendation || analysisIssue.solution || `Improved version addressing: ${analysisIssue.issue || analysisIssue.suggestion}`,
                fromAnalysis: true
            });
        });
    } else {
        // If no specific analysis available, analyze the resume text directly
        const directAnalysis = analyzeResumeDirectly(issueTitle, resumeText);
        examples.push(...directAnalysis);
    }
    
    return examples.slice(0, 3); // Limit to 3 examples
}

/**
 * Find issues related to a specific category from analysis data
 */
function findRelatedIssues(issueTitle, analysisIssues, resumeText) {
    const categoryKeywords = getCategoryKeywords(issueTitle);
    
    return analysisIssues.filter(analysisIssue => {
        const issueText = (analysisIssue.title || analysisIssue.issue || analysisIssue.suggestion || '').toLowerCase();
        return categoryKeywords.some(keyword => issueText.includes(keyword));
    });
}

/**
 * Get keywords that relate to each ATS category
 */
function getCategoryKeywords(issueTitle) {
    const keywordMap = {
        'summary': ['summary', 'objective', 'profile', 'overview'],
        'quantity impact': ['quantify', 'metric', 'number', 'percentage', 'result', 'achievement'],
        'weak verbs': ['verb', 'action', 'responsible', 'duties', 'passive'],
        'verbosity': ['concise', 'wordy', 'lengthy', 'verbose', 'brief'],
        'spelling & consistency': ['spelling', 'typo', 'error', 'consistent', 'mistake'],
        'grammar': ['grammar', 'tense', 'sentence', 'structure'],
        'active voice': ['active', 'passive', 'voice'],
        'verb tenses': ['tense', 'past', 'present', 'consistent'],
        'education section': ['education', 'degree', 'university', 'school'],
        'skills section': ['skills', 'technical', 'competencies'],
        'contact details': ['contact', 'phone', 'email', 'address'],
        'use of bullets': ['bullet', 'format', 'list', 'structure']
    };
    
    return keywordMap[issueTitle.toLowerCase()] || [issueTitle.toLowerCase()];
}

/**
 * Extract relevant line from resume text based on analysis issue
 */
function extractRelevantLineFromResume(analysisIssue, resumeText) {
    if (!resumeText) return 'Content from your resume that needs attention';
    
    const lines = resumeText.split('\n').filter(line => line.trim().length > 10);
    
    // Try to find a line that relates to the issue
    const issueKeywords = (analysisIssue.title || analysisIssue.issue || '').toLowerCase().split(' ');
    
    for (let line of lines) {
        const lineWords = line.toLowerCase().split(' ');
        const matchCount = issueKeywords.filter(keyword => 
            lineWords.some(word => word.includes(keyword) && keyword.length > 3)
        ).length;
        
        if (matchCount > 0) {
            return line.trim();
        }
    }
    
    // If no specific match, return a relevant line based on category
    return findCategoryRelevantLine(analysisIssue, lines);
}

/**
 * Find a line relevant to the issue category
 */
function findCategoryRelevantLine(analysisIssue, lines) {
    const issueText = (analysisIssue.title || analysisIssue.issue || '').toLowerCase();
    
    // Look for lines that might contain the issue type
    for (let line of lines) {
        if (issueText.includes('verb') && (line.includes('responsible for') || line.includes('duties include'))) {
            return line.trim();
        }
        if (issueText.includes('quantify') && (line.includes('improved') || line.includes('increased')) && !line.match(/\d+/)) {
            return line.trim();
        }
        if (issueText.includes('summary') && (line.includes('seeking') || line.includes('professional'))) {
            return line.trim();
        }
    }
    
    // Return first substantial line as fallback
    return lines.find(line => line.length > 30)?.trim() || 'Sample content from your resume';
}

/**
 * Analyze resume directly when no specific insights available
 */
function analyzeResumeDirectly(issueTitle, resumeText) {
    if (!resumeText || resumeText.length < 50) {
        return [{
            line: 'Analysis requires resume content',
            issue: `${issueTitle} category needs review based on ATS standards`,
            fix: 'Upload your resume for detailed line-by-line analysis'
        }];
    }
    
    const lines = resumeText.split('\n').filter(line => line.trim().length > 15);
    const examples = [];
    
    // Basic pattern matching for common issues
    lines.forEach(line => {
        if (examples.length >= 2) return;
        
        const lineAnalysis = analyzeLineForCategory(line, issueTitle);
        if (lineAnalysis) {
            examples.push(lineAnalysis);
        }
    });
    
    if (examples.length === 0) {
        examples.push({
            line: lines[0] || 'Resume content',
            issue: `${issueTitle} optimization needed for better ATS performance`,
            fix: 'Professional optimization will improve this section for ATS systems'
        });
    }
    
    return examples;
}

/**
 * Analyze individual line for specific category issues
 */
function analyzeLineForCategory(line, issueTitle) {
    const category = issueTitle.toLowerCase();
    
    if (category.includes('verb') && (line.toLowerCase().includes('responsible for') || line.toLowerCase().includes('duties include'))) {
        return {
            line: line.trim(),
            issue: 'Uses weak passive language instead of strong action verbs',
            fix: 'Replace with specific action verbs showing leadership and results'
        };
    }
    
    if (category.includes('quantify') && (line.includes('improved') || line.includes('increased')) && !line.match(/\d+/)) {
        return {
            line: line.trim(),
            issue: 'Claims improvement without specific metrics or numbers',
            fix: 'Add quantified results with percentages, dollar amounts, or specific numbers'
        };
    }
    
    if (category.includes('spelling') && line.length > 50) {
        // Basic check for common patterns that might indicate issues
        return {
            line: line.trim(),
            issue: 'May contain spelling or consistency issues requiring review',
            fix: 'Professional review will identify and correct any errors'
        };
    }
    
    return null;
}

/**
 * Show modal with specific issue details and examples
 */
function showIssueDetailModal(issueTitle, examples) {
    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'issueDetailModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-900">Fix: ${issueTitle}</h2>
                <button onclick="closeIssueModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="p-6">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Specific Issues Found in Your Resume:</h3>
                    <p class="text-gray-600">Here are examples of areas that need improvement for better ATS optimization:</p>
                </div>
                
                ${examples.map((example, index) => `
                    <div class="mb-8 border border-gray-200 rounded-lg overflow-hidden">
                        <div class="bg-red-50 p-4 border-b border-gray-200">
                            <h4 class="font-semibold text-red-800 mb-2">❌ Current (Problematic):</h4>
                            <div class="bg-white p-3 rounded border-l-4 border-red-500">
                                <code class="text-sm text-gray-800">"${example.line}"</code>
                            </div>
                            <p class="text-sm text-red-700 mt-2"><strong>Issue:</strong> ${example.issue}</p>
                        </div>
                        
                        <div class="bg-green-50 p-4">
                            <h4 class="font-semibold text-green-800 mb-2">✅ Improved (ATS-Optimized):</h4>
                            <div class="bg-white p-3 rounded border-l-4 border-green-500">
                                <code class="text-sm text-gray-800">"${example.fix}"</code>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                    <h4 class="font-semibold text-blue-800 mb-3">💡 Why This Matters for ATS:</h4>
                    <p class="text-blue-700 text-sm">
                        ${getATSExplanation(issueTitle)}
                    </p>
                </div>
                
                <div class="flex gap-4 mt-8">
                    <button onclick="closeIssueModal()" class="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300">
                        I'll Fix This Manually
                    </button>
                    <button onclick="handleAutoFix('${issueTitle}')" class="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700">
                        🚀 Auto-Fix with AI - FREE
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Get ATS explanation for specific issue type
 */
function getATSExplanation(issueTitle) {
    const explanations = {
        'summary': 'ATS systems scan for specific keywords and value propositions in the summary. Generic statements reduce your ranking compared to candidates with targeted, quantified summaries.',
        'quantity impact': 'ATS algorithms favor resumes with quantified achievements. Numbers and metrics demonstrate measurable impact and help you stand out in automated screening.',
        'weak verbs': 'Strong action verbs signal leadership and initiative to ATS systems. Weak verbs like "responsible for" are passive and reduce the impact score of your accomplishments.',
        'verbosity': 'ATS systems may truncate overly long descriptions, causing important information to be missed. Concise, impactful statements ensure all your achievements are captured.',
        'spelling & consistency': 'ATS systems flag spelling errors as quality indicators. Even minor mistakes can significantly impact your overall ATS score and prevent you from reaching human reviewers.',
        'active voice': 'ATS systems favor active voice as it demonstrates ownership and leadership. Passive voice can make your achievements seem less impactful and reduce keyword matching.',
        'verb tenses': 'Consistent verb tenses help ATS systems understand your career timeline. Inconsistent tenses can confuse parsing algorithms and misrepresent your experience.'
    };
    
    return explanations[issueTitle.toLowerCase()] || 'Optimizing this area will improve your ATS score and increase your chances of passing automated screening systems used by most companies.';
}

/**
 * Close the issue detail modal
 */
window.closeIssueModal = function() {
    const modal = document.getElementById('issueDetailModal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Handle auto-fix request
 */
window.handleAutoFix = function(issueTitle) {
    console.log(`Auto-fix requested for: ${issueTitle}`);
    
    // Close modal and redirect to upgrade/payment
    closeIssueModal();
    
    // Store context for payment page
    sessionStorage.setItem('fixIssue', issueTitle);
    sessionStorage.setItem('pendingUpgrade', 'true');
    sessionStorage.setItem('upgradeSource', 'specific_fix');
    
    if (upgradeBtn) {
        upgradeBtn.click();
    }
};

/**
 * Setup event handlers
 */
function setupEventHandlers() {
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            // Store current analysis data for payment page
            sessionStorage.setItem('pendingUpgrade', 'true');
            sessionStorage.setItem('upgradeSource', 'results_page');
            
            // Navigate to payment page
            window.location.href = './payment.html';
        });
    }
}

/**
 * Handle errors gracefully
 */
function handleError(error, context = '') {
    console.error(`Error in results page ${context}:`, error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-4 m-4';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <div>
                <h3 class="text-sm font-medium text-red-800">Unable to load results</h3>
                <p class="text-sm text-red-700 mt-1">Please try analyzing your resume again.</p>
            </div>
        </div>
    `;
    
    // Insert error message at the top of the page
    const main = document.querySelector('main') || document.body;
    main.insertBefore(errorDiv, main.firstChild);
}

// Initialize when DOM is loaded and ActionVerbs is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithActionVerbs);
} else {
    initializeWithActionVerbs();
}

/**
 * Initialize application with ActionVerbs support
 */
async function initializeWithActionVerbs() {
    try {
        // Ensure ActionVerbs is loaded
        if (window.ActionVerbs) {
            await window.ActionVerbs.loadActionVerbs();
        }
        console.log('ActionVerbs module loaded, initializing results page');
    } catch (error) {
        console.warn('Failed to load ActionVerbs, proceeding with fallback analysis:', error);
    }
    
    // Initialize the main application
    init();
}

/**
 * Get fallback grammar score while LLM processes
 */
function getFallbackGrammarScore(resumeText) {
    let score = 0; // Start from 0 - purely content-based
    
    // Check for basic grammar issues
    const grammarIssues = [
        /\bis\s+are\b/gi,  // Subject-verb disagreement
        /\bare\s+is\b/gi,
        /\bi\s+are\b/gi,
        /\byou\s+is\b/gi
    ];
    
    let issueCount = 0;
    grammarIssues.forEach(pattern => {
        issueCount += (resumeText.match(pattern) || []).length;
    });
    
    // Start with base score based on content quality
    if (resumeText.length > 100) score = 8;
    else if (resumeText.length > 50) score = 6;
    else score = 4;
    
    score -= Math.min(issueCount * 2, 6);
    
    return Math.max(score, 0);
}

/**
 * Get fallback spelling score while LLM processes
 */
function getFallbackSpellingScore(resumeText) {
    let score = 0; // Start from 0 - purely content-based
    
    // Start with base score based on content length and quality indicators
    if (resumeText.length > 200) score = 8;
    else if (resumeText.length > 100) score = 6;
    else if (resumeText.length > 50) score = 4;
    else score = 2;
    
    // Common spelling errors to check for
    const commonErrors = ['recieved', 'seperate', 'managment', 'acheivement', 'excelent', 'experiance', 'responsibilty', 'occured'];
    const foundErrors = commonErrors.filter(error => resumeText.toLowerCase().includes(error)).length;
    
    score -= foundErrors * 1.5;
    
    // Check for inconsistent date formats
    const dateFormats = [
        /\d{1,2}\/\d{4}/g, // MM/YYYY
        /\d{4}-\d{2}/g,    // YYYY-MM
        /[A-Za-z]+ \d{4}/g // Month YYYY
    ];
    
    const formatCounts = dateFormats.map(regex => (resumeText.match(regex) || []).length);
    const multipleFormats = formatCounts.filter(count => count > 0).length;
    
    if (multipleFormats > 1) {
        score -= 1; // Inconsistent date formats
    }
    
    return Math.max(score, 0);
}

/**
 * Update grammar score when LLM analysis completes
 */
function updateGrammarScore(newScore) {
    // Find and update the grammar category score in the UI
    const grammarElements = document.querySelectorAll('[data-category="Grammar"]');
    grammarElements.forEach(element => {
        const scoreElement = element.querySelector('.score');
        if (scoreElement) {
            scoreElement.textContent = `${newScore}/10`;
            // Update color based on new score
            scoreElement.className = `score ${newScore >= 8 ? 'text-green-600' : newScore >= 6 ? 'text-yellow-600' : 'text-red-600'}`;
        }
    });
    
    // Recalculate overall score
    recalculateOverallScore();
}

/**
 * Update spelling score when LLM analysis completes
 */
function updateSpellingScore(newScore) {
    // Find and update the spelling category score in the UI
    const spellingElements = document.querySelectorAll('[data-category="Spelling & Consistency"]');
    spellingElements.forEach(element => {
        const scoreElement = element.querySelector('.score');
        if (scoreElement) {
            scoreElement.textContent = `${newScore}/10`;
            // Update color based on new score
            scoreElement.className = `score ${newScore >= 8 ? 'text-green-600' : newScore >= 6 ? 'text-yellow-600' : 'text-red-600'}`;
        }
    });
    
    // Recalculate overall score
    recalculateOverallScore();
}

/**
 * Recalculate overall score when individual scores are updated
 */
function recalculateOverallScore() {
    // This would recalculate the total score from all visible category scores
    // and update the main score display
    const allScoreElements = document.querySelectorAll('.score');
    let totalScore = 0;
    let categoryCount = 0;
    
    allScoreElements.forEach(element => {
        const scoreText = element.textContent.match(/(\d+)\/10/);
        if (scoreText) {
            totalScore += parseInt(scoreText[1]);
            categoryCount++;
        }
    });
    
    if (categoryCount > 0) {
        const averageScore = Math.round((totalScore / categoryCount) * (100/10)); // Scale to 100
        const overallScoreElement = document.querySelector('#overall-score');
        if (overallScoreElement) {
            overallScoreElement.textContent = averageScore;
        }
    }
}

// Export for debugging
window.debugResults = {
    analysisData: () => analysisData,
    allIssues: () => allIssues,
    reinit: init
};