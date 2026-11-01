
const posicionFacil =
    "2k4r/1pB1p3/p3Nnp1/n2p4/3P4/2P2P2/PP4P1/2qRKQ2 b - - 0 1";

const posicionDificil =
    "5rk1/ppq2ppp/2p5/4bN2/4P3/6Q1/PPP2PPP/3R2K1 w - - 0 1";

// Aquí guardaremos las partidas para enviarlas después
window.partidasRegistradas = {};

const configuraciones = [
    {
        id: "tablero-facil",
        fen: posicionFacil,
        nivel: 3,
        profundidad: 8,
        jugador: "b"
    },
    {
        id: "tablero-dificil",
        fen: posicionDificil,
        nivel: 10,
        profundidad: 12,
        jugador: "w"
    }
];

function crearPartida(config) {

    const elemento = document.getElementById(config.id);

    if (!elemento) {
        console.error("No se encontró el tablero:", config.id);
        return;
    }

    const partida = new Chess(config.fen);

    // Registrar partida
    window.partidasRegistradas[config.id] = partida;

    const estado = document.createElement("p");
    elemento.after(estado);

    estado.textContent =
        config.jugador === "b"
            ? "Tu turno: juega con negras."
            : "Tu turno: juega con blancas.";

    const motor = new Worker("stockfish-19-lite-single.js");

    let motorListo = false;
    let pensando = false;
    let tablero;

    motor.onmessage = function(evento) {

        const mensaje = evento.data;

        if (mensaje === "uciok") {
            motor.postMessage(
                "setoption name Skill Level value " + config.nivel
            );

            motor.postMessage("isready");
            return;
        }

        if (mensaje === "readyok") {
            motorListo = true;
            return;
        }

        if (mensaje.startsWith("bestmove")) {

            const partes = mensaje.split(" ");
            const mejorJugada = partes[1];

            if (!mejorJugada || mejorJugada === "(none)") {
                pensando = false;
                actualizarEstado();
                return;
            }

            const movimiento = partida.move({
                from: mejorJugada.substring(0, 2),
                to: mejorJugada.substring(2, 4),
                promotion: mejorJugada[4] || "q"
            });

            pensando = false;

            if (movimiento) {
                tablero.position(partida.fen());
            }

            actualizarEstado();
        }
    };

    motor.onerror = function() {
        estado.textContent = "Error al cargar Stockfish.";
        pensando = false;
    };

    tablero = Chessboard(config.id, {

        position: config.fen,
        draggable: true,

        pieceTheme:
            "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",

        onDragStart: function(origen, pieza) {

            if (
                pensando ||
                partida.game_over() ||
                partida.turn() !== config.jugador ||
                !pieza.startsWith(config.jugador)
            ) {
                return false;
            }
        },

        onDrop: function(origen, destino) {

            if (pensando || partida.turn() !== config.jugador) {
                return "snapback";
            }

            const movimiento = partida.move({
                from: origen,
                to: destino,
                promotion: "q"
            });

            if (movimiento === null) {
                return "snapback";
            }

            tablero.position(partida.fen());

            if (partida.game_over()) {
                actualizarEstado();
                return;
            }

            if (!motorListo) {
                estado.textContent = "Stockfish todavía está cargando.";
                return;
            }

            pensando = true;
            estado.textContent = "Stockfish está pensando...";

            motor.postMessage("position fen " + partida.fen());

            motor.postMessage(
                "go depth " + config.profundidad
            );
        },

        onSnapEnd: function() {
            tablero.position(partida.fen());
        }
    });

    function actualizarEstado() {

        if (partida.in_checkmate()) {
            estado.textContent =
                "¡Jaque mate! Ganaron " +
                (partida.turn() === "w" ? "las negras." : "las blancas.");
        }
        else if (partida.game_over()) {
            estado.textContent = "La partida terminó en tablas.";
        }
        else if (pensando) {
            estado.textContent = "Stockfish está pensando...";
        }
        else {
            estado.textContent =
                config.jugador === "b"
                    ? "Tu turno: juega con negras."
                    : "Tu turno: juega con blancas.";
        }
    }

    motor.postMessage("uci");
}

configuraciones.forEach(crearPartida);
