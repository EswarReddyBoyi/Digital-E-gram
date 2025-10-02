// auth.js - handles register/login/logout, user creation in Firestore
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");

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
// Register handler
// ----------------------
async function registerHandler(e){
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try{
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), { name, email, role, createdAt: Date.now() });
    console.log("User saved to Firestore", uid);
    showToast("Registered successfully! Please login.");
    setTimeout(()=> window.location.href = "login.html", 1500);
  }catch(err){
    console.error("Register error", err);
    showToast("Registration failed: " + err.message);
  }
}

// ----------------------
// Login handler
// ----------------------
async function loginHandler(e){
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try{
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    const snap = await getDoc(doc(db, "users", uid));
    if(!snap.exists()){
      // safety: create minimal record
      await setDoc(doc(db, "users", uid), { email, role: "user", createdAt: Date.now() });
    }
    // redirect based on role
    const data = snap.exists() ? snap.data() : { role: "user" };
    if(data.role === "officer") window.location.href = "officer-dashboard.html";
    else if(data.role === "staff") window.location.href = "staff-dashboard.html";
    else window.location.href = "user-dashboard.html";
  }catch(err){
    console.error("Login failed", err);
    showToast("Login failed: " + err.message);
  }
}

// ----------------------
// Event bindings
// ----------------------
if(registerForm) registerForm.addEventListener("submit", registerHandler);
if(loginForm) loginForm.addEventListener("submit", loginHandler);

// Logout button
const logoutBtn = document.getElementById("logout-btn");
if(logoutBtn){
  logoutBtn.addEventListener("click", async ()=>{
    try{
      await signOut(auth);
      showToast("Logged out successfully");
      setTimeout(()=> window.location.href = "index.html", 1000);
    }catch(err){ 
      console.error("Logout failed", err); 
      showToast("Logout failed: " + err.message);
    }
  });
}

const forgotLink = document.getElementById("forgot-password-link");
if(forgotLink){
  forgotLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    if(!email){
      showToast("Please enter your email first");
      return;
    }
    try{
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent. Check your inbox!");
    }catch(err){
      console.error("Reset password failed:", err);
      showToast("Error: " + err.message);
    }
  });
}