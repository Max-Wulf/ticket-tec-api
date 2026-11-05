export const current = async (req, res) => {
    try {
        const currentUser = req.user;

        return res .status(200).json({
            message: "Usuario autenticado correctamente",
            payload: req.user
        });
    }catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}