import express, { Request, Response } from 'express';
import DynamoService from '../services/dynamoService';
import { TableName } from '../types';

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
      .getDocuments(TableName.OFFICES)
      .then((offices) => {
        res.json({ offices });
      })
      .catch((err) => console.log('Get offices error: ', err));
  }
}
