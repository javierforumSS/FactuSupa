// Referencias a DOM
const loginContainer = document.getElementById("login-container");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("login-error");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");

const invoiceList = document.getElementById("invoice-list");
const btnNewInvoice = document.getElementById("btn-new-invoice");
const invoiceForm = document.getElementById("invoice-form");
const btnSaveInvoice = document.getElementById("btn-save-invoice");
const btnCancel = document.getElementById("btn-cancel");

let currentUser = null;

// LOGIN
btnLogin.addEventListener("click", async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });
  if(error){ loginError.textContent = error.message; return; }
  currentUser = data.user;
  showDashboard();
});

// SIGNUP
btnSignup.addEventListener("click", async () => {
  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });
  if(error){ loginError.textContent = error.message; return; }
  alert("Cuenta creada. Confirma tu email y vuelve a loguearte.");
});

// LOGOUT
btnLogout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  currentUser = null;
  showLogin();
});

function showLogin(){
  loginContainer.style.display = "block";
  dashboard.style.display = "none";
}

function showDashboard(){
  loginContainer.style.display = "none";
  dashboard.style.display = "block";
  loadInvoices();
}

// Cargar facturas del usuario
async function loadInvoices(){
  invoiceList.innerHTML = "";
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("createdAt", { ascending:false });

  if(error) { console.error(error); return; }
  data.forEach(inv => {
    const div = document.createElement("div");
    div.textContent = `${inv.invoice_number} - ${inv.client_name} - Total: ${inv.total}`;
    invoiceList.appendChild(div);
  });
}

// Nueva factura
btnNewInvoice.addEventListener("click", () => {
  invoiceForm.style.display = "block";
});

// Cancelar
btnCancel.addEventListener("click", () => {
  invoiceForm.style.display = "none";
});

// Guardar factura
btnSaveInvoice.addEventListener("click", async () => {
  const itemsJSON = document.getElementById("items").value || "[]";
  const { error } = await supabase.from("invoices").insert([{
    user_id: currentUser.id,
    invoice_number: `TEMP-${Date.now()}`,
    client_name: document.getElementById("client_name").value,
    client_nif: document.getElementById("client_nif").value,
    client_address: document.getElementById("client_address").value,
    client_cp: document.getElementById("client_cp").value,
    client_city: document.getElementById("client_city").value,
    client_email: document.getElementById("client_email").value,
    invoice_date: document.getElementById("invoice_date").value,
    subtotal: parseFloat(document.getElementById("subtotal").value) || 0,
    iva: parseFloat(document.getElementById("iva").value) || 0,
    total: parseFloat(document.getElementById("total").value) || 0,
    paid: document.getElementById("paid").checked,
    items: itemsJSON,
    createdAt: new Date().toISOString()
  }]);
  if(error){ console.error(error); return; }
  invoiceForm.style.display = "none";
  loadInvoices();
});
