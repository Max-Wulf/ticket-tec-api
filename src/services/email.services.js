import { transporter } from "../config/mailer.config.js";

export const sendTicketConfirmationEmail = async ({
    to,
    userName,
    eventTitle,
    ticketCode
}) => {
    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Confirmación de compra de entrada",
        html: `
            <h1>Compra confirmada</h1>
            <p>¡Hola ${userName}!</p>
            <p>Tu entrada para ${eventTitle} está confirmada.</p>
            <p>Código de la entrada:
                <strong>${ticketCode}</strong>
            </p>
        `
    });
};

transporter.verify()
    .then(() => {
        console.log("SMTP conectado correctamente");
    })
    .catch((error) => {
        console.error("Error SMTP:", error.message);
    });