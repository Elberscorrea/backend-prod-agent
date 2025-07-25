import { buscarDadosExecutorPorId } from '../service/dashboardService.js';

export async function getDashboardExecutor(req, res) {
    try {
        const { id } = req.usuario; // vem do token JWT
        const dados = await buscarDadosExecutorPorId(id);
        res.json(dados);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
