import { Router } from "express";
import aiController from "../controllers/ai.controller.js";

const aiRoute = Router();

aiRoute.post('/:id/ask-jerry', aiController.askJerry);


export default aiRoute;
