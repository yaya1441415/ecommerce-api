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
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;


export const lambdaHandler = async (event, context) => {
    try{
        const id = event.pathParameters.id
        const body = JSON.parse(event.body || '{}')
        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Valid name is required' })
            };
        }
        if (typeof body.price !== 'number' || body.price <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Price must be a positive number' })
            };
        }

        const command = new UpdateCommand({
            TableName : TABLE_NAME,
            Key: {
                PK: 'PRODUCT',
                SK: `PROD#${id}`
            },
            UpdateExpression: 'SET #name = :name, price = :price, description = :description, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#name':'name'
            },
            ExpressionAttributeValues: {
                ':name': body.name,
                ':price': body.price,
                ':description': body.description || '',
                ':updatedAt': new Date().toISOString()
            },
            ConditionExpression: 'attribute_exists(PK)',
            ReturnValues: 'ALL_NEW'
        });

        const result = await docClient.send(command)

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.Attributes)
        }
    }catch(error){
        if(error.name === 'ConditionalCheckFailedException'){
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Product not found' })
            };
        }

        console.error(error)
        return {
            statusCode: 500,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({error: 'Internal server error'})
        }

    }
}