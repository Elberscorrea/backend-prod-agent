// src/app/services/dashboardService.js
import {
  endOfDay,
  endOfMonth,
  startOfMonth,
} from "date-fns";
import {
  countBusinessDaysInRange,
  formatISODate,
  groupByDateKey,
  isTodayLocal,
} from "../../../utils/dateUtils.js";
import prisma from "../../config/prismaClient.js";

export async function gerarDashboardAgenteV2(executorId) {
  // limites de data
  const hoje      = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimHoje   = endOfDay(hoje);
  const fimMes    = endOfMonth(hoje);

  // 1) Busca de serviços, com try/catch
  let servicos;
  try {
    servicos = await prisma.servicos.findMany({
      where: {
        id_executor: executorId,
        data_execucao: { gte: inicioMes, lte: fimHoje },
        status: { nome: "Produtivo" },
      },
      orderBy: { data_execucao: "asc" },
      include: { modalidade: true },
    });
  } catch (err) {
    console.error("Erro ao buscar serviços:", err);
    throw new Error("Não foi possível carregar dados de produção.");
  }

  // 2) Montagem do dashboard
  return buildDashboard(servicos, hoje, inicioMes, fimMes);
}

function buildDashboard(servicos, hoje, inicioMes, fimMes) {
  // metas
  const metaDia     = 100;
  const diasUteis   = countBusinessDaysInRange(inicioMes, fimMes);
  const metaMensal  = Math.round(metaDia * diasUteis);

  // contagens básicas
  const totais       = servicos.length;
  const producaoDia  = groupByDateKey(servicos, "data_execucao");
  const modalidades  = groupByDateKey(servicos, s => s.modalidade?.nome_modalidade);

  // dias úteis executados
  const diasExecSet = new Set(Object.keys(producaoDia));
  const diasExe     = diasExecSet.size;

  // projeção
  const faltam               = metaMensal - totais;
  const diasRestantes        = countBusinessDaysInRange(hoje, fimMes, diasExecSet);
  const mediaDiariaNecessaria= diasRestantes > 0 
    ? parseFloat((faltam / diasRestantes).toFixed(2))
    : 0;
  const dataPrevista = faltam <= 0 
    ? hoje 
    : estimarDataConclusao(faltam, hoje, fimMes);

  // hoje e última produção
  const qtdHoje        = servicos.filter(s => isTodayLocal(s.data_execucao, hoje)).length;
  const ultimaProdIso  = totais > 0 
    ? formatISODate(servicos[totais - 1].data_execucao) 
    : null;

  return {
    meta_mensal: metaMensal,
    realizados: totais,
    dias_uteis: { total: diasUteis, executados: diasExe },
    ultima_producao: ultimaProdIso,
    hoje: { quantidade: qtdHoje, meta_dia: metaDia },
    projecao: {
      data_prevista: formatISODate(dataPrevista),
      faltam,
      media_diaria_necessaria: mediaDiariaNecessaria
    },
    ranking: { polo: null, posicao: null },
    modalidade: {
      mais_executada: encontrarExtremo(modalidades, "max"),
      menos_executada: encontrarExtremo(modalidades, "min")
    },
    producao_dia:   toSortedArray(producaoDia),
    por_modalidade: toSortedArray(modalidades),
    por_semana:     agruparPorSemana(servicos, inicioMes, fimMes),
    calendario:     gerarCalendario(inicioMes, fimMes, producaoDia, metaDia)
  };
}

function estimarDataConclusao(faltam, hoje, fimMes) {
  let data = new Date(hoje);
  let acumulado = 0;
  while (data <= fimMes && acumulado < faltam) {
    if (!isSunday(data)) {
      acumulado += isSaturday(data) ? 50 : 100;
    }
    data = addDays(data, 1);
  }
  return data;
}

function agruparPorSemana(servicos) {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const semanas = [];
  let inicioSemana = new Date(inicioMes);
  while (inicioSemana <= fimMes) {
    const fimSemana = new Date(
      Math.min(addDays(inicioSemana, 6), fimMes)
    );
    semanas.push({ inicio: new Date(inicioSemana), fim: fimSemana });
    inicioSemana = addDays(fimSemana, 1);
  }

  return semanas.map(({ inicio, fim }) => {
    const chave = `${format(inicio, "dd/MM")} a ${format(fim, "dd/MM")}`;
    const quantidade = servicos.filter(
      (s) => s.data_execucao >= inicio && s.data_execucao <= fim
    ).length;
    return { semana: chave, quantidade };
  });
}

function gerarCalendario(inicioMes, fimMes, producao_dia) {
  const meta_dia = 100;
  const diasMap = producao_dia.reduce((acc, { dia, quantidade }) => {
    acc[dia] = quantidade;
    return acc;
  }, {});

  const todosDias = eachDayOfInterval({
    start: inicioMes,
    end: fimMes
  }).filter((d) => !isSunday(d));

  return todosDias.map((d) => {
    const data = d.toISOString().split("T")[0];
    const quantidade = diasMap[data] || 0;
    return {
      data,
      diaNumero: d.getDate(),
      status: quantidade > 0 ? "executado" : "vazio",
      meta_dia,
      quantidade,
      bateu_meta: quantidade >= meta_dia
    };
  });
}
