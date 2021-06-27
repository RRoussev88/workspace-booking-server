import express, { Request, Response } from 'express';
import DynamoService from '../services/dynamoService';

export default class OfficesController {
  path = '/offices';
  router = express.Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get('/', this.getOffices);
  }

  getOffices(req: Request, res: Response) {
    new DynamoService()
      .getOffices()
      .then((offices) => {
        res.json({ offices });
      })
      .catch((err) => console.log('Offices Service get offices error: ', err));
  }
}
