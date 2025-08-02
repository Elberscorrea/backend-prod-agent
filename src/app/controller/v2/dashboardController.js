import { gerarDashboardAgenteV2 } from "../../service/v2/dashboardService.js";

export async function getDashboardAgenteV2(req, res) {
  try {
    const executorId = req.usuario.id;

    // Pega ano e mês da query (se não vier, deixa null para usar padrão)
    const ano = req.query.ano ? parseInt(req.query.ano, 10) : null;
    const mes = req.query.mes ? parseInt(req.query.mes, 10) : null;


    const resultado = await gerarDashboardAgenteV2(executorId, ano, mes);

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao gerar dados do dashboard" });
  }
}
