/**
 * SIMPLIFIED RESULT PAGE - Backend Data Only
 * No frontend scoring logic, just display backend results
 */

// DOM Elements
const atsScore = document.getElementById('atsScore');
const scoreCircle = document.getElementById('scoreCircle');
const markedAsDone = document.getElementById('markedAsDone');
const topFixesList = document.getElementById('topFixesList');
const completedList = document.getElementById('completedList');
const issuesList = document.getElementById('issuesList');
const strengthsList = document.getElementById('strengthsList');
const upgradeBtn = document.getElementById('upgradeBtn');
const summaryText = document.getElementById('summaryText');
const highPriorityCount = document.getElementById('highPriorityCount');
const needFixesCount = document.getElementById('needFixesCount');
const completedCount = document.getElementById('completedCount');

// Get data from session storage
let analysisData;
try {
    const rawData = sessionStorage.getItem('atsAnalysis');
    console.log('📊 Raw session data:', rawData);
    analysisData = JSON.parse(rawData || '{}');
    console.log('📊 Parsed Analysis Data:', analysisData);
} catch (error) {
    console.error('❌ Failed to parse session data:', error);
    analysisData = {};
}

/**
 * Initialize the result page
 */
function initializeResultPage() {
    console.log('🚀 Initializing result page...');
    
    // Check all possible session storage keys for debugging
    console.log('🔍 All session storage keys:', Object.keys(sessionStorage));
    console.log('🔍 atsAnalysis:', sessionStorage.getItem('atsAnalysis'));
    console.log('🔍 atsResults:', sessionStorage.getItem('atsResults'));
    
    if (!analysisData || Object.keys(analysisData).length === 0) {
        console.error('❌ No analysis data found');
        
        // Try alternative keys
        const altData = sessionStorage.getItem('atsResults') || sessionStorage.getItem('analysisResults');
        if (altData) {
            console.log('📊 Found alternative data:', altData);
            try {
                analysisData = JSON.parse(altData);
                console.log('📊 Using alternative data:', analysisData);
            } catch (e) {
                console.error('❌ Failed to parse alternative data:', e);
            }
        }
        
        if (!analysisData || Object.keys(analysisData).length === 0) {
            showError('No analysis data found. Please upload your resume again.');
            return;
        }
    }
    
    // Display overall score
    displayOverallScore();
    
    // Display component breakdown
    displayComponentBreakdown();
    
    // Setup toggle functionality
    setupToggle();
    
    // Setup upgrade button
    setupUpgradeButton();
    
    // Setup modal event listeners
    setupModalEventListeners();
    
    console.log('✅ Result page initialized successfully');
}

/**
 * Display overall ATS score from backend
 */
function displayOverallScore() {
    if (!atsScore) return;
    
    // Backend sends 'score' field, not 'ats_score'
    const finalScore = Math.round(analysisData.score || analysisData.ats_score || 0);
    atsScore.textContent = finalScore;
    
    console.log('📊 SCORE DEBUG: Received scores from backend:', { 
        score: analysisData.score, 
        ats_score: analysisData.ats_score,
        finalUsed: finalScore,
        whichFieldUsed: analysisData.score ? 'score' : 'ats_score'
    });
    
    // Update color based on score
    if (scoreCircle) {
        if (finalScore >= 80) {
            scoreCircle.style.borderColor = '#10b981'; // Green
        } else if (finalScore >= 60) {
            scoreCircle.style.borderColor = '#f59e0b'; // Yellow
        } else {
            scoreCircle.style.borderColor = '#ef4444'; // Red
        }
    }
}

/**
 * Display component breakdown from backend
 */
