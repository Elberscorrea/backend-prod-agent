import prisma from "../../app/config/prismaClient.js";

export async function autenticarUsuario(login, matricula) {
  console.time('🔍 Prisma - executor');

  const loginNormalizado = login.trim().toUpperCase();
  const matriculaNormalizada = matricula.trim().replace(/^0+/, '');

  const executor = await prisma.executor.findFirst({
    where: {
      login: {
        equals: loginNormalizado,
        mode: 'insensitive'
      },
      matricula: {
        equals: matriculaNormalizada,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      nome: true,
      login: true,
      matricula: true,
      role: {
        select: {
          role: true
        }
      }
    }
  });


  if (!executor) {
    throw new Error('Login ou matrícula inválidos');
  }

  return {
    id: executor.id,
    nome: executor.nome,
    login: executor.login,
    matricula: executor.matricula,
    role: executor.role?.role ?? null
  };
}
