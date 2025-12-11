// app.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userFields = ['name','nif','email','address','phone','iban'];
const userInputs = {};
userFields.forEach(f => userInputs[f] = document.getElementById(f));

const saveUserBtn = document.getElementById('save-user');
const invoicesTable = document.querySelector('#invoices-table tbody');
const newInvoiceBtn = document.getElementById('new-invoice');

let userId = null;

// --- FUNCIONES ---
async function loadUser() {
    const { data, error } = await supabase
        .from('User')
        .select('*')
        .limit(1)
        .single();
    
    if(error) { console.log(error); return; }
    
    if(data) {
        userId = data.id;
        userFields.forEach(f => userInputs[f].value = data[f] || '');
    }
}

async function saveUser() {
    const payload = {};
    userFields.forEach(f => payload[f] = userInputs[f].value);
    payload.createdAt = new Date().toISOString();

    if(userId) {
        const { error } = await supabase
            .from('User')
            .update(payload)
            .eq('id', userId);
        if(error) console.log(error);
    } else {
        const { data, error } = await supabase
            .from('User')
            .insert([payload])
            .select()
            .single();
        if(error) console.log(error);
        else userId = data.id;
    }
    alert('Datos guardados');
}

async function loadInvoices() {
    invoicesTable.innerHTML = '';
    const { data, error } = await supabase
        .from('Invoice')
        .select('*')
        .order('createdAt', { ascending: false });
    if(error) { console.log(error); return; }
    data.forEach(inv => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inv.invoice_number}</td>
            <td>${inv.client_name}</td>
            <td>${new Date(inv.invoice_date).toLocaleDateString()}</td>
            <td>${inv.total}</td>
            <td>
                <button data-id="${inv.id}" class="delete">Borrar</button>
            </td>
        `;
        invoicesTable.appendChild(tr);
    });
}

// --- EVENTOS ---
saveUserBtn.addEventListener('click', saveUser);

newInvoiceBtn.addEventListener('click', async () => {
    const invoice_number = prompt('Número de factura:');
    const client_name = prompt('Nombre cliente:');
    const subtotal = parseFloat(prompt('Subtotal:')) || 0;
    const iva = parseFloat(prompt('IVA:')) || 0;
    const total = subtotal + iva;
    const invoice_date = new Date().toISOString();
    const items = JSON.stringify([]);

    const { error } = await supabase
        .from('Invoice')
        .insert([{ invoice_number, client_name, invoice_date, subtotal, iva, total, paid: false, items, createdAt: invoice_date }]);
    if(error) { console.log(error); return; }
    loadInvoices();
});

invoicesTable.addEventListener('click', async (e) => {
    if(e.target.classList.contains('delete')) {
        const id = e.target.dataset.id;
        const { error } = await supabase
            .from('Invoice')
            .delete()
            .eq('id', id);
        if(error) console.log(error);
        loadInvoices();
    }
});

// --- INICIAL ---
loadUser();
loadInvoices();
