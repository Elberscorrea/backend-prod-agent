import {
  addDays,
  eachDayOfInterval,
  endOfDay, // <-- novo
  endOfMonth,
  format,
  isSameDay, // <-- novo
  isSaturday,
  isSunday,
  startOfMonth
} from "date-fns";
import prisma from "../../config/prismaClient.js";

export async function gerarDashboardAgenteV2(executorId, ano, mes) {
  // Se não vier ano/mes, usa o mês atual
  const hoje = new Date();
  const anoFiltro = ano || hoje.getFullYear();
  const mesFiltro = mes ? mes - 1 : hoje.getMonth(); // mês no JS começa em 0

  const inicioMes = startOfMonth(new Date(anoFiltro, mesFiltro, 1));
  const fimHoje =
    ano && mes
      ? endOfMonth(inicioMes) // Se o usuário escolheu um mês, pega o mês todo
      : endOfDay(hoje); // Se for mês atual, vai só até hoje
  const fimMes = endOfMonth(inicioMes);

  // Dias úteis totais do mês
  let diasUteisTotal = 0;
  for (let d = new Date(inicioMes); d <= fimMes; d.setDate(d.getDate() + 1)) {
    if (isSunday(d)) continue;
    diasUteisTotal += isSaturday(d) ? 0.5 : 1;
  }

  const meta_dia = 100;
  const meta_mensal = Math.round(meta_dia * diasUteisTotal);

  const servicos = await prisma.servicos.findMany({
    where: {
      id_executor: executorId,
      data_execucao: {
        gte: inicioMes,
        lte: fimHoje
      },
      status: {
        is: {
          nome: {
            equals: "Produtivo",
            mode: "insensitive"
          }
        }
      }
    },
    orderBy: { data_execucao: "asc" },
    include: { modalidade: true }
  });

  const realizados = servicos.length;
  const producao_dia = agruparPorDia(servicos);
  const por_modalidade = agruparPorModalidade(servicos);

  const diasExecutadosSet = new Set(producao_dia.map((p) => p.dia));
  const diasUteisExecutados = diasExecutadosSet.size;

  let diasUteisRestantes = 0;
  for (let d = new Date(hoje); d <= fimMes; d.setDate(d.getDate() + 1)) {
    if (isSunday(d)) continue;
    const diaKey = d.toISOString().split("T")[0];
    if (!diasExecutadosSet.has(diaKey)) {
      diasUteisRestantes += isSaturday(d) ? 0.5 : 1;
    }
  }

  const faltam = meta_mensal - realizados;
  const media_diaria_necessaria =
    diasUteisRestantes > 0
      ? parseFloat((faltam / diasUteisRestantes).toFixed(2))
      : 0;

  const data_prevista =
    faltam <= 0 ? hoje : estimarDataConclusao(faltam, hoje, fimMes);

  const quantidadeHoje = servicos.filter((s) =>
    isSameDay(s.data_execucao, hoje)
  ).length;

  const ultima_producao =
    servicos.length > 0
      ? format(servicos[servicos.length - 1].data_execucao, "yyyy-MM-dd")
      : null;

  return {
    mes_referencia: format(inicioMes, "MM/yyyy"), // <-- mostra qual mês está sendo usado
    meta_mensal,
    realizados,
    dias_uteis: {
      total: diasUteisTotal,
      executados: diasUteisExecutados
    },
    ultima_producao,
    hoje: {
      quantidade: quantidadeHoje,
      meta_dia
    },
    projecao: {
      data_prevista: data_prevista.toISOString().split("T")[0],
      faltam,
      media_diaria_necessaria
    },
    ranking: { polo: null, posicao: null },
    modalidade: {
      mais_executada: encontrarMaisModalidade(por_modalidade),
      menos_executada: encontrarMenosModalidade(por_modalidade)
    },
    producao_dia,
    por_modalidade,
    por_semana: agruparPorSemana(servicos, inicioMes, fimMes),
    calendario: gerarCalendario(inicioMes, fimMes, producao_dia)
  };
}

function agruparPorDia(servicos) {
  const mapa = servicos.reduce((acc, s) => {
    const dia = s.data_execucao.toISOString().split("T")[0];
    acc[dia] = (acc[dia] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(mapa)
    .map(([dia, quantidade]) => ({ dia, quantidade }))
    .sort((a, b) => a.dia.localeCompare(b.dia));
}

function agruparPorModalidade(servicos) {
  const modalidades = {};
  for (const s of servicos) {
    const nome = s.modalidade?.nome_modalidade || "Desconhecido";
    modalidades[nome] = (modalidades[nome] || 0) + 1;
  }
  return Object.entries(modalidades).map(([nome, quantidade]) => ({
    nome,
    quantidade
  }));
}

function encontrarMaisModalidade(modalidades) {
  return modalidades.reduce(
    (a, b) => (a.quantidade > b.quantidade ? a : b),
    { nome: null, quantidade: 0 }
  );
}

function encontrarMenosModalidade(modalidades) {
  return modalidades.reduce(
    (a, b) => (a.quantidade < b.quantidade ? a : b),
    { nome: null, quantidade: Infinity }
  );
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
