import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';
import { Organization } from 'types';

const ERROR_MESSAGE = 'Unauthorized credentials';

const pems = {};

export default class AuthMiddleware {
  constructor() {
    this.setup();
  }

  verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization')?.split(' ')?.[1];
    if (!token) res.status(401).end(ERROR_MESSAGE);

    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) res.status(401).end(ERROR_MESSAGE);
 
    const kid = decodedJwt.header.kid;
    if (!pems[kid]) res.status(401).end(ERROR_MESSAGE);

    const expirationTime = decodedJwt.payload.exp;
    if (expirationTime * 1000 < new Date().valueOf()) res.status(401).end(ERROR_MESSAGE);

    jwt.verify(token, pems[kid], (err) => {
      if (err) res.status(401).end(ERROR_MESSAGE);
      next();
    });
  }

  checkOrgPermissions(
    req: Request<{}, { Attributes: Organization } | string, { openOrg: Organization }>,
    res: Response<{ Attributes: Organization } | string>,
    next: NextFunction,
  ) {
    const token = req.header('Authorization')?.split(' ')?.[1];
    if (!token) res.status(401).end(ERROR_MESSAGE);

    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) res.status(401).end(ERROR_MESSAGE);

    const username = decodedJwt.payload?.username;
    const orgContacts = req.body.openOrg?.contact;
    if (!!username && !!orgContacts && orgContacts.toString().includes(username)) {
      next();
    } else {
      res.status(401).send('Unauthorized organization change');
    }
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
}
