import prisma from '../config/prismaClient.js';

export async function autenticarUsuario(login, matricula) {
  const executor = await prisma.executor.findFirst({
    where: { login, matricula },
    include: { role: true }
  });

  if (!executor) {
    throw new Error('Login ou matrícula inválidos');
  }

  return {
    id: executor.id,
    nome: executor.nome,
    login: executor.login,
    matricula: executor.matricula,
    role: executor.role?.nome ?? null
  };
}
