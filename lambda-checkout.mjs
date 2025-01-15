const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const COURSES = {
    'BDI': 'price_1QhUg4E0YfZwZgx7RJR2akhc',
    'TLSAE': 'price_1QhUgSE0YfZwZgx7Rk6vjjOh',
    'IDI': 'price_1QhUgjE0YfZwZgx7CZJHgQDu',
    'ADI8': 'price_1QhUh3E0YfZwZgx7UFWjETDo',
    'ADI12': 'price_1QhUhCE0YfZwZgx7AtTRMPbv'
};
const MILEAGE_PRICE_ID = 'price_1QhUhfE0YfZwZgx7Pcd4L3Xt';

exports.handler = async (event) => {
    const apiKey = event.headers['X-API-KEY'];

    // Check if the API key matches the expected value (from environment variable)
    if (apiKey !== process.env.EXPECTED_API_KEY) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Forbidden: Invalid API key' }),
        };
    }

    // Extract the mileage query parameter
    const mileage = event.queryStringParameters && event.queryStringParameters.mileage;
    const course = event.queryStringParameters && event.queryStringParameters.course;

    if (!mileage) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Bad Request: Missing mileage query parameter' }),
        };
    }
    if (!course || !COURSES[course]) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Bad Request: Missing or invalid course query parameter' }),
        };
    }

    try {
        // Create Stripe checkout session with the predefined products
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: COURSES[course],
                    quantity: 1,
                },
                {
                    price: MILEAGE_PRICE_ID,
                    quantity: mileage,
                },
            ],
            mode: 'payment',
            success_url: process.env.SUCCESS_URL,
            cancel_url: process.env.CANCEL_URL,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ checkout_session_id: checkoutSession.id }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


/* form submission


{"3OWdg0MDmFaAgNyHSpzU":"fsfdsfdf","n9KocCA9h0LAb9n29odD":"6-hour Basic Driving Course in 3 sessions","first_name":"fsf","last_name":"fsdfds","phone":"+16154774125","terms_and_conditions":"I agree to receive text messages and emails from Orange Park Driving and Traffic School about promotions, updates, and reminders. Message and data rates may apply. Reply \"STOP\" to unsubscribe.","email":"test@tehgol.com","date_of_birth":"01-02-2025","address":"123 Main Street, White Plains, NY, USA","city":"White Plains","state":"New York","country":"US","postal_code":"10601","formId":"np3PjNXdpnjjxfSdtQDY","location_id":"rAqA0qePdg5HU5psHFZX","eventData":{"source":"direct","referrer":"","keyword":"","adSource":"","url_params":{},"page":{"url":"https://app.reachmepro.com/v2/preview/UXxaHP4Suwhd5VBbDmfb","title":""},"timestamp":1736944602291,"campaign":"","contactSessionIds":{"ids":["1b05073f-c486-41e4-bcf8-9021d6e37f2f"]},"fbp":"","fbc":"","type":"page-visit","parentId":"UXxaHP4Suwhd5VBbDmfb","pageVisitType":"funnel","domain":"app.reachmepro.com","version":"v3","parentName":"","fingerprint":null,"documentURL":"https://app.reachmepro.com/v2/preview/UXxaHP4Suwhd5VBbDmfb","gaClientId":"GA1.2.2009418773.1730870192","fbEventId":"b5d2342f-d9c4-4cad-a194-891e6958613b","medium":"form","mediumId":"np3PjNXdpnjjxfSdtQDY"},"funneEventData":{"event_type":"optin","domain_name":"app.reachmepro.com","page_url":"/v2/preview/UXxaHP4Suwhd5VBbDmfb","funnel_id":"yqo14UtT8QGeBARNMVc2","page_id":"UXxaHP4Suwhd5VBbDmfb","funnel_step_id":"e5f22616-2f7d-4ff4-a025-4191d81bfe01"},"Timezone":"America/New_York (GMT-05:00)","paymentContactId":{}}
*/