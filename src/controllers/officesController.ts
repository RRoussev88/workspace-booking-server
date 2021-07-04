import express, { Request, Response } from 'express';
import AuthMiddleware from '../middlewares/authMiddleware';
import DynamoService from '../services/dynamoService';
import { TableName } from '../types';

export default class OfficesController {
  path = '/offices';
  router = express.Router();
  private authMiddleware;

  constructor() {
    this.authMiddleware = new AuthMiddleware();
    this.initRoutes();
  }
  // TODO: Sort offices by organization
  private initRoutes() {
    this.router.use(this.authMiddleware.verifyToken);
    this.router.get('/', this.getAllOffices);
    this.router.put('/', this.addOffice);
    this.router.get('/:id', this.getOfficeById);
    this.router.delete('/:id', this.deleteOffice);
  }

  getAllOffices(_: Request, res: Response) {
    new DynamoService().getDocuments(TableName.OFFICES).then((offices) => res.json({ offices }));
  }

  getOfficeById(req: Request, res: Response) {
    new DynamoService().getDocumentById(TableName.OFFICES, req.params.id).then((org) => res.json(org));
  }

  addOffice(req: Request, res: Response) {
    new DynamoService().addDocument(TableName.OFFICES, req.body.openOrg).then((org) => res.json(org));
  }

  deleteOffice(req: Request, res: Response) {
    new DynamoService().deleteDocument(TableName.OFFICES, req.params.id).then((org) => res.json(org));
  }
}
