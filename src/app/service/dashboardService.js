import prisma from '../config/prismaClient.js';

const TZ = 'America/Santarem';

function getDiasUteisDoMes(ano, mes1a12) {
  const dias = new Date(ano, mes1a12, 0).getDate(); // mes1a12 já é 1..12
  let total = 0;

  for (let dia = 1; dia <= dias; dia++) {
    const data = new Date(ano, mes1a12 - 1, dia); // aqui volta p/ 0..11
    const diaSemana = data.getDay();
    if (diaSemana === 0) continue;        // domingo
    else if (diaSemana === 6) total += 0.5; // sábado
    else total += 1;                      // seg-sex
  }

  return total;
}

function toLocalDateParts(dateLike) {
  const dateString = typeof dateLike === 'string'
    ? dateLike.split('T')[0]
    : dateLike?.toISOString().split('T')[0];

  const [yearStr, monthStr, dayStr] = dateString.split('-');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1..12
  const day = parseInt(dayStr, 10);

  const ymd = `${yearStr}-${monthStr}-${dayStr}`; // já vem formatado

  return { year, month, day, ymd };
}


export async function buscarDadosExecutorPorId(id_executor) {
  const executor = await prisma.executor.findUnique({
    where: { id: id_executor },
  });

  if (!executor) throw new Error('Executor não encontrado');

  const statusProdutivo = await prisma.status.findFirst({
    where: { nome: 'Produtivo' }
  });

  if (!statusProdutivo) throw new Error('Status "Produtivo" não encontrado');

  const servicos = await prisma.servicos.findMany({
    where: {
      id_executor,
      id_status: statusProdutivo.id,
      data_execucao: { not: null },
    },
  });

  const agrupadoPorMes = {};

  for (const s of servicos) {
    const { year, month, ymd } = toLocalDateParts(s.data_execucao); // <-- usa fuso correto
    const chaveMes = month.toString().padStart(2, '0'); // "06", "07", ...

    if (!agrupadoPorMes[chaveMes]) {
      const diasUteis = getDiasUteisDoMes(year, month);
      const meta = 100 * diasUteis;

      agrupadoPorMes[chaveMes] = {
        total: 0,
        meta,
        progresso: 0,
        faltam: 0,
        media_diaria: 0,
        servicos_por_dia: {}
      };
    }

    agrupadoPorMes[chaveMes].total += 1;
    agrupadoPorMes[chaveMes].servicos_por_dia[ymd] =
      (agrupadoPorMes[chaveMes].servicos_por_dia[ymd] || 0) + 1;
  }

  // Pós-processamento
  for (const mes of Object.keys(agrupadoPorMes)) {
    const info = agrupadoPorMes[mes];
    const diasUteis = info.meta / 100;

    info.media_diaria = parseFloat((info.total / diasUteis).toFixed(1));
    info.progresso = parseFloat(((info.total / info.meta) * 100).toFixed(1));
    info.faltam = Math.max(0, info.meta - info.total);

    // Ordena os dias dentro do mês
    const ordenado = Object.entries(info.servicos_por_dia)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]));
    info.servicos_por_dia = Object.fromEntries(ordenado);
  }

  // (opcional) Ordenar os meses "06", "07", ... ao retornar
  const por_mes_ordenado = Object.fromEntries(
    Object.entries(agrupadoPorMes).sort(([a], [b]) => Number(a) - Number(b))
  );

  return {
    executor: {
      id: executor.id,
      nome: executor.nome,
      matricula: executor.matricula,
    },
    por_mes: por_mes_ordenado,
  };
}
