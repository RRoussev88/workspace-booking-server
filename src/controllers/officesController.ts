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

  private initRoutes() {
    this.router.use(this.authMiddleware.verifyToken);
    this.router.get('/', this.getAllOffices);
    this.router.get('/org/:orgId', this.getAllOfficesByOrgId);
    this.router.put('/', this.authMiddleware.checkOfficePermissions, this.addOffice);
    this.router.patch('/', this.authMiddleware.checkOfficePermissions, this.updateOffice);
    this.router.get('/:id', this.getOfficeById);
    this.router.delete(
      '/:id/org/:orgId',
      this.getAndForwardSimpleOfficeById,
      this.authMiddleware.checkOfficePermissions,
      this.deleteOffice,
    );
  }

  private getAndForwardSimpleOfficeById(req: Request, _: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.SIMPLE_OFFICES, req.params.id)
      .then((org) => {
        req.body.simpleOffice = org.Item;
        next();
      })
      .catch((error) => {
        next(error);
      });
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
    new DynamoService()
      .addDocument(TableName.SIMPLE_OFFICES, req.body.simpleOffice)
      .then((office) => res.json(office))
      .catch((error) => {
        next(error);
      });
  }

  updateOffice(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .updateDocument(TableName.SIMPLE_OFFICES, req.body.simpleOffice)
      .then((org) => res.json(org))
      .catch((error) => {
        next(error);
      });
  }

  deleteOffice(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .deleteOfficeTransaction(req.params.orgId, req.params.id)
      .then((result) => res.json(result))
      .catch((error) => {
        next(error);
      });
  }
}
