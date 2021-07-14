import express, { Request, Response, NextFunction } from 'express';
import AuthMiddleware from '../middlewares/authMiddleware';
import DynamoService from '../services/dynamoService';
import { TableName } from '../types';

export default class OpenOrgsController {
  path = '/organizations';
  router = express.Router();
  private authMiddleware;

  constructor() {
    this.authMiddleware = new AuthMiddleware();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(this.authMiddleware.verifyToken);
    this.router.get('/', this.getAllOpenOrgs);
    this.router.put('/', this.addOpenOrg);
    this.router.get('/:id', this.getOpenOrgById);
    this.router.delete('/:id', this.deleteOpenOrg);
  }

  getAllOpenOrgs(_: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocuments(TableName.COWORKING_SPACES)
      .then((orgs) => res.json(orgs))
      .catch((error) => {
        next(error);
      });
  }

  getOpenOrgById(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.COWORKING_SPACES, req.params.id)
      .then((org) => res.json(org))
      .catch((error) => {
        next(error);
      });
  }

  addOpenOrg(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .addDocument(TableName.COWORKING_SPACES, req.body.openOrg)
      .then((org) => res.json(org))
      .catch((error) => {
        console.log('catched:', error);
        next(error);
      });
  }

  deleteOpenOrg(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .deleteDocument(TableName.COWORKING_SPACES, req.params.id)
      .then((org) => res.json(org))
      .catch((error) => {
        next(error);
      });
  }
}