function displayComponentBreakdown() {
    // Backend sends detailedAnalysis, not component_scores and detailed_analysis
    const detailed = analysisData.detailedAnalysis || analysisData.detailed_analysis || {};
    const components = analysisData.component_scores || {}; // This may be empty
    
    console.log('📊 DEBUG: Full analysisData keys:', Object.keys(analysisData));
    console.log('📊 DEBUG: analysisData.detailedAnalysis exists:', !!analysisData.detailedAnalysis);
    console.log('📊 DEBUG: analysisData.detailed_analysis exists:', !!analysisData.detailed_analysis);
    console.log('📊 DEBUG: detailedAnalysis keys:', analysisData.detailedAnalysis ? Object.keys(analysisData.detailedAnalysis) : 'NONE');
    console.log('📊 DEBUG: detailedAnalysis count:', analysisData.detailedAnalysis ? Object.keys(analysisData.detailedAnalysis).length : 0);
    console.log('📊 Detailed Analysis:', detailed);
    console.log('📊 Component Scores:', components);
    
    // Clear existing content
    if (topFixesList) topFixesList.innerHTML = '';
    if (completedList) completedList.innerHTML = '';
    if (issuesList) issuesList.innerHTML = '';
    
    // Create categories from backend data
    const categories = createCategoriesFromBackend(components, detailed);
    
    // Sort categories by score
    const lowScore = categories.filter(cat => cat.score < 6);
    const mediumScore = categories.filter(cat => cat.score >= 6 && cat.score < 9);
    const highScore = categories.filter(cat => cat.score >= 9);
    
    console.log('📊 Category breakdown:', {
        low: lowScore.length,
        medium: mediumScore.length,
        high: highScore.length,
        total: categories.length
    });
    
    // Update summary text
    if (summaryText) {
        const totalIssues = lowScore.length + mediumScore.length;
        summaryText.textContent = `${totalIssues} areas need improvement out of ${categories.length} categories analyzed`;
    }
    
    // Update counts
    if (highPriorityCount) highPriorityCount.textContent = lowScore.length;
    if (needFixesCount) needFixesCount.textContent = mediumScore.length;
    if (completedCount) completedCount.textContent = highScore.length;
    if (markedAsDone) markedAsDone.textContent = `${highScore.length} COMPLETED`;
    
    // Display in sidebar
    displaySidebarItems(lowScore, mediumScore, highScore);
    
    // Display detailed issues
    displayDetailedIssues(lowScore, mediumScore);
    
    // Display strengths
    displayStrengths(highScore);
}

/**
 * Create categories from backend component data
 */
function createCategoriesFromBackend(components, detailed) {
    const categories = [];
    
    console.log('🔍 Creating categories from comprehensive backend analysis:', detailed);
    
    // USE COMPREHENSIVE BACKEND CATEGORIES (23+ categories from frontend logic)
    if (detailed && Object.keys(detailed).length > 0) {
        // Convert backend comprehensive analysis to frontend format
        Object.entries(detailed).forEach(([key, data]) => {
            if (data && typeof data.score !== 'undefined') {
                const score = Math.max(0, Math.min(10, Math.round(data.score)));
                
                // Convert key back to readable name
                const name = key.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ').replace('And', '&');
                
                const issue = data.issues && data.issues.length > 0 ? data.issues[0] : 'Needs improvement';
                const impact = data.impact || 'IMPROVEMENT';
                
                categories.push({
                    name: name,
                    score: score,
                    issue: issue,
                    impact: impact
                });
                
                console.log(`📊 ${name}: ${score}/10`);
            } else {
                console.warn(`⚠️ No data for ${key}:`, data);
            }
        });
    } else {
        console.error('❌ No comprehensive backend analysis found');
    }
    
    console.log(`📊 Final categories created: ${categories.length} total`);
    console.log('📊 Categories:', categories.map(cat => cat.name));
    return categories;
}

// Helper functions removed - now using comprehensive backend data directly

/**
 * Display sidebar items
 */
function displaySidebarItems(lowScore, mediumScore, highScore) {
    // Top Fixes (low + medium scores)
    if (topFixesList) {
        [...lowScore, ...mediumScore].forEach(category => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            const color = category.score < 6 ? 'text-red-600' : 'text-orange-600';
            item.innerHTML = `
                <span class="text-sm text-gray-700">${category.name}</span>
                <span class="text-sm font-bold ${color}">${category.score}/10</span>
            `;
            topFixesList.appendChild(item);
        });
    }
    
    // Completed
    if (completedList) {
        highScore.forEach(category => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.innerHTML = `
                <span class="text-sm text-gray-700">${category.name}</span>
                <span class="text-sm font-bold text-green-600">${category.score}/10</span>
            `;
            completedList.appendChild(item);
        });
    }
}

