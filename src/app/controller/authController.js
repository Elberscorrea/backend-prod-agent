import jwt from 'jsonwebtoken';
import { autenticarUsuario } from '../service/authService.js';

const SECRET_KEY = 'sua_chave_secreta_segura';

export async function login(req, res) {
  const { login, matricula } = req.body;

  if (!login || !matricula) {
    return res.status(400).json({ error: 'Login e matrícula são obrigatórios' });
  }

  try {
    const usuario = await autenticarUsuario(login, matricula);

    // Gerar token
    const token = jwt.sign(
      {
        id: usuario.id,
        role: usuario.role,
        nome: usuario.nome
      },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    return res.json({
      usuario,
      token
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}
