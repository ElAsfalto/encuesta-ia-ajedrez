
const URL_GOOGLE_SHEETS =
"https://script.google.com/macros/s/AKfycbytvFID8T2SkhOlIo2xHMB27TJ5CZTqDTAHjhk7cF7An2NWu_rgIag3F4aytRRVqXBZ_g/exec";

const formulario = document.getElementById("encuesta");

formulario.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    const boton = document.getElementById("enviar");
    const resultado = document.getElementById("resultado");

    boton.disabled = true;
    boton.textContent = "Enviando...";
    resultado.textContent = "Enviando tus respuestas...";

    const facil = window.partidasRegistradas["tablero-facil"];
    const dificil = window.partidasRegistradas["tablero-dificil"];

    const datos = {

        nombre: document.getElementById("nombre").value,

        tiempoIA: document.querySelector(
            'input[name="horas"]:checked'
        ).value,

        respuesta1: document.getElementById("respuesta1").value,
        respuesta2: document.getElementById("respuesta2").value,
        respuesta3: document.getElementById("respuesta3").value,

        razonamiento1: document.getElementById("razonamiento-1").value,
        razonamiento2: document.getElementById("razonamiento-2").value,

        puzleFacil: facil.history().join(", "),
        puzleDificil: dificil.history().join(", "),

        estadoFacil: obtenerEstado(facil),
        estadoDificil: obtenerEstado(dificil)
    };

    try {

        await fetch(URL_GOOGLE_SHEETS, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(datos)
        });

        resultado.textContent =
            "Solicitud enviada. Gracias por participar.";

        formulario.reset();

    } catch (error) {

        console.error(error);

        resultado.textContent =
            "No se pudo enviar. Inténtalo nuevamente.";

    } finally {

        boton.disabled = false;
        boton.textContent = "Enviar respuestas";

    }

});

function obtenerEstado(partida) {

    if (partida.in_checkmate()) {
        return "Jaque mate";
    }

    if (partida.game_over()) {
        return "Tablas";
    }

    return "Partida incompleta";
}
