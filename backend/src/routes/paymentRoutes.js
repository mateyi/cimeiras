// src/routes/paymentRoutes.js
const express = require('express');
const router  = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

router.post('/create-preference', async (req, res) => {
  const { items, payer, order_id } = req.body;

  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: items.map(item => ({
          id:          item.product_id,
          title:       item.name,
          quantity:    item.quantity,
          unit_price:  parseFloat(item.price),
          currency_id: 'ARS',
        })),
        payer: {
          name:  payer.name,
          email: payer.email,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success`,
          failure: `${process.env.FRONTEND_URL}/checkout/failure`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending`,
        },
        auto_return:         'approved',
        external_reference:  order_id,
        statement_descriptor: 'CIMEIRAS',
      },
    });

    return res.json({
      id:          response.id,
      init_point:  response.init_point,
    });

  } catch (err) {
    console.error('[createPreference]', err.message);
    return res.status(500).json({ error: 'Error al crear preferencia de pago' });
  }
});

module.exports = router;