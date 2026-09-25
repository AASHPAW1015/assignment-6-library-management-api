// local server when running on this machine, hosted URL when deployed
const isLocal =
  location.protocol === "file:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

const API_BASE_URL = isLocal
  ? "http://localhost:5000"
  : "https://itm-library-management-api.onrender.com";

// fetch wrapper: adds the JWT if we have one and returns { response, data }
function callApi(path, method, body) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}/api${path}`, {
    method: method || "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then((response) => response.json().then((data) => ({ response, data })));
}

function showError(text) {
  Swal.fire({ icon: "error", title: "Oops...", text });
}

function showSuccess(text) {
  return Swal.fire({ icon: "success", title: "Success", text });
}

// the logged-in user object, or null
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    return null;
  }
}

function getRole() {
  const user = getUser();
  return user ? user.role : null;
}

// token missing or expired -> back to login
function handleUnauthorized(response, data) {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Swal.fire({ icon: "error", title: "Oops...", text: data.message }).then(
      () => {
        location.href = "login.html";
      },
    );
    return true;
  }
  return false;
}

function requireLogin() {
  if (!localStorage.getItem("token")) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "please login first!",
    }).then(() => {
      location.href = "login.html";
    });
    return false;
  }
  return true;
}

// blocks a page unless the user has the required role
function requireRole(role) {
  if (!requireLogin()) {
    return false;
  }
  if (getRole() !== role) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: `this page is for ${role}s only!`,
    }).then(() => {
      location.href = "books.html";
    });
    return false;
  }
  return true;
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.href = "index.html";
}