/**
 * Display detailed issues
 */
function displayDetailedIssues(lowScore, mediumScore) {
    if (!issuesList) return;
    
    const allIssues = [...lowScore, ...mediumScore];
    
    if (allIssues.length === 0) {
        issuesList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Perfect ATS Score!</h3>
                <p class="text-gray-600">All categories are optimized. Your resume is ready!</p>
            </div>
        `;
        return;
    }
    
    allIssues.forEach((issue, index) => {
        const card = document.createElement('div');
        const severityClass = issue.score < 6 ? 'severity-high' : 'severity-medium';
        const impactBadgeClass = issue.score < 6 ? 'high' : 'medium';
        
        card.className = `issue-card ${severityClass}`;
        card.innerHTML = `
            <div class="issue-content">
                <h3>${issue.name}</h3>
                <p>${issue.issue}</p>
                <div class="issue-meta">
                    <span class="score-badge">${issue.score}/10</span>
                    <span class="impact-badge ${impactBadgeClass}">${issue.impact}</span>
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${issue.name}', ${index})">
                FIX →
            </button>
        `;
        issuesList.appendChild(card);
    });
}

/**
 * Display strengths
 */
function displayStrengths(highScore) {
    if (!strengthsList) return;
    
    if (highScore.length === 0) {
        strengthsList.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600">Complete the improvements above to unlock your strengths!</p>
            </div>
        `;
        return;
    }
    
    highScore.forEach(strength => {
        const item = document.createElement('div');
        item.className = 'strength-item';
        item.innerHTML = `
            <div class="check-icon">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="strength-content">
                <h4>${strength.name}</h4>
                <p>Excellent! Your ${strength.name.toLowerCase()} is well-optimized for ATS systems.</p>
            </div>
        `;
        strengthsList.appendChild(item);
    });
}

/**
 * Setup toggle functionality
 */
function setupToggle() {
    const toggleBtn = document.getElementById('toggleIssuesBtn');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (toggleBtn && issuesList && toggleIcon) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = issuesList.classList.contains('hidden');
            
            if (isHidden) {
                issuesList.classList.remove('hidden');
                toggleIcon.style.transform = 'rotate(180deg)';
                toggleBtn.querySelector('h3').textContent = 'Hide Detailed Issues';
                toggleBtn.querySelector('p').textContent = 'Collapse the detailed issues list';
            } else {
                issuesList.classList.add('hidden');
                toggleIcon.style.transform = 'rotate(0deg)';
                toggleBtn.querySelector('h3').textContent = 'View Detailed Issues';
                toggleBtn.querySelector('p').textContent = 'See exactly what needs to be fixed in your resume';
            }
        });
    }
}

/**
 * Setup upgrade button
 */
function setupUpgradeButton() {
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            // Store current analysis data for payment page
            sessionStorage.setItem('pendingRewrite', JSON.stringify(analysisData));
            window.location.href = './payment.html';
        });
    }
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    const modal = document.getElementById('issueModal');
    const closeModal = document.getElementById('closeModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalFixAllBtn = document.getElementById('modalFixAllBtn');
    
    // Close modal handlers
    [closeModal, modalCloseBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeIssueModal);
        }
    });
    
    // Fix all button handler
    if (modalFixAllBtn) {
        modalFixAllBtn.addEventListener('click', handleModalFixAll);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeIssueModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeIssueModal();
        }
    });
}

/**
 * Handle fix issue button click - Show modal with specific issues
 */
function handleFixIssue(issueName, index) {
    console.log('🔧 Fix issue clicked:', issueName, index);
    showIssueModal(issueName);
}

/**
 * Show modal with specific issues for a category
 */
