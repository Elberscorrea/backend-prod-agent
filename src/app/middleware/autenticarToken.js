import jwt from 'jsonwebtoken';

export function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });

        req.usuario = usuario; // Aqui vai o id, nome, matricula etc.
        next();
    });
}
