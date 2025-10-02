// staff.js - view and update application status (limited)
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const appsListEl = document.getElementById("apps-list");

// ----------------------
// Toast function
// ----------------------
function showToast(msg, duration = 3000){
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(()=> toast.remove(), 300);
  }, duration);
}

// Toast CSS
const style = document.createElement("style");
style.innerHTML = `
.toast-message {
  position: fixed;
  bottom: 20px; left: 50%;
  transform: translateX(-50%);
  background: #333; color: #fff;
  padding: 10px 20px;
  border-radius: 5px;
  opacity: 0; transition: opacity 0.3s, bottom 0.3s;
  z-index: 9999;
}
.toast-message.show {
  opacity: 1;
  bottom: 40px;
}
`;
document.head.appendChild(style);

// ----------------------
// Load Applications
// ----------------------
async function loadApplications(){
  if(!appsListEl) return;
  appsListEl.innerHTML = "<p class='small'>Loading...</p>";

  const snaps = await getDocs(collection(db, "applications"));
  appsListEl.innerHTML = "";

  snaps.forEach(s => {
    const d = s.data();
    const row = document.createElement("div");
    row.className = "app-row";
    row.innerHTML = `
      <div>
        <strong>${d.serviceTitle}</strong>
        <div class='small'>Applicant: ${d.applicantEmail}</div>
      </div>
      <div>
        <select data-id="${s.id}" class="status-select">
          <option ${d.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option ${d.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option ${d.status === 'Approved' ? 'selected' : ''}>Approved</option>
          <option ${d.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
    `;
    appsListEl.appendChild(row);
  });

  // Bind select changes
  document.querySelectorAll(".status-select").forEach(sel=>{
    sel.addEventListener("change", async (e)=>{
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      await updateDoc(doc(db, "applications", id), { status: newStatus, updatedAt: Date.now() });
      showToast("Status updated");
    });
  });
}

// ----------------------
// Auth Check
// ----------------------
onAuthStateChanged(auth, user=>{
  if(!user) window.location.href = "login.html";
});


const logoutBtn = document.getElementById("logout-btn");
if(logoutBtn){
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // prevent default anchor behavior
    try {
      await signOut(auth);
      showToast("Logged out successfully", "success"); // use your toast function
      window.location.href = "index.html";
    } catch(err) {
      console.error("Logout failed", err);
      showToast("Logout failed: " + err.message, "error");
    }
  });
}
// ----------------------
// Initial Load
// ----------------------
loadApplications();
