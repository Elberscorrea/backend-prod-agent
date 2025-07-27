import jwt from 'jsonwebtoken';
import { autenticarUsuario } from '../service/authService.js';



const SECRET_KEY = 'sua_chave_secreta_segura';

export async function login(req, res) {
  const { login, matricula } = req.body;

  if (!login || !matricula) {
    return res.status(400).json({ error: 'Login e matrícula são obrigatórios' });
  }

  const tempoInicioTotal = Date.now();

  try {
    const inicioBusca = Date.now();
    const usuario = await autenticarUsuario(login, matricula);
    const fimBusca = Date.now();

    const inicioJWT = Date.now();
    const token = jwt.sign(
      {
        id: usuario.id,
        role: usuario.role,
        nome: usuario.nome,
        permissions: usuario.role === 'admin' ? ['dashboard', 'users'] : ['dashboard']
      },
      SECRET_KEY,
      { expiresIn: '8h' }
    );
    const fimJWT = Date.now();

    const tempoTotal = Date.now() - tempoInicioTotal;

    const response = {
      usuario,
      token
    };

    return res.json(response);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}
