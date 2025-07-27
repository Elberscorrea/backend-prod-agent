import prisma from '../config/prismaClient.js';

export async function buscarProdutividadeDoMesAtual(id_executor) {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;

  const status = await prisma.status.findFirst({
    where: { nome: 'Produtivo' },
    select: { id: true }
  });

  if (!status) throw new Error('Status "Produtivo" não encontrado');

  const resultados = await prisma.$queryRaw`
    SELECT 
      DATE(data_execucao) AS dia,
      COUNT(*)::int AS total
    FROM servicos
    WHERE id_executor = ${id_executor}
      AND id_status = ${status.id}
      AND data_execucao IS NOT NULL
      AND EXTRACT(MONTH FROM data_execucao) = ${mes}
      AND EXTRACT(YEAR FROM data_execucao) = ${ano}
    GROUP BY dia
    ORDER BY dia
  `;

  const diasUteis = getDiasUteisDoMes(ano, mes);
  const meta = diasUteis * 100;

  let total = 0;
  const servicos_por_dia = {};

  for (const linha of resultados) {
    servicos_por_dia[linha.dia.toISOString().split('T')[0]] = linha.total;
    total += linha.total;
  }

  const progresso = parseFloat(((total / meta) * 100).toFixed(1));
  const media_diaria = parseFloat((total / diasUteis).toFixed(1));
  const faltam = Math.max(0, meta - total);

  return {
    executor: { id: id_executor },
    mes: String(mes).padStart(2, '0'),
    ano,
    total,
    meta,
    progresso,
    faltam,
    media_diaria,
    servicos_por_dia
  };
}

function getDiasUteisDoMes(ano, mes1a12) {
  const dias = new Date(ano, mes1a12, 0).getDate();
  let total = 0;

  for (let dia = 1; dia <= dias; dia++) {
    const data = new Date(ano, mes1a12 - 1, dia);
    const diaSemana = data.getDay();
    if (diaSemana === 0) continue;
    else if (diaSemana === 6) total += 0.5;
    else total += 1;
  }

  return total;
}
