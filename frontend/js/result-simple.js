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

// App configuration cache
let appConfig = null;
try {
    const rawData = sessionStorage.getItem('atsAnalysis');
    console.log('📊 Raw session data:', rawData);
    analysisData = JSON.parse(rawData || '{}');
    console.log('📊 Parsed Analysis Data:', analysisData);
    
    // 🔍 DEBUG: Check comprehensive report in initial data
    console.log('🔍 INITIAL DATA CHECK:');
    console.log('🔍 Has comprehensive_issues_report?', 'comprehensive_issues_report' in analysisData);
    console.log('🔍 comprehensive_issues_report value:', analysisData.comprehensive_issues_report);
    
} catch (error) {
    console.error('❌ Failed to parse session data:', error);
    analysisData = {};
}

/**
 * Initialize the result page
 */
async function initializeResultPage() {
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
    
    // Update CTA text based on payment config
    await updateCTAText();
    
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
 * Update CTA text based on payment bypass configuration
 */
async function updateCTAText() {
    try {
        const config = await fetchAppConfig();
        const shouldBypass = config.bypass_payment || config.free_mode_enabled;
        
        // Update main CTA button
        const upgradeBtn = document.getElementById('upgradeBtn');
        if (upgradeBtn) {
            if (shouldBypass) {
                upgradeBtn.innerHTML = '🚀 FIX MY RESUME NOW - FREE 🚀';
            } else {
                upgradeBtn.innerHTML = '🚀 FIX THIS RESUME NOW - ₹99 🚀';
            }
        }
        
        // Update any modal CTA buttons (will be handled when modal is shown)
        console.log(`🔧 CTA text updated - bypass: ${shouldBypass}`);
        
    } catch (error) {
        console.error('⚠️ Failed to update CTA text:', error);
        // Keep default text if config fails
    }
}

/**
 * Update modal CTA button text based on payment config
 */
async function updateModalCTAButton(modalBtn) {
    try {
        const config = await fetchAppConfig();
        const shouldBypass = config.bypass_payment || config.free_mode_enabled;
        
        if (shouldBypass) {
            modalBtn.innerHTML = '🚀 Fix for Free - Instant Results';
            modalBtn.className = 'flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg text-base';
        } else {
            modalBtn.innerHTML = '🚀 Fix This - ₹99';
            modalBtn.className = 'flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg text-base';
        }
    } catch (error) {
        console.error('⚠️ Failed to update modal CTA button:', error);
        // Keep default styling if config fails
    }
}

/**
 * Display overall ATS score from backend
 */
function displayOverallScore() {
    if (!atsScore) return;
    
    // Backend sends 'score' field, not 'ats_score'
    const finalScore = Math.round(analysisData.score || analysisData.ats_score || 0);
    atsScore.textContent = finalScore;
    
    // Remove loading state
    atsScore.classList.remove('initial-loading');
    atsScore.classList.add('loaded');
    
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
    
    // Update counts and remove loading states
    if (highPriorityCount) {
        highPriorityCount.textContent = lowScore.length;
        highPriorityCount.classList.remove('initial-loading');
        highPriorityCount.classList.add('loaded');
    }
    if (needFixesCount) {
        needFixesCount.textContent = mediumScore.length;
        needFixesCount.classList.remove('initial-loading');
        needFixesCount.classList.add('loaded');
    }
    if (completedCount) {
        completedCount.textContent = highScore.length;
        completedCount.classList.remove('initial-loading');
        completedCount.classList.add('loaded');
    }
    if (markedAsDone) {
        markedAsDone.textContent = `${highScore.length} COMPLETED`;
        markedAsDone.classList.remove('initial-loading');
        markedAsDone.classList.add('loaded');
    }
    
    // Display in sidebar
    displaySidebarItems(lowScore, mediumScore, highScore);
    
    // Populate summary details
    populateSummaryDetails(lowScore, mediumScore, highScore);
    
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
 * Populate summary details breakdown
 */
function populateSummaryDetails(lowScore, mediumScore, highScore) {
    // Update detailed counts
    const highPriorityDetailCount = document.getElementById('highPriorityDetailCount');
    const needFixesDetailCount = document.getElementById('needFixesDetailCount');
    const completedDetailCount = document.getElementById('completedDetailCount');
    
    if (highPriorityDetailCount) highPriorityDetailCount.textContent = lowScore.length;
    if (needFixesDetailCount) needFixesDetailCount.textContent = mediumScore.length;
    if (completedDetailCount) completedDetailCount.textContent = highScore.length;
    
    // Populate detailed lists
    const highPriorityDetailList = document.getElementById('highPriorityDetailList');
    const needFixesDetailList = document.getElementById('needFixesDetailList');
    const completedDetailList = document.getElementById('completedDetailList');
    
    if (highPriorityDetailList) {
        highPriorityDetailList.innerHTML = '';
        lowScore.slice(0, 5).forEach(category => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center py-1';
            item.innerHTML = `
                <span class="text-xs">${category.name}</span>
                <span class="text-xs font-medium text-red-600">${category.score}/10</span>
            `;
            highPriorityDetailList.appendChild(item);
        });
        if (lowScore.length > 5) {
            const moreItem = document.createElement('div');
            moreItem.className = 'text-xs text-gray-400 py-1';
            moreItem.textContent = `+${lowScore.length - 5} more items`;
            highPriorityDetailList.appendChild(moreItem);
        }
    }
    
    if (needFixesDetailList) {
        needFixesDetailList.innerHTML = '';
        mediumScore.slice(0, 5).forEach(category => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center py-1';
            item.innerHTML = `
                <span class="text-xs">${category.name}</span>
                <span class="text-xs font-medium text-orange-600">${category.score}/10</span>
            `;
            needFixesDetailList.appendChild(item);
        });
        if (mediumScore.length > 5) {
            const moreItem = document.createElement('div');
            moreItem.className = 'text-xs text-gray-400 py-1';
            moreItem.textContent = `+${mediumScore.length - 5} more items`;
            needFixesDetailList.appendChild(moreItem);
        }
    }
    
    if (completedDetailList) {
        completedDetailList.innerHTML = '';
        highScore.slice(0, 5).forEach(category => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center py-1';
            item.innerHTML = `
                <span class="text-xs">${category.name}</span>
                <span class="text-xs font-medium text-green-600">${category.score}/10</span>
            `;
            completedDetailList.appendChild(item);
        });
        if (highScore.length > 5) {
            const moreItem = document.createElement('div');
            moreItem.className = 'text-xs text-gray-400 py-1';
            moreItem.textContent = `+${highScore.length - 5} more items`;
            completedDetailList.appendChild(moreItem);
        }
    }
    
    // Generate insights
    const summaryInsights = document.getElementById('summaryInsights');
    if (summaryInsights) {
        let insight = '';
        if (lowScore.length > 0) {
            insight = `Focus on ${lowScore[0].name.toLowerCase()} first - it has the biggest impact on your ATS score`;
        } else if (mediumScore.length > 0) {
            insight = `Great job! Focus on ${mediumScore[0].name.toLowerCase()} for further improvement`;
        } else {
            insight = 'Excellent! Your resume is well-optimized for ATS systems';
        }
        summaryInsights.textContent = insight;
    }
}

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
    // Setup summary details toggle
    const summaryToggleBtn = document.getElementById('toggleSummaryBtn');
    const summaryToggleIcon = document.getElementById('toggleSummaryIcon');
    const summaryDetails = document.getElementById('summaryDetails');
    
    if (summaryToggleBtn && summaryToggleIcon && summaryDetails) {
        summaryToggleBtn.addEventListener('click', () => {
            const isHidden = summaryDetails.classList.contains('hidden');
            
            if (isHidden) {
                summaryDetails.classList.remove('hidden');
                summaryToggleIcon.style.transform = 'rotate(180deg)';
                summaryToggleBtn.title = 'Hide detailed breakdown';
            } else {
                summaryDetails.classList.add('hidden');
                summaryToggleIcon.style.transform = 'rotate(0deg)';
                summaryToggleBtn.title = 'Show detailed breakdown';
            }
        });
    }

    // Setup issues toggle (now starts visible)
    const toggleBtn = document.getElementById('toggleIssuesBtn');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (toggleBtn && issuesList && toggleIcon) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = issuesList.classList.contains('hidden');
            
            if (isHidden) {
                issuesList.classList.remove('hidden');
                toggleIcon.style.transform = 'rotate(180deg)';
                toggleBtn.querySelector('h3').textContent = 'Hide Detailed Issues';
                toggleBtn.querySelector('p').textContent = 'Collapse the detailed issues breakdown';
            } else {
                issuesList.classList.add('hidden');
                toggleIcon.style.transform = 'rotate(0deg)';
                toggleBtn.querySelector('h3').textContent = 'Show Detailed Issues';
                toggleBtn.querySelector('p').textContent = 'View the detailed issues breakdown';
            }
        });
    }

    // Setup strengths toggle (starts hidden)
    const strengthsBtn = document.getElementById('toggleStrengthsBtn');
    const strengthsIcon = document.getElementById('toggleStrengthsIcon');
    const strengthsContent = document.getElementById('strengthsContent');
    const strengthsSection = document.getElementById('strengthsSection');
    
    if (strengthsBtn && strengthsIcon && strengthsContent) {
        // Show the strengths section with toggle button
        if (strengthsSection) {
            strengthsSection.classList.remove('hidden');
        }
        
        strengthsBtn.addEventListener('click', () => {
            const isHidden = strengthsContent.classList.contains('hidden');
            
            if (isHidden) {
                strengthsContent.classList.remove('hidden');
                strengthsIcon.style.transform = 'rotate(180deg)';
                strengthsBtn.querySelector('h3').textContent = 'Hide What You Did Well';
                strengthsBtn.querySelector('p').textContent = 'Collapse the strengths section';
            } else {
                strengthsContent.classList.add('hidden');
                strengthsIcon.style.transform = 'rotate(0deg)';
                strengthsBtn.querySelector('h3').textContent = 'Show What You Did Well';
                strengthsBtn.querySelector('p').textContent = 'View areas where your resume already excels';
            }
        });
    }
}

