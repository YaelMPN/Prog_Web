// Referencias a los elementos del DOM
const checkPrueba = document.getElementById('checkPrueba');
const btnAcepto = document.getElementById('btnAcepto');
const modalEmergente = document.getElementById('modalEmergente');
const btnCerrarModal = document.getElementById('btnCerrarModal');

// Gama del color rojo (desde tonos muy claros hasta rojo intenso y oscuro)
const gamaRojo = [
    { bg: '#fee2e2', text: '#991b1b' }, // Rojo muy claro / blanco rosáceo
    { bg: '#fca5a5', text: '#991b1b' }, // Rojo claro
    { bg: '#f87171', text: '#ffffff' }, // Rojo medio
    { bg: '#ef4444', text: '#ffffff' }, // Rojo estándar
    { bg: '#dc2626', text: '#ffffff' }, // Rojo intenso
    { bg: '#b91c1c', text: '#ffffff' }, // Rojo profundo
    { bg: '#7f1d1d', text: '#ffffff' }  // Rojo muy oscuro
];

let indiceColor = 0;

// Punto 4: Habilitar y cambiar el color de la gama cada vez que se seleccione la casilla
checkPrueba.addEventListener('change', () => {
    if (checkPrueba.checked) {
        // Habilitar botón
        btnAcepto.disabled = false;
        
        // Aplicar color actual de la gama
        const color = gamaRojo[indiceColor];
        btnAcepto.style.backgroundColor = color.bg;
        btnAcepto.style.color = color.text;
        btnAcepto.style.borderColor = color.bg;

        // Avanzar cíclicamente al siguiente color de la gama
        indiceColor = (indiceColor + 1) % gamaRojo.length;
    } else {
        // Al desmarcar, se inhabilita de nuevo y recupera su estilo neutral
        btnAcepto.disabled = true;
        btnAcepto.style.backgroundColor = '';
        btnAcepto.style.color = '';
        btnAcepto.style.borderColor = '';
    }
});

// Punto 5: Mostrar ventana emergente al hacer clic en el botón habilitado
btnAcepto.addEventListener('click', () => {
    if (!btnAcepto.disabled) {
        modalEmergente.classList.add('activo');
    }
});

// Punto 6: Botón "Aceptar" para cerrar la ventana emergente
btnCerrarModal.addEventListener('click', () => {
    modalEmergente.classList.remove('activo');
});

