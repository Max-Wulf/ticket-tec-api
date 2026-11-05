export const ticketDTO = (ticket) => {
    const t = ticket.toObject ? ticket.toObject() : ticket;

    return {
        id: t._id?.toString(),
        user: t.user,
        event: t.event,
        sector: t.sector,
        quantity: t.quantity,
        status: t.status,
        reservationCode: t.reservationCode,
        expiresAt: t.expiresAt,
        createdAt: t.createdAt,
        cancelledAt: t.cancelledAt
    };
};