import cors from 'cors';
import express from 'express';
import authRouter from './router/authRouter.js';
import dashboardRouter from './router/dashboardRouter.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', dashboardRouter);
app.use('/api', authRouter);

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
