const btnInicio = document.getElementById('btnInicio');
const btnCampana = document.getElementById('btnCampana');
const contadorNotificaciones = document.getElementById('contadorNotificaciones');
const listaNotificaciones = document.getElementById('listaNotificaciones');

let sistemaActivo = false;
let teclasPresionadas = 0;
let totalNotificaciones = 0;

// Al dar clic en el botón "Inicio", se aplica el efecto sumido y se activa el conteo de teclas
btnInicio.addEventListener('click', () => {
    sistemaActivo = true;
    btnInicio.classList.add('presionado');
});

// Por cada tercera tecla apretada (una vez dado clic en Inicio), se genera una notificación
window.addEventListener('keydown', () => {
    if (!sistemaActivo) return;

    teclasPresionadas++;

    if (teclasPresionadas % 3 === 0) {
        totalNotificaciones++;
        contadorNotificaciones.textContent = totalNotificaciones;

        // Limpiar el mensaje inicial si es la primera notificación
        if (totalNotificaciones === 1) {
            listaNotificaciones.innerHTML = '';
        }

        // Crear el elemento con la leyenda exacta "Notificación X"
        const item = document.createElement('li');
        item.textContent = `Notificación ${totalNotificaciones}`;
        listaNotificaciones.appendChild(item);
    }
});

// Al dar clic en el ícono de notificaciones, desplegar/ocultar el menú con las notificaciones
btnCampana.addEventListener('click', () => {
    listaNotificaciones.classList.toggle('abierto');
});
