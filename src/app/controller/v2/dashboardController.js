import { gerarDashboardAgenteV2 } from "../../service/v2/dashboardService.js";

export async function getDashboardAgenteV2(req, res) {
  try {
    const executorId = req.usuario.id;
    const resultado = await gerarDashboardAgenteV2(executorId);
    // antes de chamar a service:
    console.log("→ executorId extraído do token:", req.usuario.id);

    res.json(resultado);
  } catch (err) {
    console.error("Erro ao gerar dashboard:", err);
    res.status(500).json({ erro: "Erro ao gerar dados do dashboard" });
  }
}
