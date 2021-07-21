import { config, DynamoDB } from 'aws-sdk';
import { TableName } from 'types';

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
}
