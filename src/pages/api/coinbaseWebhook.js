import Cors from 'cors';
import axios from 'axios';
import { query } from '../../lib/db.js';

// Initialize the cors middleware
const cors = Cors({
  methods: ['POST'],
  origin: '*', // Adjust this to the specific origin if needed
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function webhook(req, res) {
  await runMiddleware(req, res, cors);

  const event = req.body.event;
  console.log('Received event:', JSON.stringify(event));

  if (event && event.type === 'charge:pending') {
    let { order_id } = event.data.metadata;

    // Ensure order_id is a string and remove decimal and trailing zero if present
    order_id = order_id.toString().replace(/\.0+$/, '');
    console.log('Processing order_id:', order_id);

    try {
      const orderResult = await query(
        `SELECT o.*, c.email FROM orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE o.order_id = $1`,
        [order_id]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];
      const shippingInfo = order.shipping_info;
      const cartItems = order.cart_items;

      console.log('Order:', JSON.stringify(order, null, 2));
      console.log('Shipping Info:', JSON.stringify(shippingInfo, null, 2));
      console.log('Cart Items:', JSON.stringify(cartItems, null, 2));

      const shopifyOrder = {
        order: {
          line_items: cartItems.map(item => ({
            variant_id: item.variantId.replace('gid://shopify/ProductVariant/', ''), // Strip out the 'gid://shopify/ProductVariant/' part
            quantity: 1, // Assuming quantity is 1, adjust as needed
            title: item.title,
            price: item.price,
          })),
          customer: {
            first_name: shippingInfo.name.split(' ')[0],
            last_name: shippingInfo.name.split(' ').slice(1).join(' '),
            email: shippingInfo.email,
          },
          shipping_address: {
            first_name: shippingInfo.name.split(' ')[0],
            last_name: shippingInfo.name.split(' ').slice(1).join(' '),
            address1: shippingInfo.address,
            city: shippingInfo.city,
            province: shippingInfo.state,
            zip: shippingInfo.postalCode,
            country_code: shippingInfo.country // Use the country code from shipping info
          },
          financial_status: 'paid',
        },
      };

      console.log('Shopify Order - line_items:', JSON.stringify(shopifyOrder.order.line_items, null, 2));
      console.log('Shopify Order - customer:', JSON.stringify(shopifyOrder.order.customer, null, 2));
      console.log('Shopify Order - shipping_address:', JSON.stringify(shopifyOrder.order.shipping_address, null, 2));

      // Explicitly stringify the entire shopifyOrder object before sending
      const shopifyOrderStringified = JSON.stringify(shopifyOrder);
      console.log('Shopify Order (stringified):', shopifyOrderStringified);

      const response = await axios.post(`https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-01/orders.json`, shopifyOrderStringified, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_API_KEY,
        },
      });

      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error creating Shopify order:', error.response ? error.response.data : error.message);
      res.status(500).send('Error creating Shopify order');
    }
  } else {
    res.status(200).send('Event type not handled');
  }
}
