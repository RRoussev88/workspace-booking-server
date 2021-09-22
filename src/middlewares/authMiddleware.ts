import { NextFunction, Request, Response } from 'express';
import { decode, verify } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';
import { Office, Organization } from 'types';

const ERROR_MESSAGE = 'Unauthorized credentials';

const pems = {};

export default class AuthMiddleware {
  constructor() {
    this.setup();
  }

  private async setup() {
    const url = `https://cognito-idp.${process.env.POOL_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`;

    try {
      const response = await fetch(url);
      if (response.status !== 200) {
        throw 'Request not successful';
      }

      const data = await response.json();
      data.keys.forEach((key) => {
        pems[key.kid] = jwkToPem({ kty: key.kty, n: key.n, e: key.e });
      });
    } catch (error) {
      throw error;
    }
  }

  verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization')?.split(' ')?.[1];
    if (!token) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const decodedJwt = decode(token, { complete: true });
    if (!decodedJwt) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const kid = decodedJwt.header.kid;
    if (!pems[kid]) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const expirationTime = decodedJwt.payload.exp;
    if (expirationTime * 1000 < new Date().valueOf()) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    verify(token, pems[kid], (err) => {
      if (err) {
        res.status(401).end(ERROR_MESSAGE);
        return;
      }
      next();
    });
  }

  checkOrgPermissions(
    req: Request<{}, { Attributes: Organization } | string, { openOrg: Organization }>,
    res: Response<{ Attributes: Organization } | string>,
    next: NextFunction,
  ) {
    const token = req.header('Authorization')?.split(' ')?.[1];
    if (!token) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const decodedJwt = decode(token, { complete: true });
    if (!decodedJwt) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const username = decodedJwt.payload?.username;
    const orgContacts = req.body.openOrg?.contact;
    if (!!username && !!orgContacts && orgContacts.toString().includes(username)) {
      next();
    } else {
      res.status(401).send('Unauthorized organization change');
    }
  }

  checkOfficePermissions(
    req: Request<{}, { Attributes: Office } | string, { simpleOffice: Office }>,
    res: Response<{ Attributes: Office } | string>,
    next: NextFunction,
  ) {
    const token = req.header('Authorization')?.split(' ')?.[1];
    if (!token) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const decodedJwt = decode(token, { complete: true });
    if (!decodedJwt) {
      res.status(401).end(ERROR_MESSAGE);
      return;
    }

    const username = decodedJwt.payload?.username;
    const officeContacts = req.body.simpleOffice?.contact;
    if (!!username && !!officeContacts && officeContacts.toString().includes(username)) {
      next();
    } else {
      res.status(401).send('Unauthorized office change');
    }
  }
}
