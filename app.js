// app.js

// Referencias HTML
const loginDiv = document.getElementById('login');
const appDiv = document.getElementById('app');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');
const btnLogout = document.getElementById('btnLogout');

const userNameSpan = document.getElementById('userName');
const invoiceList = document.getElementById('invoiceList');
const btnSaveInvoice = document.getElementById('btnSaveInvoice');

// Inputs factura
const client_name = document.getElementById('client_name');
const client_nif = document.getElementById('client_nif');
const client_address = document.getElementById('client_address');
const subtotal = document.getElementById('subtotal');
const iva = document.getElementById('iva');
const total = document.getElementById('total');

// Login
btnLogin.addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
    });
    if (error) alert(error.message);
});

// Register
btnRegister.addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value
    });
    if (error) alert(error.message);
    else alert('Registrado, revisa tu email para confirmar');
});

// Logout
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// Detectar sesión
supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        loginDiv.style.display = 'none';
        appDiv.style.display = 'block';
        userNameSpan.textContent = session.user.email;
        loadInvoices();
    } else {
        loginDiv.style.display = 'block';
        appDiv.style.display = 'none';
    }
});

// Guardar factura
btnSaveInvoice.addEventListener('click', async () => {
    const { data, error } = await supabase.from('invoices').insert([{
        invoice_number: 'TEMP-' + Date.now(),
        client_name: client_name.value,
        client_nif: client_nif.value,
        client_address: client_address.value,
        invoice_date: new Date().toISOString(),
        subtotal: parseFloat(subtotal.value),
        iva: parseFloat(iva.value),
        total: parseFloat(total.value),
        paid: false,
        items: '[]',
        createdAt: new Date().toISOString(),
        user_id: supabase.auth.user().id
    }]);
    if (error) alert(error.message);
    else loadInvoices();
});

// Cargar facturas
async function loadInvoices() {
    const { data, error } = await supabase.from('invoices')
        .select('*')
        .eq('user_id', supabase.auth.user().id)
        .order('createdAt', { ascending: false });
    if (error) alert(error.message);
    invoiceList.innerHTML = '';
    data.forEach(inv => {
        const li = document.createElement('li');
        li.textContent = `${inv.invoice_number} - ${inv.client_name} - ${inv.total}€`;
        invoiceList.appendChild(li);
    });
}
