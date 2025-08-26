import"./modulepreload-polyfill-B5Qt9EMX-v2.js";/* empty css                  */console.log("🔄 Redirecting from legacy payment flow to PayU payment flow...");const t=()=>{if(document.querySelector("main")||document.querySelector(".container")||document.body){const e=document.createElement("div");e.className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50",e.innerHTML=`
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Redirecting to payment...</p>
            </div>
        `,document.body.appendChild(e)}setTimeout(()=>{window.location.href="./create-order.html"},500)};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t();
