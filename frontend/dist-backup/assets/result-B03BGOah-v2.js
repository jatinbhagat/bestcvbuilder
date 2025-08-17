import"./output-DEU4ITj2-v2.js";const u=document.getElementById("atsScore"),m=document.getElementById("scoreCircle"),f=document.getElementById("markedAsDone"),c=document.getElementById("topFixesList"),d=document.getElementById("completedList"),l=document.getElementById("issuesList"),h=document.getElementById("strengthsList"),y=document.getElementById("upgradeBtn"),g=document.getElementById("summaryText"),x=document.getElementById("highPriorityCount"),v=document.getElementById("needFixesCount"),b=document.getElementById("completedCount");let i;try{const e=sessionStorage.getItem("atsAnalysis");console.log("📊 Raw session data:",e),i=JSON.parse(e||"{}"),console.log("📊 Parsed Analysis Data:",i)}catch(e){console.error("❌ Failed to parse session data:",e),i={}}function S(){if(console.log("🚀 Initializing result page..."),console.log("🔍 All session storage keys:",Object.keys(sessionStorage)),console.log("🔍 atsAnalysis:",sessionStorage.getItem("atsAnalysis")),console.log("🔍 atsResults:",sessionStorage.getItem("atsResults")),!i||Object.keys(i).length===0){console.error("❌ No analysis data found");const e=sessionStorage.getItem("atsResults")||sessionStorage.getItem("analysisResults");if(e){console.log("📊 Found alternative data:",e);try{i=JSON.parse(e),console.log("📊 Using alternative data:",i)}catch(n){console.error("❌ Failed to parse alternative data:",n)}}if(!i||Object.keys(i).length===0){$("No analysis data found. Please upload your resume again.");return}}C(),E(),A(),F(),console.log("✅ Result page initialized successfully")}function C(){if(!u)return;const e=Math.round(i.ats_score||0);u.textContent=e,console.log("📊 Displaying score:",e),m&&(e>=80?m.style.borderColor="#10b981":e>=60?m.style.borderColor="#f59e0b":m.style.borderColor="#ef4444")}function E(){const e=i.component_scores||{},n=i.detailed_analysis||{};console.log("📊 Components:",e),console.log("📊 Detailed:",n),c&&(c.innerHTML=""),d&&(d.innerHTML=""),l&&(l.innerHTML="");const o=L(e),t=o.filter(r=>r.score<6),s=o.filter(r=>r.score>=6&&r.score<9),a=o.filter(r=>r.score>=9);if(console.log("📊 Category breakdown:",{low:t.length,medium:s.length,high:a.length,total:o.length}),g){const r=t.length+s.length;g.textContent=`${r} areas need improvement out of ${o.length} categories analyzed`}x&&(x.textContent=t.length),v&&(v.textContent=s.length),b&&(b.textContent=a.length),f&&(f.textContent=`${a.length} COMPLETED`),M(t,s,a),T(t,s),k(a)}function L(e,n){const o=[],t={structure:{name:"Resume Structure",maxScore:25},keywords:{name:"Keywords & Skills",maxScore:20},contact:{name:"Contact Information",maxScore:15},formatting:{name:"Formatting & Layout",maxScore:10},achievements:{name:"Quantified Achievements",maxScore:10},readability:{name:"Readability & Length",maxScore:10},dates:{name:"Date Formatting",maxScore:5},bullet_lengths:{name:"Bullet Lengths",maxScore:5}};for(const[s,a]of Object.entries(t)){const r=e[s]||0,p=a.maxScore,I=Math.round(r/p*10);o.push({name:a.name,score:Math.max(0,Math.min(10,I)),issue:w(s),impact:B(s)})}return o}function w(e){return{structure:"Improve resume structure and section organization",keywords:"Add more relevant industry keywords",contact:"Complete contact information with phone, email, LinkedIn",formatting:"Improve document formatting and layout",achievements:"Add more quantified achievements with numbers",readability:"Optimize text length and readability",dates:"Use consistent date formatting",bullet_lengths:"Optimize bullet point length (10-30 words)"}[e]||"Needs improvement"}function B(e){return{structure:"SECTIONS",keywords:"KEYWORDS",contact:"SECTIONS",formatting:"FORMAT",achievements:"IMPACT",readability:"READABILITY",dates:"FORMAT",bullet_lengths:"LANGUAGE"}[e]||"IMPROVEMENT"}function M(e,n,o){c&&[...e,...n].forEach(t=>{const s=document.createElement("div");s.className="sidebar-item";const a=t.score<6?"text-red-600":"text-orange-600";s.innerHTML=`
                <span class="text-sm text-gray-700">${t.name}</span>
                <span class="text-sm font-bold ${a}">${t.score}/10</span>
            `,c.appendChild(s)}),d&&o.forEach(t=>{const s=document.createElement("div");s.className="sidebar-item",s.innerHTML=`
                <span class="text-sm text-gray-700">${t.name}</span>
                <span class="text-sm font-bold text-green-600">${t.score}/10</span>
            `,d.appendChild(s)})}function T(e,n){if(!l)return;const o=[...e,...n];if(o.length===0){l.innerHTML=`
            <div class="text-center py-8">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Perfect ATS Score!</h3>
                <p class="text-gray-600">All categories are optimized. Your resume is ready!</p>
            </div>
        `;return}o.forEach((t,s)=>{const a=document.createElement("div"),r=t.score<6?"severity-high":"severity-medium",p=t.score<6?"high":"medium";a.className=`issue-card ${r}`,a.innerHTML=`
            <div class="issue-content">
                <h3>${t.name}</h3>
                <p>${t.issue}</p>
                <div class="issue-meta">
                    <span class="score-badge">${t.score}/10</span>
                    <span class="impact-badge ${p}">${t.impact}</span>
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${t.name}', ${s})">
                FIX →
            </button>
        `,l.appendChild(a)})}function k(e){if(h){if(e.length===0){h.innerHTML=`
            <div class="text-center py-8">
                <p class="text-gray-600">Complete the improvements above to unlock your strengths!</p>
            </div>
        `;return}e.forEach(n=>{const o=document.createElement("div");o.className="strength-item",o.innerHTML=`
            <div class="check-icon">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="strength-content">
                <h4>${n.name}</h4>
                <p>Excellent! Your ${n.name.toLowerCase()} is well-optimized for ATS systems.</p>
            </div>
        `,h.appendChild(o)})}}function A(){const e=document.getElementById("toggleIssuesBtn"),n=document.getElementById("toggleIcon");e&&l&&n&&e.addEventListener("click",()=>{l.classList.contains("hidden")?(l.classList.remove("hidden"),n.style.transform="rotate(180deg)",e.querySelector("h3").textContent="Hide Detailed Issues",e.querySelector("p").textContent="Collapse the detailed issues list"):(l.classList.add("hidden"),n.style.transform="rotate(0deg)",e.querySelector("h3").textContent="View Detailed Issues",e.querySelector("p").textContent="See exactly what needs to be fixed in your resume")})}function F(){y&&y.addEventListener("click",()=>{sessionStorage.setItem("pendingRewrite",JSON.stringify(i)),window.location.href="./payment.html"})}function O(e,n){console.log("🔧 Fix issue clicked:",e,n),sessionStorage.setItem("pendingRewrite",JSON.stringify(i)),window.location.href="./payment.html"}function $(e){console.error("❌ Error:",e),u&&(u.textContent="—"),g&&(g.textContent=e),l&&(l.innerHTML=`
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <span class="text-2xl text-red-600">❌</span>
                </div>
                <h3 class="text-lg font-bold text-red-900 mb-2">No Analysis Data Found</h3>
                <p class="text-red-700 mb-4">${e}</p>
                <button onclick="window.location.href='./index.html'" class="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors">
                    Upload Resume
                </button>
            </div>
        `,l.classList.remove("hidden")),c&&(c.innerHTML='<div class="text-sm text-gray-500 p-4">No data available</div>'),d&&(d.innerHTML='<div class="text-sm text-gray-500 p-4">No data available</div>')}window.handleFixIssue=O;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S):S();
