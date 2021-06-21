import express, { Request, Response } from 'express';
import AuthMiddleware from '../middlewares/authMiddleware';

export default class HomeController {
  public path = '/protected';
  public router = express.Router();
  private authMiddleware;

  constructor() {
    this.authMiddleware = new AuthMiddleware();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(this.authMiddleware.verifyToken);
    this.router.get('/secret', this.home);
  }

  home(req: Request, res: Response) {
    res.send('the secret is secret');
  }
}
