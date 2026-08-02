import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;


export const lambdaHandler = async (event) => {
    try{

        const id = event.pathParameters.id

        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key:{
                PK: 'PRODUCT',
                SK: `PROD#${id}`
            }
        })

        await docClient.send(command);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({message: 'Product deleted'})
        }
    }catch(error){
        console.error(error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}