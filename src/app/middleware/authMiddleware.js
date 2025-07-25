import jwt from 'jsonwebtoken';

const SECRET_KEY = 'sua_chave_secreta_segura';

export function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded; // agora sim: id, nome, matricula etc.
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}