/**
 * Fetch app configuration to check payment bypass settings
 */
async function fetchAppConfig() {
    if (appConfig) return appConfig; // Return cached config
    
    try {
        // Use production backend API URL (same as atsAnalysis.js)
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const API_BASE_URL = isProduction ? 'https://bestcvbuilder-api.onrender.com/api' : '/api';
        const CONFIG_URL = `${API_BASE_URL}/config/`;
        
        const response = await fetch(CONFIG_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Config fetch failed: ${response.status}`);
        }
        
        appConfig = await response.json();
        console.log('🔧 App config loaded:', appConfig);
        return appConfig;
    } catch (error) {
        console.error('⚠️ Failed to fetch app config, using defaults:', error);
        // Fallback configuration
        appConfig = {
            bypass_payment: true,
            free_mode_enabled: true,
            features: {
                free_cv_rewrite: true,
                payment_bypass: true
            }
        };
        return appConfig;
    }
}

/**
 * Handle CV rewrite with payment bypass check
 */
async function handleCVRewrite(source = 'upgrade') {
    console.log(`🚀 CTA clicked from: ${source}`);
    
    // Get customer information (should be collected by now)
    const customerInfo = JSON.parse(sessionStorage.getItem('customerInfo') || '{}');
    console.log('👤 Customer info for CV rewrite:', customerInfo);
    
    // Fetch configuration to check bypass
    const config = await fetchAppConfig();
    const shouldBypass = config.bypass_payment || config.free_mode_enabled;
    
    console.log(`🔧 Payment bypass enabled: ${shouldBypass}`);
    
    if (shouldBypass) {
        // Bypass payment - show TXT download page directly
        console.log('✅ Free mode: proceeding directly to TXT download');
        await showTXTDownloadPage();
    } else {
        // Redirect to payment page with customer info
        console.log('💳 Paid mode: redirecting to payment page');
        
        // Store both analysis data and customer info for payment page
        sessionStorage.setItem('pendingAnalysis', JSON.stringify(analysisData));
        sessionStorage.setItem('customerInfoForPayment', JSON.stringify(customerInfo));
        
        // Redirect to payment page
        window.location.href = './payment.html';
    }
}

/**
 * Show TXT download page with comprehensive issues report
 */
async function showTXTDownloadPage() {
    console.log('📄 Showing TXT download page...');
    
    try {
        // Show loading state
        showLoadingState();
        
        // 🔍 DEBUG: Log full analysis data structure
        console.log('🔍 DEBUGGING TXT REPORT GENERATION');
        console.log('📊 Full analysisData keys:', Object.keys(analysisData));
        console.log('📊 analysisData structure:', JSON.stringify(analysisData, null, 2));
        
        // Get comprehensive issues report from analysis data
        const comprehensiveReport = analysisData.comprehensive_issues_report;
        
        // 🔍 DEBUG: Detailed comprehensive report analysis
        console.log('🔍 comprehensive_issues_report field:', comprehensiveReport);
        console.log('🔍 Type of comprehensive_issues_report:', typeof comprehensiveReport);
        console.log('🔍 Is null/undefined?', comprehensiveReport === null || comprehensiveReport === undefined);
        
        if (comprehensiveReport && comprehensiveReport.length > 0) {
            // Store the TXT report for the download page
            sessionStorage.setItem('comprehensiveReport', comprehensiveReport);
            console.log('✅ Comprehensive report found and stored');
            console.log('📄 Report length:', comprehensiveReport.length);
            console.log('📄 Report preview (first 200 chars):', comprehensiveReport.substring(0, 200));
        } else {
            // 🔍 DEBUG: Why are we falling back?
            console.log('⚠️ FALLBACK TRIGGERED:');
            console.log('   - comprehensiveReport exists?', !!comprehensiveReport);
            console.log('   - comprehensiveReport length?', comprehensiveReport?.length || 'N/A');
            console.log('   - comprehensiveReport content?', comprehensiveReport || 'NULL/UNDEFINED');
            
            // Generate a basic report from current analysis data
            const basicReport = generateBasicIssuesReport();
            sessionStorage.setItem('comprehensiveReport', basicReport);
            console.log('⚠️ Generated basic report as fallback');
            console.log('📄 Basic report length:', basicReport.length);
        }
        
        // Redirect to TXT download page
        window.location.href = './download-report.html';
        
    } catch (error) {
        console.error('❌ Failed to show TXT download page:', error);
        hideLoadingState();
        alert('Failed to generate issues report. Please try again.');
    }
}

/**
 * Generate basic issues report from current analysis data
 */
function generateBasicIssuesReport() {
    const score = analysisData.score || analysisData.ats_score || 0;
    const detailed = analysisData.detailedAnalysis || analysisData.detailed_analysis || {};
    
    let report = `ATS ISSUES REPORT\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Current ATS Score: ${score}/100\n`;
    report += `Report Generated: ${new Date().toLocaleString()}\n\n`;
    
    report += `ISSUES BY CATEGORY\n`;
    report += `${'-'.repeat(30)}\n\n`;
    
    Object.entries(detailed).forEach(([category, data]) => {
        if (data && data.score < 10) {
            const name = category.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            report += `${name}: ${data.score}/10\n`;
            if (data.issues && data.issues.length > 0) {
                data.issues.forEach(issue => {
                    report += `  • ${issue}\n`;
                });
            }
            if (data.suggestions && data.suggestions.length > 0) {
                data.suggestions.forEach(suggestion => {
                    report += `  → ${suggestion}\n`;
                });
            }
            report += `\n`;
        }
    });
    
    report += `\nGenerated by BestCVBuilder.com\n`;
    report += `Your ATS Optimization Partner\n`;
    
    return report;
}

/**
 * Show loading state during CV processing
 */
function showLoadingState() {
    if (upgradeBtn) {
        upgradeBtn.disabled = true;
        upgradeBtn.innerHTML = '🔄 Processing Your CV...';
        upgradeBtn.classList.add('loading');
    }
    
    // Also update modal button if visible
    const modalFixBtn = document.getElementById('modalFixAllBtn');
    if (modalFixBtn) {
        modalFixBtn.disabled = true;
        modalFixBtn.innerHTML = '🔄 Processing...';
        modalFixBtn.classList.add('loading');
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    if (upgradeBtn) {
        upgradeBtn.disabled = false;
        upgradeBtn.innerHTML = '🚀 FIX MY RESUME NOW - FREE 🚀';
        upgradeBtn.classList.remove('loading');
    }
    
    // Also restore modal button if visible
    const modalFixBtn = document.getElementById('modalFixAllBtn');
    if (modalFixBtn) {
        modalFixBtn.disabled = false;
        modalFixBtn.innerHTML = '🚀 Fix for Free - Instant Results';
        modalFixBtn.classList.remove('loading');
    }
}

/**
 * Normalize phone number to +91XXXXXXXXXX format
 */
function normalizePhoneNumber(phoneStr) {
    if (!phoneStr) return null;
    
    // Remove all non-digit characters except the leading +
    const cleaned = phoneStr.replace(/[^\d+]/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('+91')) {
        // Already has +91, just clean up separators
        const digits = cleaned.substring(3); // Remove +91
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            return `+91${digits}`;
        }
    } else if (cleaned.startsWith('91')) {
        // Has 91 but no +
        const digits = cleaned.substring(2); // Remove 91
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            return `+91${digits}`;
        }
    } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
        // Just the 10-digit mobile number
        return `+91${cleaned}`;
    } else if (cleaned.startsWith('+1') && cleaned.substring(2).length === 10) {
        // US/Canada number
        return cleaned;
    } else if (cleaned.startsWith('+') && cleaned.length >= 10 && cleaned.length <= 15) {
        // Other international numbers
        return cleaned;
    }
    
    return null;
}

/**
 * Validate if a phone number is valid
 */
function isValidPhoneNumber(normalizedPhone) {
    if (!normalizedPhone || !normalizedPhone.startsWith('+')) return false;
    
    if (normalizedPhone.startsWith('+91')) {
        // Indian mobile number validation
        const digits = normalizedPhone.substring(3);
        return digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
    } else if (normalizedPhone.startsWith('+1')) {
        // US/Canada validation
        const digits = normalizedPhone.substring(2);
        return digits.length === 10 && /^\d{10}$/.test(digits);
    } else {
        // General international validation
        const digits = normalizedPhone.substring(1);
        return digits.length >= 9 && digits.length <= 14 && /^\d+$/.test(digits);
    }
}

/**
 * Score phone number for priority selection (higher score = better)
 */
function scorePhoneNumber(normalizedPhone, originalFormat) {
    let score = 0;
    
    // Prefer Indian numbers
    if (normalizedPhone.startsWith('+91')) {
        score += 100;
        
        // Extra points for valid Indian mobile prefixes
        const digits = normalizedPhone.substring(3);
        if (/^[6-9]/.test(digits)) {
            score += 50;
        }
    }
    
    // Prefer numbers that had proper formatting in original
    if (originalFormat.includes('+91')) {
        score += 30;
    }
    
    if (originalFormat.includes('-') || originalFormat.includes(' ')) {
        score += 20; // Structured formatting indicates intentional contact info
    }
    
    // Prefer longer country codes (more specific)
    if (normalizedPhone.startsWith('+')) {
        const countryCode = normalizedPhone.match(/^\+(\d{1,3})/)[1];
        score += countryCode.length * 5;
    }
    
    return score;
}

/**
 * Extract contact information from analysis data
 */
function extractContactInfoFromAnalysis() {
    if (!analysisData) {
        return { email: '', mobile: '', name: '' };
    }
    
    let extractedEmail = '';
    let extractedMobile = '';
    let extractedName = '';
    
    // Check if backend already extracted personal information
    const personalInfo = analysisData.personal_information || analysisData.personalInfo || {};
    if (personalInfo.email) {
        extractedEmail = personalInfo.email;
    }
    if (personalInfo.phone || personalInfo.mobile) {
        extractedMobile = personalInfo.phone || personalInfo.mobile;
    }
    if (personalInfo.full_name || personalInfo.name) {
        extractedName = personalInfo.full_name || personalInfo.name;
    }
    
    // If not found in personal info, extract from resume content
    const content = analysisData.content || analysisData.resume_text || analysisData.text || analysisData.extractedText || '';
    
    if (!extractedEmail && content) {
        // Extract email using regex
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emailMatches = content.match(emailPattern);
        if (emailMatches && emailMatches.length > 0) {
            // Filter out obvious artifacts and pick the most professional looking email
            const cleanEmails = emailMatches.filter(email => 
                !email.match(/^[a-z][A-Z]/) && // Avoid extraction artifacts
                email.length < 50 && // Reasonable length
                !email.includes('example') && // Avoid example emails
                !email.includes('test')
            );
            extractedEmail = cleanEmails[0] || emailMatches[0];
        }
    }
    
    if (!extractedMobile && content) {
        // Extract phone numbers using enhanced patterns - Indian priority with global compatibility
        const phonePatterns = [
            // Indian formats with separators (priority patterns)
            /\+91[-\s]?\d{5}[-\s]?\d{5}/g,    // +91 87250-88181, +91-87250-88181
            /\+91[-\s]?\d{4}[-\s]?\d{6}/g,    // +91 8725-088181, +91-8725-088181
            /\+91[-\s]?\d{3}[-\s]?\d{7}/g,    // +91 872-5088181, +91-872-5088181
            /\+91[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{4}/g, // +91 87-2508-8181
            
            // Standard Indian formats
            /\+91[-.\s]?\d{10}/g,  // +91-9999999999
            /\+91\s?\d{10}/g,      // +91 9999999999
            
            // Global formats with separators
            /\+\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4}/g, // International with separators
            /\+\d{1,3}[-.\s]?\d{10,}/g,  // Other international formats
            
            // Local formats
            /\b\d{5}[-\s]?\d{5}\b/g,      // 87250-88181 (10 digits with separator)
            /\b\d{4}[-\s]?\d{6}\b/g,      // 8725-088181
            /\b\d{3}[-\s]?\d{7}\b/g,      // 872-5088181
            /\b\d{10}\b/g,                // 9999999999 (standalone 10 digits)
            /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,  // 999-999-9999
            /\(\d{3}\)\s?\d{3}[-.\s]\d{4}/g, // (999) 999-9999
            /\b\d{11,12}\b/g              // 11-12 digit numbers (with country code)
        ];
        
        for (const pattern of phonePatterns) {
            const phoneMatches = content.match(pattern);
            if (phoneMatches && phoneMatches.length > 0) {
                // Pick the best looking phone number with priority scoring
                for (const match of phoneMatches) {
                    const cleanPhone = match.trim();
                    const normalizedPhone = normalizePhoneNumber(cleanPhone);
                    
                    if (normalizedPhone && isValidPhoneNumber(normalizedPhone)) {
                        // Score the phone number for priority
                        const score = scorePhoneNumber(normalizedPhone, cleanPhone);
                        if (!extractedMobile || score > scorePhoneNumber(extractedMobile, extractedMobile)) {
                            extractedMobile = normalizedPhone;
                        }
                    }
                }
                if (extractedMobile) break;
            }
        }
        
        // If still not found, try to extract from lines that contain phone-related keywords
        if (!extractedMobile) {
            const lines = content.split('\n');
            const phoneKeywords = ['phone', 'mobile', 'tel', 'cell', 'contact', 'call'];
            
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (phoneKeywords.some(keyword => lowerLine.includes(keyword))) {
                    // Look for any digit sequence in this line
                    const digitSequences = line.match(/\d{10,}/g);
                    if (digitSequences) {
                        const normalizedPhone = normalizePhoneNumber(digitSequences[0]);
                        if (normalizedPhone && isValidPhoneNumber(normalizedPhone)) {
                            extractedMobile = normalizedPhone;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    if (!extractedName && content) {
        // Extract name from the first few lines (usually header)
        const lines = content.split('\n');
        const headerLines = lines.slice(0, 5);
        
        for (const line of headerLines) {
            const trimmedLine = line.trim();
            // Look for lines that could be names (2-4 words, reasonable length)
            if (trimmedLine && 
                trimmedLine.length > 3 && 
                trimmedLine.length < 50 && 
                !trimmedLine.includes('@') && 
                !trimmedLine.includes('http') &&
                !/\d{3,}/.test(trimmedLine)) { // Avoid lines with long numbers
                
                const words = trimmedLine.split(/\s+/);
                if (words.length >= 2 && words.length <= 4) {
                    // Check if it looks like a name (starts with capital letters)
                    const looksLikeName = words.every(word => 
                        word.charAt(0).toUpperCase() === word.charAt(0) &&
                        word.length > 1
                    );
                    if (looksLikeName) {
                        extractedName = trimmedLine;
                        break;
                    }
                }
            }
        }
    }
    
    console.log('📞 Extracted contact info:', { 
        email: extractedEmail, 
        mobile: extractedMobile, 
        name: extractedName 
    });
    
    return {
        email: extractedEmail,
        mobile: extractedMobile,
        name: extractedName
    };
}

/**
 * Validate extracted contact information
 */
function validateExtractedContact(contact) {
    const validated = { ...contact };
    
    // Validate email
    if (validated.email && (!validated.email.includes('@') || validated.email.length < 5)) {
        validated.email = '';
    }
    
    // Validate mobile (must be at least 10 digits)
    if (validated.mobile) {
        const digits = validated.mobile.replace(/[^\d]/g, '');
        if (digits.length < 10) {
            validated.mobile = '';
        }
    }
    
    // Validate name (reasonable length)
    if (validated.name && (validated.name.length < 2 || validated.name.length > 50)) {
        validated.name = '';
    }
    
    return validated;
}

/**
 * Show customer information modal
 */
function showCustomerInfoModal() {
    const modal = document.getElementById('customerInfoModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Extract and validate contact information from resume
        const extractedContact = extractContactInfoFromAnalysis();
        const validatedContact = validateExtractedContact(extractedContact);
        
        // Prefill form with extracted data
        const nameInput = document.getElementById('customerName');
        const emailInput = document.getElementById('customerEmail');
        const mobileInput = document.getElementById('customerMobile');
        
        if (nameInput && validatedContact.name) {
            nameInput.value = validatedContact.name;
        }
        if (emailInput && validatedContact.email) {
            emailInput.value = validatedContact.email;
        }
        if (mobileInput && validatedContact.mobile) {
            mobileInput.value = validatedContact.mobile;
        }
        
        // Clear any validation errors
        clearValidationErrors();
        
        // Validate the form to enable/disable submit button
        validateCustomerForm();
        
        // Setup modal event listeners
        setupCustomerInfoModalListeners();
        
        console.log('✅ Customer info modal shown with prefilled data');
    }
}

/**
 * Hide customer information modal
 */
function hideCustomerInfoModal() {
    const modal = document.getElementById('customerInfoModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Setup customer information modal event listeners
 */
function setupCustomerInfoModalListeners() {
    const form = document.getElementById('customerInfoForm');
    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    const mobileInput = document.getElementById('customerMobile');
    const submitBtn = document.getElementById('submitCustomerInfo');
    const cancelBtn = document.getElementById('cancelCustomerInfo');

    // Cancel button
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', hideCustomerInfoModal); // Remove existing
        cancelBtn.addEventListener('click', hideCustomerInfoModal);
    }

    // Form validation on input
    [nameInput, emailInput, mobileInput].forEach(input => {
        if (input) {
            input.removeEventListener('input', validateCustomerForm); // Remove existing
            input.addEventListener('input', validateCustomerForm);
            input.removeEventListener('blur', validateField); // Remove existing
            input.addEventListener('blur', validateField);
        }
    });

    // Form submission
    if (form) {
        form.removeEventListener('submit', handleCustomerInfoSubmit); // Remove existing
        form.addEventListener('submit', handleCustomerInfoSubmit);
    }
}

/**
 * Validate customer information form
 */
function validateCustomerForm() {
    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    const mobileInput = document.getElementById('customerMobile');
    const submitBtn = document.getElementById('submitCustomerInfo');

    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const mobile = mobileInput?.value.trim() || '';

    // Validate each field
    const isNameValid = name.length >= 2;
    const isEmailValid = email.includes('@') && email.includes('.') && email.length >= 5;
    const isMobileValid = mobile.length >= 10 && /[\d\s\+\-\(\)]+/.test(mobile);

    // Enable/disable submit button
    const allValid = isNameValid && isEmailValid && isMobileValid;
    if (submitBtn) {
        submitBtn.disabled = !allValid;
        submitBtn.style.opacity = allValid ? '1' : '0.6';
    }

    return allValid;
}

/**
 * Validate individual field on blur
 */
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    let isValid = false;
    let errorMessage = '';

    switch (field.id) {
        case 'customerName':
            isValid = value.length >= 2;
            errorMessage = 'Please enter your full name (at least 2 characters)';
            break;
        case 'customerEmail':
            isValid = value.includes('@') && value.includes('.') && value.length >= 5;
            errorMessage = 'Please enter a valid email address';
            break;
        case 'customerMobile':
            isValid = value.length >= 10 && /[\d\s\+\-\(\)]+/.test(value);
            errorMessage = 'Please enter a valid mobile number (at least 10 digits)';
            break;
    }

    // Show/hide error message
    const errorId = field.id.replace('customer', '').toLowerCase() + 'Error';
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
        if (value && !isValid) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
            field.classList.add('border-red-500');
        } else {
            errorElement.classList.add('hidden');
            field.classList.remove('border-red-500');
        }
    }
}

/**
 * Clear validation errors
 */
function clearValidationErrors() {
    ['nameError', 'emailError', 'mobileError'].forEach(id => {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    });
    
    ['customerName', 'customerEmail', 'customerMobile'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.classList.remove('border-red-500');
        }
    });
}

/**
 * Handle customer information form submission
 */
async function handleCustomerInfoSubmit(event) {
    event.preventDefault();
    
    if (!validateCustomerForm()) {
        return;
    }

    const formData = new FormData(event.target);
    const customerInfo = {
        name: formData.get('name'),
        email: formData.get('email'),
        mobile: formData.get('mobile')
    };

    console.log('👤 Customer info collected:', customerInfo);

    // Show loading state
    const submitBtn = document.getElementById('submitCustomerInfo');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Order...';
    }

    try {
        // Create order with customer info and analysis data
        const orderId = await createOrder(customerInfo);
        
        if (orderId) {
            console.log(`✅ Order created successfully: ${orderId}`);
            
            // Store customer info and order ID in session storage
            sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
            sessionStorage.setItem('orderId', orderId);

            // Hide customer info modal
            hideCustomerInfoModal();

            // Check if payment bypass is enabled
            const config = await fetchAppConfig();
            const shouldBypass = config.bypass_payment || config.free_mode_enabled;
            
            if (shouldBypass) {
                console.log('✅ Payment bypass enabled, proceeding to TXT download');
                // Store analysis data for TXT processing - use the correct analysis data
                sessionStorage.setItem('pendingAnalysis', JSON.stringify(analysisData));
                // Proceed directly to TXT download
                handleCVRewrite('customer_info');
            } else {
                console.log('💳 Payment required, redirecting to order page');
                // Store analysis data for order page - use the correct analysis data
                sessionStorage.setItem('pendingAnalysis', JSON.stringify(analysisData));
                // Redirect to create-order page for payment
                window.location.href = './create-order.html';
            }
        } else {
            throw new Error('Order creation failed - no order ID received');
        }
    } catch (error) {
        console.error('❌ Order creation error:', error);
        
        // Show error to user
        showOrderCreationError(error.message);
        
        // Reset submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Continue';
        }
    }
}

/**
 * Create order via API
 */
async function createOrder(customerInfo) {
    try {
        // Get analysis data from session storage
        const analysisData = JSON.parse(sessionStorage.getItem('atsAnalysis') || '{}');
        
        if (!analysisData || (!analysisData.content && !analysisData.resume_text)) {
            throw new Error('Analysis data not found. Please analyze your resume again.');
        }

        // Prepare request data
        const requestData = {
            email: customerInfo.email,
            phone: customerInfo.mobile,
            analysis_data: analysisData,
            user_id: null // Anonymous user for now
        };

        console.log('📦 Creating order with data:', { 
            email: requestData.email, 
            phone: requestData.phone,
            hasAnalysisData: !!requestData.analysis_data 
        });

        // Make API request to create order
        const response = await fetch('/api/orders/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: Order creation failed`);
        }

        const result = await response.json();
        
        if (!result.success || !result.order) {
            throw new Error(result.error || 'Invalid response from server');
        }

        // Log order creation details
        console.log('✅ Order created:', {
            orderId: result.order.order_id,
            email: result.order.order_email,
            mobile: result.order.order_mobile,
            amount: result.amount,
            currency: result.currency
        });

        // Store additional order details
        sessionStorage.setItem('orderDetails', JSON.stringify({
            orderId: result.order.order_id,
            amount: result.amount,
            currency: result.currency,
            createdAt: new Date().toISOString()
        }));

        return result.order.order_id;

    } catch (error) {
        console.error('❌ Create order error:', error);
        throw error;
    }
}

