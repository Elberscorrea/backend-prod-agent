import cors from 'cors';
import express from 'express';
import authRouter from '../auth/router/authRouter.js';
import dashboardRouterv1 from './router/v1/dashboardRouter.js';
import dashboardV2Router from './router/v2/dashboardRouter.js';



const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', dashboardRouterv1);
app.use('/api', authRouter);
app.use('/api/v2', dashboardV2Router);
app.get("/ping", (req, res) => res.send("pong"));

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
