// officer.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const svcForm = document.getElementById("create-service");
const servicesListEl = document.getElementById("services-list");
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
// Load Services
// ----------------------
async function loadServices(){
  if(!servicesListEl) return;
  servicesListEl.innerHTML = "<p class='small'>Loading...</p>";

  const snaps = await getDocs(collection(db, "services"));
  servicesListEl.innerHTML = "";

  snaps.forEach(s => {
    const d = s.data();
    const div = document.createElement("div");
    div.className = "service-card card";
    div.dataset.id = s.id;
    div.innerHTML = `
      <h4>${d.title}</h4>
      <p class="small">${(d.description||"").slice(0,80)}</p>
      <button class="edit-svc">Edit</button>
      <button class="delete-svc">Delete</button>
      <div class="inline-edit-form" style="display:none; margin-top:10px;"></div>
    `;
    servicesListEl.appendChild(div);
  });

  // Bind Delete Buttons
  document.querySelectorAll(".delete-svc").forEach(btn=>{
    btn.addEventListener("click", async (e)=>{
      const id = e.target.closest(".service-card").dataset.id;
      if(!confirm("Delete service?")) return;
      await deleteDoc(doc(db, "services", id));
      showToast("Service deleted");
      loadServices();
    });
  });

  // Bind Edit Buttons (inline edit)
  document.querySelectorAll(".edit-svc").forEach(btn=>{
    btn.addEventListener("click", async (e)=>{
      const card = e.target.closest(".service-card");
      const id = card.dataset.id;
      const inlineDiv = card.querySelector(".inline-edit-form");

      if(inlineDiv.style.display === "block"){
        inlineDiv.style.display = "none";
        inlineDiv.innerHTML = "";
        return;
      }

      const serviceRef = doc(db, "services", id);
      const snap = await getDoc(serviceRef);
      const data = snap.data();

      inlineDiv.innerHTML = `
        <input type="text" class="edit-title" value="${data.title}" placeholder="Title"/><br/>
        <textarea class="edit-desc" placeholder="Description">${data.description || ""}</textarea><br/>
        <input type="text" class="edit-eligibility" value="${data.eligibility || ""}" placeholder="Eligibility"/><br/>
        <button class="save-edit">Save</button>
        <button class="cancel-edit">Cancel</button>
      `;
      inlineDiv.style.display = "block";

      inlineDiv.querySelector(".save-edit").addEventListener("click", async ()=>{
        const title = inlineDiv.querySelector(".edit-title").value.trim();
        const description = inlineDiv.querySelector(".edit-desc").value.trim();
        const eligibility = inlineDiv.querySelector(".edit-eligibility").value.trim();

        await updateDoc(serviceRef, { title, description, eligibility, updatedAt: Date.now() });
        showToast("Service updated");
        loadServices();
      });

      inlineDiv.querySelector(".cancel-edit").addEventListener("click", ()=>{
        inlineDiv.style.display = "none";
        inlineDiv.innerHTML = "";
      });
    });
  });
}

// ----------------------
// Load Applications
// ----------------------
async function loadApplications(){
  if(!appsListEl) return;
  appsListEl.innerHTML = "<p class='small'>Loading applications...</p>";

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
          <option ${d.status === 'Approved' ? 'selected' : ''}>Approved</option>
          <option ${d.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
    `;
    appsListEl.appendChild(row);
  });

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
// Service Form Submit
// ----------------------
if(svcForm){
  svcForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const title = document.getElementById("svc-title").value.trim();
    const description = document.getElementById("svc-desc").value.trim();
    const eligibility = document.getElementById("svc-eligibility").value.trim();

    await addDoc(collection(db, "services"), { title, description, eligibility, createdAt: Date.now() });
    showToast("Service created");
    svcForm.reset();
    loadServices();
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
loadServices();
loadApplications();
