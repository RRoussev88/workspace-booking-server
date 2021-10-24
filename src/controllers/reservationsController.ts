import express, { Request, Response, NextFunction } from 'express';
import AuthMiddleware from '../middlewares/authMiddleware';
import DynamoService from '../services/dynamoService';
import { TableName } from '../types';

export default class ReservationsController {
  path = '/reservations';
  router = express.Router();
  private authMiddleware;

  constructor() {
    this.authMiddleware = new AuthMiddleware();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(this.authMiddleware.verifyToken);
    this.router.get('/', this.getAllReservations);
    this.router.get('/office/:officeId', this.getAllReservationsByOfficeId);
    this.router.put(
      '/',
      this.getAndForwardSimpleOfficeById,
      this.authMiddleware.checkOfficePermissions,
      this.addReservation,
    );
    this.router.patch('/', this.authMiddleware.checkOfficePermissions, this.updateReservation);
    this.router.get('/:id', this.getReservationById);
    this.router.delete(
      '/:id',
      this.getAndForwardReservationById,
      this.getAndForwardSimpleOfficeById,
      this.authMiddleware.checkOfficePermissions,
      this.deleteReservation,
    );
  }

  private getAndForwardReservationById(req: Request, _: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.RESERVATIONS, req.params.id)
      .then((reservation) => {
        req.body.reservation = reservation.Item;
        next();
      })
      .catch((error) => {
        next(error);
      });
  }

  private getAndForwardSimpleOfficeById(req: Request, _: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.SIMPLE_OFFICES, req.body.reservation.officeId)
      .then((office) => {
        req.body.simpleOffice = office.Item;
        next();
      })
      .catch((error) => {
        next(error);
      });
  }

  getAllReservations(_: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocuments(TableName.RESERVATIONS)
      .then((reservations) => res.json(reservations))
      .catch((error) => {
        next(error);
      });
  }

  getAllReservationsByOfficeId(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentByProperty(
        TableName.RESERVATIONS,
        req.query?.propName?.toString() ?? 'officeId',
        req.params.officeId,
      )
      .then((reservations) => res.json(reservations))
      .catch((error) => {
        next(error);
      });
  }

  getReservationById(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .getDocumentById(TableName.RESERVATIONS, req.params.id)
      .then((reservation) => res.json(reservation))
      .catch((error) => {
        next(error);
      });
  }

  addReservation(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .createReservationTransaction(req.body.reservation)
      .then((reservation) => res.json(reservation))
      .catch((error) => {
        next(error);
      });
  }

  updateReservation(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .updateDocument(TableName.RESERVATIONS, req.body.reservation)
      .then((reservation) => res.json(reservation))
      .catch((error) => {
        next(error);
      });
  }

  deleteReservation(req: Request, res: Response, next: NextFunction) {
    new DynamoService()
      .deleteReservationTransaction(req.body.simpleOffice?.id, req.params.id)
      .then((result) => res.json(result))
      .catch((error) => {
        next(error);
      });
  }
}