/**
 * Show order creation error to user
 */
function showOrderCreationError(message) {
    // Create or update error message element
    let errorDiv = document.getElementById('orderCreationError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'orderCreationError';
        errorDiv.className = 'mt-4 p-3 bg-red-50 border border-red-200 rounded-lg';
        
        // Insert before the form buttons
        const form = document.getElementById('customerInfoForm');
        const buttonsDiv = form?.querySelector('.flex.space-x-3');
        if (buttonsDiv) {
            form.insertBefore(errorDiv, buttonsDiv);
        }
    }
    
    errorDiv.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Order Creation Failed</h3>
                <p class="mt-1 text-sm text-red-700">${message}</p>
                <p class="mt-2 text-xs text-red-600">Please try again or contact support if the issue persists.</p>
            </div>
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

/**
 * Setup upgrade button
 */
function setupUpgradeButton() {
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            showCustomerInfoModal();
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
 * Show modal with specific issues for a category using backend modal content
 */
function showIssueModal(categoryName) {
    const modal = document.getElementById('issueModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalIssuesList = document.getElementById('modalIssuesList');
    
    if (!modal || !modalTitle || !modalIssuesList) {
        console.error('Modal elements not found');
        return;
    }
    
    console.log('🔍 Looking for modal content for category:', categoryName);
    
    // Try to get modal content from existing analysis data
    const modalContent = getModalContentFromAnalysis(categoryName);
    
    if (modalContent) {
        console.log('✅ Found backend modal content:', modalContent);
        displayBackendModalContent(modalContent, categoryName);
    } else {
        console.log('⚠️ No backend modal content found, using frontend fallback');
        displayFrontendModalContent(categoryName);
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Get modal content from existing analysis data
 */
function getModalContentFromAnalysis(categoryName) {
    try {
        // Check if we have analysis data with detailed analysis
        const detailedAnalysis = analysisData.detailedAnalysis || analysisData.detailed_analysis || {};
        
        if (!detailedAnalysis || Object.keys(detailedAnalysis).length === 0) {
            console.warn('No detailed analysis data available');
            return null;
        }
        
        // Convert category name to backend format
        const backendCategory = categoryName.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/&/g, 'and');
        
        console.log('🔍 Looking for backend category:', backendCategory);
        console.log('🔍 Available categories:', Object.keys(detailedAnalysis));
        
        // Look for the category in detailed analysis
        const categoryData = detailedAnalysis[backendCategory];
        
        if (categoryData && categoryData.modal_content) {
            console.log('✅ Found modal content for', backendCategory, ':', categoryData.modal_content);
            return categoryData.modal_content;
        }
        
        console.warn(`No modal content found for category: ${backendCategory}`);
        return null;
        
    } catch (error) {
        console.error('Error extracting modal content from analysis data:', error);
        return null;
    }
}

/**
 * Display modal content from backend response
 */
function displayBackendModalContent(modalContent, categoryName) {
    const modalTitle = document.getElementById('modalTitle');
    const modalIssuesList = document.getElementById('modalIssuesList');
    
    if (!modalTitle || !modalIssuesList) return;
    
    // Update modal title using backend title
    modalTitle.textContent = modalContent.title || `${categoryName} Issues Found`;
    
    // Clear issues list
    modalIssuesList.innerHTML = '';
    
    // Create generic section
    if (modalContent.generic_explanation) {
        const genericSection = document.createElement('div');
        genericSection.className = 'bg-blue-50 border-l-4 border-blue-400 p-4 mb-6';
        genericSection.innerHTML = `
            <h3 class="text-lg font-semibold text-blue-900 mb-3">Why This Matters for ATS</h3>
            <div class="text-sm text-blue-800 leading-relaxed whitespace-pre-line">${modalContent.generic_explanation}</div>
        `;
        modalIssuesList.appendChild(genericSection);
    }
    
    // Create dynamic examples section
    if (modalContent.dynamic_examples && modalContent.dynamic_examples.length > 0) {
        const dynamicSection = document.createElement('div');
        dynamicSection.className = 'bg-red-50 border-l-4 border-red-400 p-3 mb-3';
        dynamicSection.innerHTML = `
            <h3 class="text-md font-semibold text-red-900 mb-2">Issues Found</h3>
            <div class="space-y-2">
                ${modalContent.dynamic_examples.map((example, index) => `
                    <div class="bg-white border border-red-200 rounded p-2">
                        <div class="flex items-start gap-2">
                            <div class="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div class="flex-1">
                                <p class="text-xs font-medium text-gray-900 mb-1">${example.issue}</p>
                                <div class="bg-gray-50 border border-gray-200 rounded p-1 font-mono text-xs text-gray-600 mb-1">
                                    "${example.example}"
                                </div>
                                <p class="text-xs text-red-600">${example.suggestion}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        modalIssuesList.appendChild(dynamicSection);
    }
    
    // Add enhanced call-to-action section with prominent styling
    const ctaSection = document.createElement('div');
    ctaSection.className = 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-3 text-center mt-3';
    ctaSection.innerHTML = `
        <div class="text-lg mb-2">🚀</div>
        <h4 class="text-md font-bold text-green-800 mb-2">Ready to Fix These Issues?</h4>
        <p class="text-xs text-green-600">✓ Instant results • ✓ No credit card required</p>
    `;
    modalIssuesList.appendChild(ctaSection);
    
    // Update the modal button text based on payment config
    const modalFixBtn = document.getElementById('modalFixAllBtn');
    if (modalFixBtn) {
        updateModalCTAButton(modalFixBtn);
    }
}

/**
 * Fallback to display frontend-generated modal content
 */
function displayFrontendModalContent(categoryName) {
    const modalTitle = document.getElementById('modalTitle');
    const modalIssuesList = document.getElementById('modalIssuesList');
    
    // Update modal title
    modalTitle.textContent = `${categoryName} Issues Found`;
    
    // Generate specific issues for this category using existing frontend logic
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
    
    // Add the same enhanced CTA section for fallback modals
    const ctaSection = document.createElement('div');
    ctaSection.className = 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-3 text-center mt-3';
    ctaSection.innerHTML = `
        <div class="text-lg mb-2">🚀</div>
        <h4 class="text-md font-bold text-green-800 mb-2">Ready to Fix These Issues?</h4>
        <p class="text-xs text-green-600">✓ Instant results • ✓ No credit card required</p>
    `;
    modalIssuesList.appendChild(ctaSection);
    
    // Update the modal button text based on payment config for fallback modals too
    const modalFixBtn = document.getElementById('modalFixAllBtn');
    if (modalFixBtn) {
        updateModalCTAButton(modalFixBtn);
    }
}

/**
 * Generate specific issues with CV line references for a category (FALLBACK)
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
 * Handle modal fix all button - collect customer info first
 */
function handleModalFixAll() {
    console.log('🚀 Modal Fix All clicked');
    
    // Close the issue modal first
    closeIssueModal();
    
    // Check if customer info is already collected
    const customerInfo = JSON.parse(sessionStorage.getItem('customerInfo') || '{}');
    
    if (customerInfo.name && customerInfo.email && customerInfo.mobile) {
        // Customer info already collected, proceed directly
        console.log('✅ Customer info already available, proceeding to CV rewrite');
        handleCVRewrite('modal');
    } else {
        // Need to collect customer info first
        console.log('📝 Customer info needed, showing collection modal');
        showCustomerInfoModal();
    }
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