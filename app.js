// Elementos del DOM
const btnRegister = document.getElementById('btnRegister');
const btnLogin = document.getElementById('btnLogin');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Registrar usuario
btnRegister.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await window.supabase.auth.signUp({ email, password });
    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Usuario registrado. Revisa tu email.');
    }
});

// Login usuario
btnLogin.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Login correcto. Token: ' + data.session.access_token);
    }
});

// Escuchar cambios de sesión
window.supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    console.log('Session:', session);
});
