import { buscarProdutividadeDoMesAtual } from '../service/dashboardService.js';

export async function getDashboardExecutor(req, res) {
  try {
    const { id } = req.usuario;
    const dados = await buscarProdutividadeDoMesAtual(id);
    res.json(dados);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
