/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const lambdaHandler = async (event, context) => {
    try{
      const body = JSON.parse(event.body || '{}');
      
      if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product data'}) };
      }
      if (typeof body.price !== 'number' || body.price <= 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product data'}) };
      }
      
      const id = crypto.randomUUID();
      const product = {
        PK: 'PRODUCT',           // same for ALL products — this is how you list them
        SK: `PROD#${id}`,         // unique per product — this is how you get one
        id,                       // store the raw id too, handy for responses
        name: body.name,
        price: body.price,
        description: body.description || '',
        createdAt: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: product
      });
      await docClient.send(command);

      return {
        statusCode: 201,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(product)
      }

    }catch(error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  };
  