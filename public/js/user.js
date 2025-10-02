// user.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const servicesListEl = document.getElementById("services-list");
const myAppsEl = document.getElementById("my-apps");
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("search-btn");

// ----------------------
// Toast function
// ----------------------
function showToast(msg, duration = 3000){
  let toast = document.createElement("div");
  toast.className = "toast-message";
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(()=> toast.remove(), 300);
  }, duration);
}

// Add basic CSS for toast (insert into <style> in HTML or dynamically)
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
// Read services and render
// ----------------------
async function loadServices(filter = ""){
  if(!servicesListEl) return;
  servicesListEl.innerHTML = "<p class='small'>Loading services...</p>";
  const snaps = await getDocs(collection(db, "services"));
  const services = [];
  snaps.forEach(s => services.push({ id: s.id, ...s.data() }));
  const filtered = services.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()));
  renderServices(filtered);
}

function renderServices(list){
  if(!servicesListEl) return;
  servicesListEl.innerHTML = "";
  if(list.length === 0){
    servicesListEl.innerHTML = "<p class='small'>No services found.</p>";
    return;
  }
  list.forEach(s => {
    const div = document.createElement("div");
    div.className = "service-card card";
    div.innerHTML = `<h4>${s.title}</h4><p class="small">${(s.description||"").slice(0,120)}</p>
      <a href="service-details.html?id=${s.id}">View</a>`;
    servicesListEl.appendChild(div);
  });
}

// ----------------------
// Load application details for current user
// ----------------------
// ----------------------
// Load application details for current user (with Edit/Delete)
// ----------------------
async function loadMyApplications(uid){
  if(!myAppsEl) return;
  myAppsEl.innerHTML = "<p class='small'>Loading...</p>";

  try {
    const q = query(
      collection(db, "applications"),
      where("applicantUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snaps = await getDocs(q);

    myAppsEl.innerHTML = "";
    if(snaps.empty){
      myAppsEl.innerHTML = "<p class='small'>No applications found.</p>";
      return;
    }

    snaps.forEach(s => {
      const d = s.data();
      const el = document.createElement("div");
      el.className = "app-row";
      el.innerHTML = `
        <div>
          <strong>${d.serviceTitle}</strong>
          <div class="small">Status: ${d.status || "Pending"}</div>
        </div>
        <div class="small">${new Date(d.createdAt).toLocaleString()}</div>
        <div class="app-actions">
          <button class="edit-app">Edit</button>
          <button class="delete-app">Delete</button>
        </div>
      `;
      myAppsEl.appendChild(el);

      // ----------------------
      // Delete application
      // ----------------------
      el.querySelector(".delete-app").addEventListener("click", async () => {
        if(!confirm("Delete this application?")) return;
        try {
          await deleteDoc(doc(db, "applications", s.id));
          showToast("Application deleted");
          loadMyApplications(uid); // reload after delete
        } catch(err) {
          console.error("Delete failed:", err);
          showToast("Delete failed: " + err.message);
        }
      });

      // ----------------------
      // Edit application note
      // ----------------------
      el.querySelector(".edit-app").addEventListener("click", async () => {
        const newNote = prompt("Edit your application note:", d.note || "");
        if(newNote === null) return; // user cancelled
        try {
          await updateDoc(doc(db, "applications", s.id), { note: newNote, updatedAt: Date.now() });
          showToast("Application updated");
          loadMyApplications(uid); // reload after edit
        } catch(err) {
          console.error("Update failed:", err);
          showToast("Update failed: " + err.message);
        }
      });

    });

  } catch(err){
    console.error("Error loading applications:", err);
    if(err.code === "failed-precondition" || err.message.includes("requires an index")){
      myAppsEl.innerHTML = `<p class='small'>Cannot display applications. A Firestore index is required for this query. 
      <a href="https://console.firebase.google.com/project/${db.app.options.projectId}/firestore/indexes">Create Index</a></p>`;
    } else {
      myAppsEl.innerHTML = `<p class='small'>Error loading applications. Please try again later.</p>`;
    }
  }
}


// ----------------------
// Populate service details and apply form
// ----------------------
async function populateServiceDetails(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if(!id) return;

  const snap = await getDoc(doc(db, "services", id));
  if(!snap.exists()) return;
  const data = snap.data();

  document.getElementById("svc-title").innerText = data.title;
  document.getElementById("svc-desc").innerText = data.description;
  document.getElementById("svc-eligibility").innerText = data.eligibility || "Not specified";

  const applyForm = document.getElementById("apply-form");
  if(applyForm){
    applyForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const note = document.getElementById("app-note").value || "";
      const user = auth.currentUser;
      if(!user){
        showToast("Please login to apply");
        return;
      }

      const payload = {
        applicantUid: user.uid,
        applicantEmail: user.email,
        serviceId: id,
        serviceTitle: data.title,
        note,
        status: "Pending",
        createdAt: Date.now()
      };

      await addDoc(collection(db, "applications"), payload);
      showToast("Application submitted");
      setTimeout(()=> window.location.href = "user-dashboard.html", 1500);
    });
  }
}

// ----------------------
// Auth watcher
// ----------------------
onAuthStateChanged(auth, async (user) => {
  if(!user){
    if(window.location.pathname.includes("user-dashboard")) window.location.href = "login.html";
    return;
  }

  const welcome = document.getElementById("welcome");
  if(welcome){
    const udoc = await getDoc(doc(db, "users", user.uid));
    welcome.innerText = `Welcome, ${udoc.exists() ? udoc.data().name || user.email : user.email}`;
    loadMyApplications(user.uid);
  }
});

// ----------------------
// Search binding
// ----------------------
if(searchBtn){
  searchBtn.addEventListener("click", ()=> loadServices(searchInput.value || ""));
}

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

const backBtn = document.getElementById("back-btn");
if(backBtn){
  backBtn.addEventListener("click", () => {
    history.back(); // go to previous page
  });
}

// ----------------------
// Initial load
// ----------------------
loadServices();
populateServiceDetails();
