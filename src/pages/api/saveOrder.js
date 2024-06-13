import Cors from 'cors';
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

export default async function saveOrder(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method === 'POST') {
    let { shippingInfo, orderId, total, cartItems } = req.body;

    // Ensure orderId is a string and remove decimal and trailing zero if present
    orderId = orderId.toString().replace(/\.0+$/, '');

    try {
      const customerResult = await query(
        `INSERT INTO customers (name, address, city, state, zip, country, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [shippingInfo.name, shippingInfo.address, shippingInfo.city, shippingInfo.state, shippingInfo.zip, shippingInfo.country, shippingInfo.email]
      );
      const customerId = customerResult.rows[0].id;

      await query(
        `INSERT INTO orders (customer_id, order_id, total, status, cart_items, shipping_info)
         VALUES ($1, $2, $3, 'pending', $4, $5)`,
        [customerId, orderId, total, JSON.stringify(cartItems), JSON.stringify(shippingInfo)]
      );

      console.log('Order saved successfully with orderId:', orderId);

      res.status(200).json({ message: 'Order saved successfully' });
    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({ error: 'Failed to save order' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