function showIssueModal(categoryName) {
    const modal = document.getElementById('issueModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalIssuesList = document.getElementById('modalIssuesList');
    
    if (!modal || !modalTitle || !modalIssuesList) {
        console.error('Modal elements not found');
        return;
    }
    
    // Update modal title
    modalTitle.textContent = `${categoryName} Issues Found`;
    
    // Generate specific issues for this category
    const specificIssues = generateSpecificIssues(categoryName);
    
    // Clear and populate issues list
    modalIssuesList.innerHTML = '';
    specificIssues.forEach((issue, index) => {
        const issueElement = document.createElement('div');
        issueElement.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4';
        issueElement.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 mb-1">${issue.description}</p>
                    <div class="bg-white border border-gray-200 rounded p-2 font-mono text-xs text-gray-700">
                        "${issue.cvLine}"
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Line ${issue.lineNumber} in your resume</p>
                </div>
            </div>
        `;
        modalIssuesList.appendChild(issueElement);
    });
    
    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Generate specific issues with CV line references for a category
 */
function generateSpecificIssues(categoryName) {
    // Get the original resume content if available
    const resumeContent = analysisData.content || "";
    if (!resumeContent) {
        return [{ description: 'Resume content not available for detailed analysis', cvLine: 'Please re-upload your resume', lineNumber: 0 }];
    }
    
    const lines = resumeContent.split('\n').filter(line => line.trim().length > 5);
    
    // Find actual issues in the CV content based on category
    let issues = [];
    
    switch (categoryName) {
        case 'Personal Pronouns':
            issues = findPersonalPronounIssues(lines);
            break;
        case 'Grammar':
            issues = findGrammarIssues(lines);
            break;
        case 'Spelling':
            issues = findSpellingIssues(lines);
            break;
        case 'Action Verbs':
            issues = findActionVerbIssues(lines);
            break;
        case 'Contact Details':
            issues = findContactIssues(lines);
            break;
        case 'Education Section':
            issues = findEducationIssues(lines);
            break;
        case 'Skills Section':
            issues = findSkillsIssues(lines);
            break;
        case 'Use Of Bullets':
            issues = findBulletIssues(lines);
            break;
        case 'Quantifiable Achievements':
            issues = findQuantifiableIssues(lines);
            break;
        case 'Summary':
            issues = findSummaryIssues(lines);
            break;
        case 'Repetition':
            issues = findRepetitionIssues(lines);
            break;
        case 'Verbosity':
            issues = findVerbosityIssues(lines);
            break;
        case 'Verb Tenses':
            issues = findVerbTenseIssues(lines);
            break;
        case 'Active Voice':
            issues = findActiveVoiceIssues(lines);
            break;
        case 'Page Density':
            issues = findPageDensityIssues(lines);
            break;
        case 'Unnecessary Sections':
            issues = findUnnecessarySectionIssues(lines);
            break;
        case 'Growth Signals':
            issues = findGrowthSignalIssues(lines);
            break;
        case 'Drive':
            issues = findDriveIssues(lines);
            break;
        case 'Leadership':
            issues = findLeadershipIssues(lines);
            break;
        case 'Teamwork':
            issues = findTeamworkIssues(lines);
            break;
        case 'Analytical':
            issues = findAnalyticalIssues(lines);
            break;
        case 'Certifications':
            issues = findCertificationIssues(lines);
            break;
        default:
            issues = findGenericIssues(lines, categoryName);
            break;
    }
    
    // Return max 3 issues
    return issues.slice(0, 3);
}

/**
 * Find actual personal pronoun issues in CV lines
 */
function findPersonalPronounIssues(lines) {
    const issues = [];
    const pronouns = ['I ', ' I ', 'My ', 'Me ', 'Myself', 'Mine'];
    
    lines.forEach((line, index) => {
        const pronounFound = pronouns.find(pronoun => line.includes(pronoun));
        if (pronounFound) {
            issues.push({
                description: `Remove personal pronoun "${pronounFound.trim()}" for professional tone`,
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Personal pronouns detected in resume content',
            cvLine: 'No specific examples found in current analysis',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find grammar issues in CV lines
 */
function findGrammarIssues(lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
        // Check for common grammar issues
        if (line.includes(' and ') && !line.includes(',') && line.length > 50) {
            issues.push({
                description: 'Consider adding comma before coordinating conjunction',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        } else if (line.match(/\b(develop|create|manage)\b.*\b(developed|created|managed)\b/i)) {
            issues.push({
                description: 'Inconsistent verb tense in same sentence',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Grammar improvements suggested for this section',
            cvLine: lines[0] || 'No content available',
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find spelling issues in CV lines
 */
function findSpellingIssues(lines) {
    const issues = [];
    const commonMisspellings = {
        'managment': 'management',
        'developement': 'development',
        'responsable': 'responsible',
        'sucessful': 'successful',
        'comunication': 'communication'
    };
    
    lines.forEach((line, index) => {
        Object.keys(commonMisspellings).forEach(misspelling => {
            if (line.toLowerCase().includes(misspelling)) {
                issues.push({
                    description: `Misspelled word: "${misspelling}" should be "${commonMisspellings[misspelling]}"`,
                    cvLine: line.trim(),
                    lineNumber: index + 1
                });
            }
        });
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Spelling optimization suggested for better ATS compatibility',
            cvLine: lines[0] || 'No content available',
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find action verb issues in CV lines
 */
function findActionVerbIssues(lines) {
    const issues = [];
    const weakVerbs = ['did', 'worked on', 'was responsible', 'helped with', 'involved in'];
    
    lines.forEach((line, index) => {
        const weakVerb = weakVerbs.find(verb => line.toLowerCase().includes(verb));
        if (weakVerb) {
            issues.push({
                description: `Replace weak verb phrase "${weakVerb}" with stronger action verb`,
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Action verb strength can be improved',
            cvLine: lines[0] || 'No content available',
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find contact detail issues
 */
function findContactIssues(lines) {
    const issues = [];
    const firstFewLines = lines.slice(0, 10);
    
    const hasEmail = firstFewLines.some(line => line.includes('@'));
    const hasPhone = firstFewLines.some(line => /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line));
    const hasLinkedIn = firstFewLines.some(line => line.toLowerCase().includes('linkedin'));
    
    if (!hasEmail) {
        issues.push({
            description: 'Professional email address should be prominently displayed',
            cvLine: firstFewLines[0] || 'Header section',
            lineNumber: 1
        });
    }
    
    if (!hasPhone) {
        issues.push({
            description: 'Phone number should be included in contact information',
            cvLine: firstFewLines[0] || 'Header section',
            lineNumber: 1
        });
    }
    
    if (!hasLinkedIn) {
        issues.push({
            description: 'LinkedIn profile URL should be included',
            cvLine: firstFewLines[0] || 'Header section',
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find education section issues
 */
function findEducationIssues(lines) {
    const issues = [];
    const educationKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd', 'graduated'];
    
    const hasEducationSection = lines.some(line => 
        educationKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasEducationSection) {
        issues.push({
            description: 'Education section not clearly identified',
            cvLine: 'Add clear education section with degree details',
            lineNumber: 0
        });
    }
    
    // Check for missing graduation years
    const educationLines = lines.filter(line => 
        educationKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    educationLines.forEach((line, index) => {
        if (!line.match(/\b(19|20)\d{2}\b/) && !line.match(/\b\d{4}\b/)) {
            issues.push({
                description: 'Missing graduation year in education entry',
                cvLine: line.trim(),
                lineNumber: lines.indexOf(line) + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Education section format can be optimized',
            cvLine: educationLines[0] || 'Education section',
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find skills section issues
 */
function findSkillsIssues(lines) {
    const issues = [];
    const skillsKeywords = ['skills', 'technical skills', 'core competencies', 'technologies'];
    
    const skillsSectionLine = lines.find(line => 
        skillsKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!skillsSectionLine) {
        issues.push({
            description: 'Skills section not clearly labeled',
            cvLine: 'Add dedicated skills or technical competencies section',
            lineNumber: 0
        });
    }
    
    // Check for comma-separated vs bullet format
    lines.forEach((line, index) => {
        if (line.includes(',') && line.split(',').length > 5) {
            issues.push({
                description: 'Long comma-separated list - consider bullet points',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Skills presentation can be enhanced for ATS parsing',
            cvLine: skillsSectionLine || lines[0],
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find bullet point issues
 */
function findBulletIssues(lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Check for lines that should be bullets but aren't
        if (trimmed.match(/^(managed|led|developed|created|implemented|achieved)/i) && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
            issues.push({
                description: 'Achievement statement should use bullet points',
                cvLine: trimmed,
                lineNumber: index + 1
            });
        }
        
        // Check bullet length
        if ((trimmed.startsWith('•') || trimmed.startsWith('-')) && trimmed.length > 150) {
            issues.push({
                description: 'Bullet point too long - keep under 150 characters',
                cvLine: trimmed,
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Bullet point formatting is optimized',
            cvLine: 'No specific improvements needed',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find quantifiable achievement issues
 */
function findQuantifiableIssues(lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
        // Look for achievement lines without numbers
        if (line.match(/\b(increased|improved|reduced|achieved|grew|saved|generated)\b/i)) {
            if (!line.match(/\d+/) && !line.includes('%')) {
                issues.push({
                    description: 'Add specific numbers or percentages to quantify achievement',
                    cvLine: line.trim(),
                    lineNumber: index + 1
                });
            }
        }
        
        // Look for vague terms that need quantification
        if (line.match(/\b(many|several|various|multiple|significant)\b/i)) {
            issues.push({
                description: 'Replace vague terms with specific numbers',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Add more quantified achievements with specific metrics',
            cvLine: 'Include numbers, percentages, and measurable results',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find summary section issues
 */
function findSummaryIssues(lines) {
    const issues = [];
    const summaryKeywords = ['summary', 'profile', 'objective', 'about'];
    
    const summaryLine = lines.find(line => 
        summaryKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!summaryLine) {
        issues.push({
            description: 'Professional summary section missing',
            cvLine: 'Add professional summary at the top of resume',
            lineNumber: 1
        });
    }
    
    // Check first few lines for summary content
    const firstFewLines = lines.slice(0, 5);
    firstFewLines.forEach((line, index) => {
        if (line.length > 200) {
            issues.push({
                description: 'Summary statement too long - keep under 200 characters',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Summary section can be optimized for impact',
            cvLine: summaryLine || firstFewLines[0],
            lineNumber: 1
        });
    }
    
    return issues;
}

/**
 * Find repetition issues
 */
function findRepetitionIssues(lines) {
    const issues = [];
    const wordCounts = {};
    
    // Count word frequency
    lines.forEach(line => {
        const words = line.toLowerCase().split(/\s+/).filter(word => word.length > 4);
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
    });
    
    // Find overused words
    const overusedWords = Object.entries(wordCounts).filter(([word, count]) => count > 5);
    
    overusedWords.forEach(([word, count]) => {
        const lineWithWord = lines.find(line => line.toLowerCase().includes(word));
        if (lineWithWord) {
            issues.push({
                description: `Word "${word}" used ${count} times - consider synonyms`,
                cvLine: lineWithWord.trim(),
                lineNumber: lines.indexOf(lineWithWord) + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Word variety is good - no excessive repetition detected',
            cvLine: 'Content shows good vocabulary diversity',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find verbosity issues
 */
function findVerbosityIssues(lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
        if (line.length > 120 && !line.includes('•') && !line.includes('-')) {
            issues.push({
                description: 'Line too long - break into shorter, clearer statements',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
        
        // Check for wordy phrases
        const wordyPhrases = ['in order to', 'due to the fact that', 'with regard to', 'for the purpose of'];
        wordyPhrases.forEach(phrase => {
            if (line.toLowerCase().includes(phrase)) {
                issues.push({
                    description: `Replace wordy phrase "${phrase}" with simpler alternative`,
                    cvLine: line.trim(),
                    lineNumber: index + 1
                });
            }
        });
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Content is appropriately concise',
            cvLine: 'Good balance of detail and brevity',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find verb tense issues
 */
function findVerbTenseIssues(lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
        // Check for mixed tenses in same line
        if (line.match(/\b(manage|develop|create)\b.*\b(managed|developed|created)\b/i)) {
            issues.push({
                description: 'Mixed verb tenses in same statement - use consistent tense',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
        
        // Check for present tense in past roles
        if (line.match(/\b(currently|presently)\b/i) && line.match(/\b(managed|developed|created)\b/i)) {
            issues.push({
                description: 'Use present tense for current role, past tense for previous roles',
                cvLine: line.trim(),
                lineNumber: index + 1
            });
        }
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Verb tense consistency can be improved',
            cvLine: 'Review tense usage throughout resume',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find active voice issues
 */
function findActiveVoiceIssues(lines) {
    const issues = [];
    const passiveIndicators = ['was responsible', 'were responsible', 'was tasked', 'were given', 'was assigned'];
    
    lines.forEach((line, index) => {
        passiveIndicators.forEach(indicator => {
            if (line.toLowerCase().includes(indicator)) {
                issues.push({
                    description: `Convert passive voice "${indicator}" to active voice`,
                    cvLine: line.trim(),
                    lineNumber: index + 1
                });
            }
        });
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'Active voice usage is strong throughout resume',
            cvLine: 'Good use of action-oriented language',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find page density issues
 */
function findPageDensityIssues(lines) {
    const issues = [];
    const totalLines = lines.length;
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / totalLines;
    
    if (totalLines < 20) {
        issues.push({
            description: 'Resume appears too sparse - add more relevant content',
            cvLine: `Total content: ${totalLines} lines`,
            lineNumber: 0
        });
    } else if (totalLines > 60) {
        issues.push({
            description: 'Resume appears too dense - consider condensing content',
            cvLine: `Total content: ${totalLines} lines`,
            lineNumber: 0
        });
    }
    
    if (avgLineLength > 100) {
        issues.push({
            description: 'Average line length too long - use more white space',
            cvLine: `Average line length: ${Math.round(avgLineLength)} characters`,
            lineNumber: 0
        });
    }
    
    if (issues.length === 0) {
        issues.push({
            description: 'Page density is well-balanced',
            cvLine: 'Good use of white space and content distribution',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find unnecessary sections issues
 */
function findUnnecessarySectionIssues(lines) {
    const issues = [];
    const unnecessarySections = ['references', 'hobbies', 'interests', 'personal information'];
    
    lines.forEach((line, index) => {
        unnecessarySections.forEach(section => {
            if (line.toLowerCase().includes(section)) {
                issues.push({
                    description: `Consider removing "${section}" section - not ATS-friendly`,
                    cvLine: line.trim(),
                    lineNumber: index + 1
                });
            }
        });
    });
    
    if (issues.length === 0) {
        issues.push({
            description: 'All sections appear relevant and necessary',
            cvLine: 'Good focus on professional content',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find growth signals issues
 */
function findGrowthSignalIssues(lines) {
    const issues = [];
    const growthKeywords = ['promoted', 'advanced', 'progressed', 'increased responsibility', 'leadership role'];
    
    const hasGrowthSignals = lines.some(line => 
        growthKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasGrowthSignals) {
        issues.push({
            description: 'Add evidence of career progression and growth',
            cvLine: 'Include promotions, increased responsibilities, or skill development',
            lineNumber: 0
        });
    }
    
    // Look for years to show progression
    const yearsFound = [];
    lines.forEach(line => {
        const yearMatches = line.match(/\b(19|20)\d{2}\b/g);
        if (yearMatches) {
            yearsFound.push(...yearMatches);
        }
    });
    
    if (yearsFound.length < 2) {
        issues.push({
            description: 'Include dates to show career timeline and progression',
            cvLine: 'Add employment dates to demonstrate growth over time',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find drive and initiative issues
 */
function findDriveIssues(lines) {
    const issues = [];
    const driveKeywords = ['initiated', 'pioneered', 'launched', 'established', 'founded', 'created', 'innovated'];
    
    const hasDriveSignals = lines.some(line => 
        driveKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasDriveSignals) {
        issues.push({
            description: 'Add examples of initiative and self-motivation',
            cvLine: 'Include projects you initiated or innovative solutions you created',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find leadership issues
 */
function findLeadershipIssues(lines) {
    const issues = [];
    const leadershipKeywords = ['led', 'managed', 'supervised', 'directed', 'coordinated', 'team', 'leadership'];
    
    const hasLeadershipSignals = lines.some(line => 
        leadershipKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasLeadershipSignals) {
        issues.push({
            description: 'Add leadership experiences and team management examples',
            cvLine: 'Include team leadership, project management, or mentoring experience',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find teamwork issues
 */
function findTeamworkIssues(lines) {
    const issues = [];
    const teamworkKeywords = ['collaborated', 'partnered', 'worked with', 'cross-functional', 'team member'];
    
    const hasTeamworkSignals = lines.some(line => 
        teamworkKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasTeamworkSignals) {
        issues.push({
            description: 'Add examples of collaboration and teamwork',
            cvLine: 'Include cross-functional projects or collaborative achievements',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find analytical skills issues
 */
function findAnalyticalIssues(lines) {
    const issues = [];
    const analyticalKeywords = ['analyzed', 'evaluated', 'assessed', 'researched', 'investigated', 'data', 'metrics'];
    
    const hasAnalyticalSignals = lines.some(line => 
        analyticalKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasAnalyticalSignals) {
        issues.push({
            description: 'Add examples of analytical and problem-solving skills',
            cvLine: 'Include data analysis, research, or problem-solving achievements',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find certification issues
 */
function findCertificationIssues(lines) {
    const issues = [];
    const certKeywords = ['certified', 'certification', 'license', 'credential', 'certificate'];
    
    const hasCertifications = lines.some(line => 
        certKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    if (!hasCertifications) {
        issues.push({
            description: 'Add relevant professional certifications and credentials',
            cvLine: 'Include industry certifications, licenses, or training certificates',
            lineNumber: 0
        });
    }
    
    return issues;
}

/**
 * Find generic issues for other categories
 */
function findGenericIssues(lines, categoryName) {
    return [{
        description: `Optimization needed for ${categoryName} section`,
        cvLine: lines[0] || 'Content analysis in progress',
        lineNumber: 1
    }];
}

/**
 * Close modal
 */
function closeIssueModal() {
    const modal = document.getElementById('issueModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Handle modal fix all button - redirect to payment
 */
function handleModalFixAll() {
    console.log('🚀 Modal Fix All clicked');
    // Store analysis data and redirect to payment
    sessionStorage.setItem('pendingRewrite', JSON.stringify(analysisData));
    window.location.href = './payment.html';
}

/**
 * Show error message
 */
function showError(message) {
    console.error('❌ Error:', message);
    
    // Update UI to show error state
    if (atsScore) atsScore.textContent = '—';
    if (summaryText) summaryText.textContent = message;
    
    // Show error in main content area
    if (issuesList) {
        issuesList.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <span class="text-2xl text-red-600">❌</span>
                </div>
                <h3 class="text-lg font-bold text-red-900 mb-2">No Analysis Data Found</h3>
                <p class="text-red-700 mb-4">${message}</p>
                <button onclick="window.location.href='./index.html'" class="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors">
                    Upload Resume
                </button>
            </div>
        `;
        issuesList.classList.remove('hidden');
    }
    
    // Clear sidebar
    if (topFixesList) topFixesList.innerHTML = '<div class="text-sm text-gray-500 p-4">No data available</div>';
    if (completedList) completedList.innerHTML = '<div class="text-sm text-gray-500 p-4">No data available</div>';
}

// Make function global for onclick access
window.handleFixIssue = handleFixIssue;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeResultPage);
} else {
    initializeResultPage();
}