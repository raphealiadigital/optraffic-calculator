import Stripe from 'stripe';

const mode = process.env.SYSTEM_MODE;

const stripe = new Stripe(mode == 'PROD' ? process.env.STRIPE_SECRET_PROD_KEY : process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest API version
});

const COURSES = {
    'BID': mode == 'PROD' ? 'price_1QlyPWP8nuWWRch58VANnET5' : 'price_1QlyJ0P8nuWWRch5MkdBiDb2',
    'BDI': mode == 'PROD' ? 'price_1QlyPWP8nuWWRch58VANnET5' : 'price_1QlyJ0P8nuWWRch5MkdBiDb2',
    'TLSAE': mode == 'PROD' ? 'price_1QlyO0P8nuWWRch51lgFk8nl' : 'price_1QlyHrP8nuWWRch5aJXmprLW',
    'IDI': mode == 'PROD' ? 'price_1QlyQ3P8nuWWRch5TXLQYL0J' : 'price_1QlyJaP8nuWWRch5e8QSjuJh',
    'ADI8': mode == 'PROD' ? 'price_1QlyQeP8nuWWRch5FV8t1CGz' : 'price_1QlyKJP8nuWWRch5oBth9AIk',
    'ADI12': mode == 'PROD' ? 'price_1QlyRCP8nuWWRch5ZpvwjyIY' : 'price_1QlyKqP8nuWWRch5UWUAWf5P',
    'ADI12CO' : mode == 'PROD' ? 'price_1R6cUOP8nuWWRch5OR2cimUc' : 'price_1R6cVGP8nuWWRch5yZtj7ezT'
};
const MILEAGE_PRICE_ID = mode == 'PROD' ? 'price_1QlyN4P8nuWWRch5OzvaC9e8' : 'price_1QlyLwP8nuWWRch5UejKLzaR';

export const handler = async (event) => {
    const apiKey = event.headers['x-api-key'];
    const responseHeaders = {
        "Access-Control-Allow-Origin": "*", // Or specify your domain
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "*" // Add other methods as needed
      };


      if (event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({ message: 'Preflight request successful' }),
        };
    }

    // Check if the API key matches the expected value (from environment variable)
    if (apiKey != process.env.EXPECTED_API_KEY) {
        console.log(`Invalid API key: ${apiKey}, expected: ${process.env.EXPECTED_API_KEY}, HEADERS:${JSON.stringify(event.headers)}`);
        return {
            statusCode: 403,
            headers: responseHeaders,
            body: JSON.stringify({ message: 'Forbidden: Invalid API key' }),
        };
    }

    // Extract the mileage query parameter
    const mileage = event.queryStringParameters && event.queryStringParameters.mileage;
    const course = event.queryStringParameters && event.queryStringParameters.course;

    if (!mileage) {
        return {
            statusCode: 400,
            headers: responseHeaders,
            body: JSON.stringify({ message: 'Bad Request: Missing mileage query parameter' }),
        };
        mileage = parseInt(mileage) || 0;
    } 
    if (!course || !COURSES[course]) {
        return {
            statusCode: 400,
            headers: responseHeaders,
            body: JSON.stringify({ message: 'Bad Request: Missing or invalid course query parameter' }),
        };
    }

    let lineItems = [
        {
            price: COURSES[course],
            quantity: 1,
        },        
    ];
    if (mileage > 1) {
        lineItems.push({
            price: MILEAGE_PRICE_ID,
            quantity: mileage * 2,
        });
    }

    try {
        // Create Stripe checkout session with the predefined products
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: process.env.SUCCESS_URL,
            cancel_url: process.env.CANCEL_URL,
        });

        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({ checkout_session: checkoutSession }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
