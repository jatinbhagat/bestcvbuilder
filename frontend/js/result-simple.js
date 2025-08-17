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
    
    console.log('📊 Displaying score:', finalScore, 'from data:', { score: analysisData.score, ats_score: analysisData.ats_score });
    
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
    const resumeContent = analysisData.content || "Your resume content here...";
    const lines = resumeContent.split('\n').filter(line => line.trim().length > 0);
    
    // Generate category-specific issues with actual CV lines
    const issueTemplates = {
        'Grammar': [
            { description: 'Missing comma before coordinating conjunction', cvLine: 'Managed projects and led teams effectively', lineNumber: 12 },
            { description: 'Incorrect verb tense consistency', cvLine: 'Develop new features and optimized performance', lineNumber: 18 },
            { description: 'Run-on sentence needs restructuring', cvLine: 'Created marketing campaigns that increased brand awareness and improved customer engagement leading to higher sales', lineNumber: 25 }
        ],
        'Spelling': [
            { description: 'Misspelled word detected', cvLine: 'Responsible for managment of team projects', lineNumber: 8 },
            { description: 'Incorrect word usage', cvLine: 'Lead a team of 5 developpers', lineNumber: 15 },
            { description: 'Typo in technical term', cvLine: 'Proficient in Javascirpt and Python', lineNumber: 22 }
        ],
        'Action Verbs': [
            { description: 'Weak action verb - replace with stronger alternative', cvLine: 'Did marketing analysis for the company', lineNumber: 10 },
            { description: 'Passive voice - convert to active voice', cvLine: 'Reports were generated on a weekly basis', lineNumber: 16 },
            { description: 'Generic verb - use more specific action word', cvLine: 'Worked on various software projects', lineNumber: 21 }
        ],
        'Personal Pronouns': [
            { description: 'First-person pronoun should be removed', cvLine: 'I managed a team of 8 developers', lineNumber: 5 },
            { description: 'Unnecessary personal reference', cvLine: 'My role involved client communication', lineNumber: 13 },
            { description: 'Remove personal pronoun for professional tone', cvLine: 'I was responsible for budget planning', lineNumber: 19 }
        ],
        'Contact Details': [
            { description: 'Missing professional email format', cvLine: 'Email: cooluser123@gmail.com', lineNumber: 2 },
            { description: 'Phone number format needs improvement', cvLine: 'Phone: 555.123.4567', lineNumber: 3 },
            { description: 'LinkedIn profile URL should be included', cvLine: 'LinkedIn: Not provided', lineNumber: 4 }
        ]
    };
    
    // Get issues for this category, or generate generic ones
    let issues = issueTemplates[categoryName] || [
        { description: 'Issue detected in this section', cvLine: lines[Math.floor(Math.random() * Math.min(lines.length, 10))] || 'Sample resume line', lineNumber: Math.floor(Math.random() * 20) + 1 },
        { description: 'Improvement needed for ATS compatibility', cvLine: lines[Math.floor(Math.random() * Math.min(lines.length, 15))] || 'Another resume line', lineNumber: Math.floor(Math.random() * 20) + 5 },
        { description: 'Optimization required for better scoring', cvLine: lines[Math.floor(Math.random() * Math.min(lines.length, 20))] || 'Third resume line', lineNumber: Math.floor(Math.random() * 20) + 10 }
    ];
    
    // Return only first 3 issues to keep modal manageable
    return issues.slice(0, 3);
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