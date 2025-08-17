import"./output-DEU4ITj2-v2.js";const d=document.getElementById("atsScore"),l=document.getElementById("scoreCircle"),f=document.getElementById("markedAsDone"),m=document.getElementById("topFixesList"),u=document.getElementById("completedList"),r=document.getElementById("issuesList"),h=document.getElementById("strengthsList"),y=document.getElementById("upgradeBtn"),g=document.getElementById("summaryText"),x=document.getElementById("highPriorityCount"),C=document.getElementById("needFixesCount"),v=document.getElementById("completedCount"),c=JSON.parse(sessionStorage.getItem("atsResults")||"{}");console.log("📊 Analysis Data:",c);function I(){if(console.log("🚀 Initializing result page..."),!c||Object.keys(c).length===0){console.error("❌ No analysis data found"),O("No analysis data found. Please upload your resume again.");return}E(),b(),$(),A(),console.log("✅ Result page initialized successfully")}function E(){if(!d)return;const e=Math.round(c.ats_score||0);d.textContent=e,console.log("📊 Displaying score:",e),l&&(e>=80?l.style.borderColor="#10b981":e>=60?l.style.borderColor="#f59e0b":l.style.borderColor="#ef4444")}function b(){const e=c.component_scores||{},o=c.detailed_analysis||{};console.log("📊 Components:",e),console.log("📊 Detailed:",o),m&&(m.innerHTML=""),u&&(u.innerHTML=""),r&&(r.innerHTML="");const s=L(e),t=s.filter(a=>a.score<6),n=s.filter(a=>a.score>=6&&a.score<9),i=s.filter(a=>a.score>=9);if(console.log("📊 Category breakdown:",{low:t.length,medium:n.length,high:i.length,total:s.length}),g){const a=t.length+n.length;g.textContent=`${a} areas need improvement out of ${s.length} categories analyzed`}x&&(x.textContent=t.length),C&&(C.textContent=n.length),v&&(v.textContent=i.length),f&&(f.textContent=`${i.length} COMPLETED`),M(t,n,i),T(t,n),k(i)}function L(e,o){const s=[],t={structure:{name:"Resume Structure",maxScore:25},keywords:{name:"Keywords & Skills",maxScore:20},contact:{name:"Contact Information",maxScore:15},formatting:{name:"Formatting & Layout",maxScore:10},achievements:{name:"Quantified Achievements",maxScore:10},readability:{name:"Readability & Length",maxScore:10},dates:{name:"Date Formatting",maxScore:5},bullet_lengths:{name:"Bullet Lengths",maxScore:5}};for(const[n,i]of Object.entries(t)){const a=e[n]||0,p=i.maxScore,S=Math.round(a/p*10);s.push({name:i.name,score:Math.max(0,Math.min(10,S)),issue:w(n),impact:B(n)})}return s}function w(e){return{structure:"Improve resume structure and section organization",keywords:"Add more relevant industry keywords",contact:"Complete contact information with phone, email, LinkedIn",formatting:"Improve document formatting and layout",achievements:"Add more quantified achievements with numbers",readability:"Optimize text length and readability",dates:"Use consistent date formatting",bullet_lengths:"Optimize bullet point length (10-30 words)"}[e]||"Needs improvement"}function B(e){return{structure:"SECTIONS",keywords:"KEYWORDS",contact:"SECTIONS",formatting:"FORMAT",achievements:"IMPACT",readability:"READABILITY",dates:"FORMAT",bullet_lengths:"LANGUAGE"}[e]||"IMPROVEMENT"}function M(e,o,s){m&&[...e,...o].forEach(t=>{const n=document.createElement("div");n.className="sidebar-item";const i=t.score<6?"text-red-600":"text-orange-600";n.innerHTML=`
                <span class="text-sm text-gray-700">${t.name}</span>
                <span class="text-sm font-bold ${i}">${t.score}/10</span>
            `,m.appendChild(n)}),u&&s.forEach(t=>{const n=document.createElement("div");n.className="sidebar-item",n.innerHTML=`
                <span class="text-sm text-gray-700">${t.name}</span>
                <span class="text-sm font-bold text-green-600">${t.score}/10</span>
            `,u.appendChild(n)})}function T(e,o){if(!r)return;const s=[...e,...o];if(s.length===0){r.innerHTML=`
            <div class="text-center py-8">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Perfect ATS Score!</h3>
                <p class="text-gray-600">All categories are optimized. Your resume is ready!</p>
            </div>
        `;return}s.forEach((t,n)=>{const i=document.createElement("div"),a=t.score<6?"severity-high":"severity-medium",p=t.score<6?"high":"medium";i.className=`issue-card ${a}`,i.innerHTML=`
            <div class="issue-content">
                <h3>${t.name}</h3>
                <p>${t.issue}</p>
                <div class="issue-meta">
                    <span class="score-badge">${t.score}/10</span>
                    <span class="impact-badge ${p}">${t.impact}</span>
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${t.name}', ${n})">
                FIX →
            </button>
        `,r.appendChild(i)})}function k(e){if(h){if(e.length===0){h.innerHTML=`
            <div class="text-center py-8">
                <p class="text-gray-600">Complete the improvements above to unlock your strengths!</p>
            </div>
        `;return}e.forEach(o=>{const s=document.createElement("div");s.className="strength-item",s.innerHTML=`
            <div class="check-icon">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="strength-content">
                <h4>${o.name}</h4>
                <p>Excellent! Your ${o.name.toLowerCase()} is well-optimized for ATS systems.</p>
            </div>
        `,h.appendChild(s)})}}function $(){const e=document.getElementById("toggleIssuesBtn"),o=document.getElementById("toggleIcon");e&&r&&o&&e.addEventListener("click",()=>{r.classList.contains("hidden")?(r.classList.remove("hidden"),o.style.transform="rotate(180deg)",e.querySelector("h3").textContent="Hide Detailed Issues",e.querySelector("p").textContent="Collapse the detailed issues list"):(r.classList.add("hidden"),o.style.transform="rotate(0deg)",e.querySelector("h3").textContent="View Detailed Issues",e.querySelector("p").textContent="See exactly what needs to be fixed in your resume")})}function A(){y&&y.addEventListener("click",()=>{sessionStorage.setItem("pendingRewrite",JSON.stringify(c)),window.location.href="./payment.html"})}function F(e,o){console.log("🔧 Fix issue clicked:",e,o),sessionStorage.setItem("pendingRewrite",JSON.stringify(c)),window.location.href="./payment.html"}function O(e){d&&(d.textContent="Error"),g&&(g.textContent=e),console.error("❌ Error:",e)}window.handleFixIssue=F;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();
