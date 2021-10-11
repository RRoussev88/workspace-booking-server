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
    this.router.put(
      '/',
      this.getAndForwardOpenOrgById,
      this.authMiddleware.checkOrgPermissions,
      this.addOffice,
    );
    this.router.patch('/', this.authMiddleware.checkOfficePermissions, this.updateOffice);
    this.router.get('/:id', this.getOfficeById);
    this.router.delete(
      '/:id',
      this.getAndForwardSimpleOfficeById,
      this.authMiddleware.checkOfficePermissions,
      this.deleteOffice,
    );
  }

  private getAndForwardSimpleOfficeById(req: Request, _: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.SIMPLE_OFFICES, req.params.id)
      .then((office) => {
        req.body.simpleOffice = office.Item;
        next();
      })
      .catch((error) => {
        next(error);
      });
  }

  private getAndForwardOpenOrgById(req: Request, _: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.COWORKING_SPACES, req.body.simpleOffice.organizationId)
      .then((org) => {
        req.body.openOrg = org.Item;
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
      .createOfficeTransaction(req.body.simpleOffice)
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
      .deleteOfficeTransaction(req.body.simpleOffice?.organizationId, req.params.id)
      .then((result) => res.json(result))
      .catch((error) => {
        next(error);
      });
  }
}
