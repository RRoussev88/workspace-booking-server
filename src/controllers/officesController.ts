import express, { Request, Response, NextFunction } from 'express';
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
  // TODO: Validate permissions
  private initRoutes() {
    this.router.use(this.authMiddleware.verifyToken);
    this.router.get('/', this.getAllOffices);
    this.router.get('/org/:orgId', this.getAllOfficesByOrgId);
    this.router.put('/', this.addOffice);
    this.router.get('/:id', this.getOfficeById);
    this.router.delete('/:id', this.deleteOffice);
  }

  getAllOffices(_: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocuments(TableName.SIMPLE_OFFICES)
      .then((offices) => res.json(offices))
      .catch((error) => {
        next(error);
      });
  }

  getAllOfficesByOrgId(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentByProperty(
        TableName.SIMPLE_OFFICES,
        req.query?.propName?.toString() ?? 'organizationId',
        req.params.orgId,
      )
      .then((offices) => res.json(offices))
      .catch((error) => {
        next(error);
      });
  }

  getOfficeById(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.SIMPLE_OFFICES, req.params.id)
      .then((office) => res.json(office))
      .catch((error) => {
        next(error);
      });
  }

  addOffice(req: Request, res: Response, next: NextFunction) {
    console.log('office: ', req.body.simpleOffice);
    new DynamoService()
      .addDocument(TableName.SIMPLE_OFFICES, req.body.simpleOffice)
      .then((office) => {
        console.log('office res: ', office);
        res.json(office);
      })
      .catch((error) => {
        next(error);
      });
  }

  deleteOffice(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .deleteDocument(TableName.SIMPLE_OFFICES, req.params.id)
      .then((office) => res.json(office))
      .catch((error) => {
        next(error);
      });
  }
}
