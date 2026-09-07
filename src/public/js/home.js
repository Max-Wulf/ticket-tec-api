// Este archivo maneja la interacción de la vista en el navegador:
// abre el diálogo, carga horarios, envía reservas y escucha eventos por Socket.IO.

const socket = io(); // crea la coneccion con Socket.IO entre el navegador y el servidor.

const form = document.getElementById("booking-form");
const serviceInput = document.getElementById("booking-service");
const dateInput = document.getElementById("booking-date");
const timeInput = document.getElementById("booking-time");
const nameInput = document.getElementById("client-name");
const button = form.querySelector('button[type="submit"]');
const message = document.getElementById("booking-message");
const bookingDialog = document.getElementById("booking-dialog");
const closeBooking = document.getElementById("booking-close");

document.querySelectorAll(".service-booking-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    serviceInput.value = trigger.dataset.serviceId;
    message.textContent = "";
    timeInput.value = "";
    bookingDialog.showModal();
    document.body.classList.add("booking-open");
    dateInput.focus();
    loadTimes();
  });
});

closeBooking.addEventListener("click", () => bookingDialog.close());

bookingDialog.addEventListener("close", () => {
  document.body.classList.remove("booking-open");
});

let sending = false;
let requestNumber = 0;

// Fecha actual de la agenda en Argentina.
const todayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date());

const part = (type) =>
  todayParts.find((item) => item.type === type).value;

dateInput.min = `${part("year")}-${part("month")}-${part("day")}`;

function updateButton() {
  button.disabled =
    sending ||
    !serviceInput.value ||
    !dateInput.value ||
    timeInput.disabled ||
    !timeInput.value ||
    !nameInput.value.trim();
}

function resetTimes(text) {
  timeInput.replaceChildren(new Option(text, ""));
  timeInput.disabled = true;
  updateButton();
}

function getErrorMessage(result) {
  if (Array.isArray(result.message)) {
    return result.message.map((issue) => issue.message).join(". ");
  }

  return result.message || "No se pudo completar la operación";
}

async function loadTimes() {
  // Evita que una respuesta vieja reemplace una selección más reciente.
  const currentRequest = ++requestNumber;
  const selectedDate = dateInput.value;
  const previousTime = timeInput.value;

  resetTimes("Cargando horarios...");

  if (!serviceInput.value || !selectedDate) {
    resetTimes("Primero elegí servicio y fecha");
    return;
  }

  const day = new Date(`${selectedDate}T00:00:00Z`).getUTCDay();

  if (day === 0 || day === 6) {
    resetTimes("La atención es de lunes a viernes");
    return;
  }

  try {
    const response = await fetch("/api/bookings", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(result));
    }

    if (currentRequest !== requestNumber) return;

    
    const occupied = new Set(
      result.payload
        .filter((booking) => booking.date === selectedDate)
        .map((booking) => booking.time)
    );

    const available = [];

    for (let hour = 10; hour <= 17; hour++) {
      const time = `${hour}:00`;
      const appointment = new Date(
        `${selectedDate}T${time}:00-03:00`
      );

      if (
        !occupied.has(time) &&
        appointment.getTime() > Date.now()
      ) {
        available.push(time);
      }
    }

    if (available.length === 0) {
      resetTimes("No hay horarios disponibles");
      return;
    }

    timeInput.replaceChildren(
      new Option("Seleccioná un horario", "")
    );

    for (const time of available) {
      timeInput.add(new Option(time, time));
    }

    timeInput.disabled = false;

    if (available.includes(previousTime)) {
      timeInput.value = previousTime;
    }

    updateButton();
  } catch (error) {
    if (currentRequest !== requestNumber) return;

    resetTimes("No se pudieron consultar los horarios");
    message.textContent = error.message;
  }
}

serviceInput.addEventListener("change", () => {
  message.textContent = "";
  loadTimes();
});

dateInput.addEventListener("change", () => {
  message.textContent = "";
  loadTimes();
});

timeInput.addEventListener("change", updateButton);
nameInput.addEventListener("input", updateButton);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (sending || button.disabled || !form.reportValidity()) return;

  const data = {
    clientName: nameInput.value.trim(),
    services: [
      {
        service: serviceInput.value,
        quantity: 1,
      },
    ],
    date: dateInput.value,
    time: timeInput.value,
  };

  sending = true;
  updateButton();
  message.textContent = "Guardando reserva...";

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(result));
    }

    message.textContent =
      `Reserva confirmada para el ${result.payload.date} ` +
      `a las ${result.payload.time}.`;

    nameInput.value = "";
    timeInput.value = "";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    await loadTimes();
    sending = false;
    updateButton();
  }
});

socket.on("connect", () => {
  console.log("Conectado al servidor por Socket.IO");
  loadTimes();
});

socket.on("bookingCreated", (booking) => {
  console.log("Nueva reserva recibida:", booking);
  loadTimes();
});

// También permite consultar aunque Socket.IO todavía no conecte.
loadTimes();
