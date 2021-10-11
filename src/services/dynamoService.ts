import { AWSError, config, DynamoDB } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Office, Organization, Reservation, TableName } from '../types';

export default class DynamoService {
  dynamoClient: DynamoDB.DocumentClient;

  constructor() {
    this.dbSetup();
  }

  private dbSetup() {
    config.update({
      region: process.env.POOL_REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    });

    this.dynamoClient = new DynamoDB.DocumentClient();
  }

  getDocuments = async (TableName: TableName) => await this.dynamoClient.scan({ TableName }).promise();

  getDocumentById = async (TableName: TableName, documentId: string) =>
    await this.dynamoClient.get({ TableName, Key: { id: documentId } }).promise();

  getDocumentByProperty = async (TableName: TableName, propName: string, propValue: string) =>
    await this.dynamoClient
      .query({
        TableName,
        IndexName: propName,
        KeyConditionExpression: '#propName = :propValue',
        ExpressionAttributeNames: { '#propName': propName },
        ExpressionAttributeValues: { ':propValue': propValue },
      })
      .promise();

  addDocument = async (TableName: TableName, document: DynamoDB.DocumentClient.PutItemInputAttributeMap) =>
    await this.dynamoClient.put({ TableName, Item: document }).promise();

  updateDocument = async (TableName: TableName, document: any) =>
    await this.dynamoClient
      .update({
        TableName,
        Key: { id: document.id },
        UpdateExpression: Object.keys(document).reduce(
          (acc, key, index, array) =>
            key === 'id' ? acc : `${acc} #${key} = :${key}${index === array.length - 1 ? '' : ','}`,
          'set',
        ),
        ExpressionAttributeNames: Object.keys(document).reduce(
          (acc, key) => (key === 'id' ? acc : { ...acc, [`#${key}`]: key }),
          {},
        ),
        ExpressionAttributeValues: Object.keys(document).reduce(
          (acc, key) => (key === 'id' ? acc : { ...acc, [`:${key}`]: document[key] }),
          {},
        ),
        ReturnValues: 'ALL_NEW',
      })
      .promise();

  deleteDocument = async (TableName: TableName, documentId: string) =>
    await this.dynamoClient.delete({ TableName, Key: { id: documentId } }).promise();

  async createOfficeTransaction(newOffice: Office) {
    const response: DynamoDB.DocumentClient.GetItemOutput = await this.getDocumentById(
      TableName.COWORKING_SPACES,
      newOffice.organizationId,
    );
    const { offices } = response.Item as Organization;

    if (!offices) return;

    return await this.dynamoClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: TableName.COWORKING_SPACES,
              Key: { id: newOffice.organizationId },
              UpdateExpression: 'SET #offices = list_append(#offices, :newOfficeIds)',
              ConditionExpression: `NOT contains(#offices, :newOfficeId)`,
              ExpressionAttributeNames: { '#offices': 'offices' },
              ExpressionAttributeValues: { ':newOfficeIds': [newOffice.id], ':newOfficeId': newOffice.id },
            },
          },
          { Put: { TableName: TableName.SIMPLE_OFFICES, Item: newOffice } },
        ],
      })
      .promise();
  }

  async createReservationTransaction(reservation: Reservation) {
    const response: DynamoDB.DocumentClient.GetItemOutput = await this.getDocumentById(
      TableName.SIMPLE_OFFICES,
      reservation.officeId,
    );

    const { id, occupied } = response.Item as Office;

    if (!id) return;

    return await this.dynamoClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: TableName.SIMPLE_OFFICES,
              Key: { id },
              UpdateExpression: 'SET #occupied = :occupied + 1',
              ConditionExpression: `#capacity > :occupied`,
              ExpressionAttributeNames: { '#occupied': 'occupied', '#capacity': 'capacity' },
              ExpressionAttributeValues: { ':occupied': occupied },
            },
          },
          { Put: { TableName: TableName.RESERVATIONS, Item: reservation } },
        ],
      })
      .promise();
  }

  async deleteReservationTransaction(officeId: string, reservationId: string) {
    const response: DynamoDB.DocumentClient.GetItemOutput = await this.getDocumentById(
      TableName.SIMPLE_OFFICES,
      officeId,
    );

    const { id, occupied } = response.Item as Office;

    if (!id) return;

    return await this.dynamoClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: TableName.SIMPLE_OFFICES,
              Key: { id },
              UpdateExpression: 'SET #occupied = :occupied - 1',
              ConditionExpression: `#occupied > 0`,
              ExpressionAttributeNames: { '#occupied': 'occupied' },
              ExpressionAttributeValues: { ':occupied': occupied },
            },
          },
          { Delete: { TableName: TableName.RESERVATIONS, Key: { id: reservationId } } },
        ],
      })
      .promise();
  }

  async deleteOfficeTransaction(orgId: string, officeId: string) {
    const orgResponse: DynamoDB.DocumentClient.GetItemOutput = await this.getDocumentById(
      TableName.COWORKING_SPACES,
      orgId,
    );
    const { offices } = orgResponse.Item as Organization;

    if (!offices) return;

    const reservationsResponse: DynamoDB.DocumentClient.QueryOutput = await this.getDocumentByProperty(
      TableName.RESERVATIONS,
      'officeId',
      officeId,
    );

    const reservations = reservationsResponse.Items as Reservation[];

    if (!reservations) return;

    const indexToRemove = offices.findIndex((id) => id === officeId);
    return await this.dynamoClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: TableName.COWORKING_SPACES,
              Key: { id: orgId },
              UpdateExpression: `REMOVE offices[${indexToRemove}]`,
              ConditionExpression: `offices[${indexToRemove}] = :idToRemove`,
              ExpressionAttributeValues: { ':idToRemove': officeId },
            },
          },
          { Delete: { TableName: TableName.SIMPLE_OFFICES, Key: { id: officeId } } },
          ...reservations.map((reservation) => ({
            Delete: { TableName: TableName.RESERVATIONS, Key: { id: reservation.id } },
          })),
        ],
      })
      .promise();
  }

  async deleteOrganizationTransaction(orgId: string) {
    const response: DynamoDB.DocumentClient.GetItemOutput = await this.getDocumentById(
      TableName.COWORKING_SPACES,
      orgId,
    );
    const { offices } = response.Item as Organization;

    const reservationsResponse: DynamoDB.DocumentClient.QueryOutput[] = (await Promise.all(
      offices.map((officeId) => this.getDocumentByProperty(TableName.RESERVATIONS, 'officeId', officeId)),
    )) as PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>[];

    const reservations: Reservation[] = reservationsResponse.reduce(
      (acc, current) => [...acc, ...current.Items],
      [],
    );

    return await this.dynamoClient
      .transactWrite({
        TransactItems: [
          ...reservations.map((reservation) => ({
            Delete: { TableName: TableName.RESERVATIONS, Key: { id: reservation.id } },
          })),
          ...offices.map((officeId) => ({
            Delete: { TableName: TableName.SIMPLE_OFFICES, Key: { id: officeId } },
          })),
          { Delete: { TableName: TableName.COWORKING_SPACES, Key: { id: orgId } } },
        ],
      })
      .promise();
  }
}
