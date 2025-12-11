// api.js - Adaptación client-side de api.php usando Supabase JS SDK
// Incluye esto en tu index.html: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// Luego, <script src="api.js"></script> y usa las funciones como await getUser(), await saveUser(data), etc.
// Cambia const API = 'api.php'; a nada, y reemplaza fetch con estas funciones directamente en tu código.

const SUPABASE_URL = 'https://gqhfimpbjocjshjlcdmy.supabase.co';
const SUPABASE_ANON_KEY = 'D222$YQ4s6HWew!'; // Clave pública, segura para client-side con RLS activado

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const USER_ID = 1;

// Función equivalente a toFloat en PHP: "1.250,50" → 1250.50
function toFloat(str) {
    if (typeof str === 'number') return parseFloat(str);
    str = str.toString().trim().replace(/[^\d,\.]/g, '');
    str = str.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(str) || 0;
}

// Función para generar número correlativo (equivalente a la lógica en PHP)
async function getNextInvoiceNumber(invoice_date) {
    const year = new Date(invoice_date).getFullYear();
    const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', USER_ID)
        .ilike('invoice_number', `${year}-%`)
        .order('id', { ascending: false })
        .limit(1);

    if (error) throw error;
    let ultimo = 0;
    if (data && data.length > 0) {
        const parts = data[0].invoice_number.split('-');
        if (parts.length === 2) ultimo = parseInt(parts[1], 10);
    }
    const siguiente = ultimo + 1;
    return `${year}-${siguiente.toString().padStart(4, '0')}`;
}

// Equivalente a case 'get_user'
async function getUser() {
    try {
        let { data: user, error } = await supabase
            .from('users')
            .select('id, name, nif, email, address, phone, iban')
            .eq('id', 1)
            .single();

        if (error) throw error;

        if (!user) {
            // Si no existe, crear usuario por defecto
            const { error: insertError } = await supabase
                .from('users')
                .insert({ id: 1, name: '', nif: '', email: '', address: '', phone: '', iban: '' });

            if (insertError) throw insertError;

            user = { id: 1, name: '', nif: '', email: '', address: '', phone: '', iban: '' };
        }

        // Asegurar que todos los campos existen
        return {
            id: user.id ?? 1,
            name: user.name ?? '',
            nif: user.nif ?? '',
            email: user.email ?? '',
            address: user.address ?? '',
            phone: user.phone ?? '',
            iban: user.iban ?? ''
        };
    } catch (e) {
        console.error('Error en getUser:', e);
        throw e;
    }
}

// Equivalente a case 'get_invoices'
async function getInvoices() {
    try {
        const { data: rows, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', USER_ID)
            .order('id', { ascending: false });

        if (error) throw error;

        return rows.map(r => ({
            ...r,
            items: JSON.parse(r.items || '[]')
        }));
    } catch (e) {
        console.error('Error en getInvoices:', e);
        throw e;
    }
}

// Equivalente a case 'save_user'
async function saveUser(data) {
    try {
        // Verificar si existe el usuario
        const { data: existe, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', 1)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError; // Ignora error si no rows

        const userData = {
            name: data.name ?? '',
            nif: data.nif ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            phone: data.phone ?? '',
            iban: data.iban ?? ''
        };

        let error;
        if (existe) {
            // UPDATE
            ({ error } = await supabase
                .from('users')
                .update(userData)
                .eq('id', 1));
        } else {
            // INSERT
            ({ error } = await supabase
                .from('users')
                .insert({ id: 1, ...userData }));
        }

        if (error) throw error;

        return { success: true };
    } catch (e) {
        console.error('Error en saveUser:', e);
        throw e;
    }
}

// Equivalente a case 'save_invoice'
async function saveInvoice(data) {
    try {
        // Convertir valores numéricos
        data.subtotal = toFloat(data.subtotal ?? 0);
        data.iva = toFloat(data.iva ?? 0);
        data.total = toFloat(data.total ?? 0);

        // Generar número correlativo
        if (!data.invoice_number || data.invoice_number.toLowerCase().includes('temp')) {
            data.invoice_number = await getNextInvoiceNumber(data.invoice_date ?? new Date().toISOString().split('T')[0]);
        }

        const items = JSON.stringify(data.items ?? [], null, 2);

        const invoiceData = {
            user_id: USER_ID,
            invoice_number: data.invoice_number,
            client_name: data.client_name ?? '',
            client_nif: data.client_nif ?? '',
            client_address: data.client_address ?? '',
            client_cp: data.client_cp ?? '',
            client_city: data.client_city ?? '',
            client_email: data.client_email ?? '',
            invoice_date: data.invoice_date,
            subtotal: data.subtotal,
            iva: data.iva,
            total: data.total,
            paid: !!data.paid, // Convierte a boolean
            items: items
        };

        let id;
        if (!data.id) {
            // INSERT
            const { data: inserted, error } = await supabase
                .from('invoices')
                .insert(invoiceData)
                .select('id')
                .single();

            if (error) throw error;
            id = inserted.id;
        } else {
            // UPDATE
            const { error } = await supabase
                .from('invoices')
                .update(invoiceData)
                .eq('id', data.id)
                .eq('user_id', USER_ID);

            if (error) throw error;
            id = data.id;
        }

        return { success: true, id, invoice_number: data.invoice_number };
    } catch (e) {
        console.error('Error en saveInvoice:', e);
        throw e;
    }
}

// Equivalente a case 'delete_invoice'
async function deleteInvoice(id) {
    try {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)
            .eq('user_id', USER_ID);

        if (error) throw error;

        return { success: true };
    } catch (e) {
        console.error('Error en deleteInvoice:', e);
        throw e;
    }
}
