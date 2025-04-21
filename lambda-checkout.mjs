import Stripe from 'stripe';

const mode = process.env.SYSTEM_MODE;


const SUCCESS_URL = mode == 'PROD' ? process.env.SUCCESS_URL : process.env.TESTING_URL;
const CANCEL_URL = mode == 'PROD' ? process.env.CANCEL_URL : process.env.TESTING_URL;

const stripe = new Stripe(mode == 'PROD' ? process.env.STRIPE_SECRET_PROD_KEY : process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest API version
});

const COURSES = {
    'BID': mode == 'PROD' ? 'price_1R6bg2P8nuWWRch5AEhJKP7a' : 'price_1QlyJ0P8nuWWRch5MkdBiDb2',
    'BDI': mode == 'PROD' ? 'price_1R6bg2P8nuWWRch5AEhJKP7a' : 'price_1QlyJ0P8nuWWRch5MkdBiDb2',
    'TLSAE': mode == 'PROD' ? 'price_1R6bojP8nuWWRch5fKDG6V2w' : 'price_1QlyHrP8nuWWRch5aJXmprLW',
    'IDI': mode == 'PROD' ? 'price_1R6brgP8nuWWRch5PwUqxWPt' : 'price_1QlyJaP8nuWWRch5e8QSjuJh',
    'ADI8': mode == 'PROD' ? 'price_1QlyQeP8nuWWRch5FV8t1CGz' : 'price_1QlyKJP8nuWWRch5oBth9AIk',
    'ADI12': mode == 'PROD' ? 'price_1QlyRCP8nuWWRch5ZpvwjyIY' : 'price_1QlyKqP8nuWWRch5UWUAWf5P',
    'ADI12CO' : mode == 'PROD' ? 'price_1R6cUOP8nuWWRch5OR2cimUc' : 'price_1R6cVGP8nuWWRch5yZtj7ezT',
    
    'BDI-W': mode == 'PROD' ? 'price_1REacdP8nuWWRch5337mk966' : 'price_1REaSbP8nuWWRch5dwYqDzxd',
    'TLSAE-W': mode == 'PROD' ? 'price_1REacUP8nuWWRch5FuVWAXTM' : 'price_1REaV3P8nuWWRch5FSv4YY2o',
    'IDI-W': mode == 'PROD' ? 'price_1REacQP8nuWWRch5c8f9gEjB' : 'price_1REaWJP8nuWWRch5FPOO6KR6',
    'ADI8-W': mode == 'PROD' ? 'price_1REacMP8nuWWRch55OAhWoQT' : 'price_1REaX7P8nuWWRch5XO9HOgQL',
    'ADI12-W': mode == 'PROD' ? 'price_1REacJP8nuWWRch5vmX0P6zc' : 'price_1REaXlP8nuWWRch5G1IJ5KGT',
    
    
    'BDC': mode == 'PROD' ? 'price_1REacHP8nuWWRch5SFuaGmXV' : 'price_1REaYTP8nuWWRch5NuxjycgS',
    'IDC': mode == 'PROD' ? 'price_1REacBP8nuWWRch5ThFZC17E' : 'price_1REaZNP8nuWWRch5ACgqOGUq',
    'ADC': mode == 'PROD' ? 'price_1REac7P8nuWWRch5luoTyi3s' : 'price_1REaZzP8nuWWRch5Sf81owhr',
    'ASDC': mode == 'PROD' ? 'price_1REac5P8nuWWRch51nmTf4Ue' : 'price_1REaaYP8nuWWRch5MyWR2rBV',
    'DCP': mode == 'PROD' ? 'price_1REac2P8nuWWRch5NHYMQ8HO' : 'price_1REabJP8nuWWRch5xRkbfnqV'
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
    const contact_id = event.queryStringParameters && event.queryStringParameters.contactId;

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
            success_url: SUCCESS_URL + "?step=thanks&cid=" + contact_id + "&cancel=true",
            cancel_url: CANCEL_URL + "?step=thanks_cancel&cid=" + contact_id,
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
