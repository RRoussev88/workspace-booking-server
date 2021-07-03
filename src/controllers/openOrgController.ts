import express, { Request, Response } from 'express';
import { AWSError } from 'aws-sdk';
import DynamoService from '../services/dynamoService';
import { TableName } from '../types';

export default class OpenOrgsController {
  path = '/organizations';
  router = express.Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get('/', this.getOpenOrgs);
    this.router.get('/:id', this.getOpenOrgById);
    this.router.put('/add', this.addOpenOrg);
    this.router.delete('/del/:id', this.deleteOpenOrg);
  }

  getOpenOrgs(req: Request, res: Response) {
    new DynamoService()
      .getDocuments(TableName.COWORKING_SPACES)
      .then((orgs) => res.json(orgs))
      .catch((error: AWSError) => res.status(error.statusCode).json({ error }));
  }

  getOpenOrgById(req: Request, res: Response) {
    new DynamoService()
      .getDocumentById(TableName.COWORKING_SPACES, req.params.id)
      .then((org) => res.json(org))
      .catch((error: AWSError) => res.status(error.statusCode).json({ error }));
  }

  addOpenOrg(req: Request, res: Response) {
    new DynamoService()
      .addDocument(TableName.COWORKING_SPACES, req.body.openOrg)
      .then((org) => res.json(org))
      .catch((error: AWSError) => res.status(error.statusCode).json({ error }));
  }

  deleteOpenOrg(req: Request, res: Response) {
    new DynamoService()
      .deleteDocument(TableName.COWORKING_SPACES, req.params.id)
      .then((org) => res.json(org))
      .catch((error: AWSError) => res.status(error.statusCode).json({ error }));
  }
}
