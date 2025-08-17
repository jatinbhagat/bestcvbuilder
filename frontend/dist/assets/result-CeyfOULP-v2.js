import"./output-DEU4ITj2-v2.js";const u=document.getElementById("atsScore"),m=document.getElementById("scoreCircle"),h=document.getElementById("markedAsDone"),c=document.getElementById("topFixesList"),d=document.getElementById("completedList"),r=document.getElementById("issuesList"),y=document.getElementById("strengthsList"),f=document.getElementById("upgradeBtn"),g=document.getElementById("summaryText"),p=document.getElementById("highPriorityCount"),x=document.getElementById("needFixesCount"),v=document.getElementById("completedCount");let a;try{const e=sessionStorage.getItem("atsAnalysis");console.log("📊 Raw session data:",e),a=JSON.parse(e||"{}"),console.log("📊 Parsed Analysis Data:",a)}catch(e){console.error("❌ Failed to parse session data:",e),a={}}function b(){if(console.log("🚀 Initializing result page..."),console.log("🔍 All session storage keys:",Object.keys(sessionStorage)),console.log("🔍 atsAnalysis:",sessionStorage.getItem("atsAnalysis")),console.log("🔍 atsResults:",sessionStorage.getItem("atsResults")),!a||Object.keys(a).length===0){console.error("❌ No analysis data found");const e=sessionStorage.getItem("atsResults")||sessionStorage.getItem("analysisResults");if(e){console.log("📊 Found alternative data:",e);try{a=JSON.parse(e),console.log("📊 Using alternative data:",a)}catch(t){console.error("❌ Failed to parse alternative data:",t)}}if(!a||Object.keys(a).length===0){F("No analysis data found. Please upload your resume again.");return}}C(),E(),T(),A(),console.log("✅ Result page initialized successfully")}function C(){if(!u)return;const e=Math.round(a.score||a.ats_score||0);u.textContent=e,console.log("📊 Displaying score:",e,"from data:",{score:a.score,ats_score:a.ats_score}),m&&(e>=80?m.style.borderColor="#10b981":e>=60?m.style.borderColor="#f59e0b":m.style.borderColor="#ef4444")}function E(){const e=a.detailedAnalysis||a.detailed_analysis||{},t=a.component_scores||{};console.log("📊 Detailed Analysis:",e),console.log("📊 Component Scores:",t),c&&(c.innerHTML=""),d&&(d.innerHTML=""),r&&(r.innerHTML="");const o=L(t,e),n=o.filter(l=>l.score<6),s=o.filter(l=>l.score>=6&&l.score<9),i=o.filter(l=>l.score>=9);if(console.log("📊 Category breakdown:",{low:n.length,medium:s.length,high:i.length,total:o.length}),g){const l=n.length+s.length;g.textContent=`${l} areas need improvement out of ${o.length} categories analyzed`}p&&(p.textContent=n.length),x&&(x.textContent=s.length),v&&(v.textContent=i.length),h&&(h.textContent=`${i.length} COMPLETED`),k(n,s,i),M(n,s),B(i)}function L(e,t){const o=[];return console.log("🔍 Creating categories from detailed analysis:",t),[{key:"structure",name:"Resume Structure",data:t.structure},{key:"keywords",name:"Keywords & Skills",data:t.keywords},{key:"contact",name:"Contact Information",data:t.contact},{key:"formatting",name:"Formatting & Layout",data:t.formatting},{key:"achievements",name:"Quantified Achievements",data:t.achievements},{key:"readability",name:"Readability & Length",data:t.readability},{key:"dates",name:"Date Formatting",data:t.dates},{key:"bullet_lengths",name:"Bullet Lengths",data:t.bullet_lengths}].forEach(s=>{if(s.data&&typeof s.data.score<"u"){const i=Math.max(0,Math.min(10,Math.round(s.data.score)));o.push({name:s.name,score:i,issue:S(s.key,s.data),impact:w(s.key)}),console.log(`📊 ${s.name}: ${i}/10`)}else console.warn(`⚠️ No data for ${s.name}:`,s.data)}),console.log("📊 Final categories created:",o),o}function S(e,t){return t&&t.issues&&t.issues.length>0?t.issues[0]:{structure:"Improve resume structure and section organization",keywords:"Add more relevant industry keywords",contact:"Complete contact information with phone, email, LinkedIn",formatting:"Improve document formatting and layout",achievements:"Add more quantified achievements with numbers",readability:"Optimize text length and readability",dates:"Use consistent date formatting",bullet_lengths:"Optimize bullet point length (10-30 words)"}[e]||"Needs improvement"}function w(e){return{structure:"SECTIONS",keywords:"KEYWORDS",contact:"SECTIONS",formatting:"FORMAT",achievements:"IMPACT",readability:"READABILITY",dates:"FORMAT",bullet_lengths:"LANGUAGE"}[e]||"IMPROVEMENT"}function k(e,t,o){c&&[...e,...t].forEach(n=>{const s=document.createElement("div");s.className="sidebar-item";const i=n.score<6?"text-red-600":"text-orange-600";s.innerHTML=`
                <span class="text-sm text-gray-700">${n.name}</span>
                <span class="text-sm font-bold ${i}">${n.score}/10</span>
            `,c.appendChild(s)}),d&&o.forEach(n=>{const s=document.createElement("div");s.className="sidebar-item",s.innerHTML=`
                <span class="text-sm text-gray-700">${n.name}</span>
                <span class="text-sm font-bold text-green-600">${n.score}/10</span>
            `,d.appendChild(s)})}function M(e,t){if(!r)return;const o=[...e,...t];if(o.length===0){r.innerHTML=`
            <div class="text-center py-8">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Perfect ATS Score!</h3>
                <p class="text-gray-600">All categories are optimized. Your resume is ready!</p>
            </div>
        `;return}o.forEach((n,s)=>{const i=document.createElement("div"),l=n.score<6?"severity-high":"severity-medium",I=n.score<6?"high":"medium";i.className=`issue-card ${l}`,i.innerHTML=`
            <div class="issue-content">
                <h3>${n.name}</h3>
                <p>${n.issue}</p>
                <div class="issue-meta">
                    <span class="score-badge">${n.score}/10</span>
                    <span class="impact-badge ${I}">${n.impact}</span>
                </div>
            </div>
            <button class="fix-button" onclick="handleFixIssue('${n.name}', ${s})">
                FIX →
            </button>
        `,r.appendChild(i)})}function B(e){if(y){if(e.length===0){y.innerHTML=`
            <div class="text-center py-8">
                <p class="text-gray-600">Complete the improvements above to unlock your strengths!</p>
            </div>
        `;return}e.forEach(t=>{const o=document.createElement("div");o.className="strength-item",o.innerHTML=`
            <div class="check-icon">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="strength-content">
                <h4>${t.name}</h4>
                <p>Excellent! Your ${t.name.toLowerCase()} is well-optimized for ATS systems.</p>
            </div>
        `,y.appendChild(o)})}}function T(){const e=document.getElementById("toggleIssuesBtn"),t=document.getElementById("toggleIcon");e&&r&&t&&e.addEventListener("click",()=>{r.classList.contains("hidden")?(r.classList.remove("hidden"),t.style.transform="rotate(180deg)",e.querySelector("h3").textContent="Hide Detailed Issues",e.querySelector("p").textContent="Collapse the detailed issues list"):(r.classList.add("hidden"),t.style.transform="rotate(0deg)",e.querySelector("h3").textContent="View Detailed Issues",e.querySelector("p").textContent="See exactly what needs to be fixed in your resume")})}function A(){f&&f.addEventListener("click",()=>{sessionStorage.setItem("pendingRewrite",JSON.stringify(a)),window.location.href="./payment.html"})}function $(e,t){console.log("🔧 Fix issue clicked:",e,t),sessionStorage.setItem("pendingRewrite",JSON.stringify(a)),window.location.href="./payment.html"}function F(e){console.error("❌ Error:",e),u&&(u.textContent="—"),g&&(g.textContent=e),r&&(r.innerHTML=`
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
        `,r.classList.remove("hidden")),c&&(c.innerHTML='<div class="text-sm text-gray-500 p-4">No data available</div>'),d&&(d.innerHTML='<div class="text-sm text-gray-500 p-4">No data available</div>')}window.handleFixIssue=$;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",b):b();
