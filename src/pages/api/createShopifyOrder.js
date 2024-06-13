import Cors from 'cors';
import axios from 'axios';

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

export default async function createShopifyOrder(req, res) {
  await runMiddleware(req, res, cors);

  console.log('Received createShopifyOrder request:', req.body);

  if (req.method === 'POST') {
    const { shippingInfo, orderId, cartItems, total } = req.body;

    try {
      const shopifyOrder = {
        order: {
          line_items: cartItems.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          customer: {
            first_name: shippingInfo.name.split(' ')[0],
            last_name: shippingInfo.name.split(' ').slice(1).join(' '),
            email: shippingInfo.email,
          },
          shipping_address: {
            address1: shippingInfo.address,
            city: shippingInfo.city,
            province: shippingInfo.state,
            zip: shippingInfo.zip,
            country: shippingInfo.country,
          },
          financial_status: 'paid',
        },
      };

      const response = await axios.post(`https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-01/orders.json`, shopifyOrder, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_API_KEY,
        },
      });

      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error creating Shopify order:', error);
      res.status(500).json({ error: 'Failed to create Shopify order' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
