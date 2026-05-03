// src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOrderConfirmation = async (order) => {
  const {
    customer_name,
    customer_email,
    id,
    total_price,
    items = [],
  } = order;

  const shortId = id.slice(0, 8).toUpperCase();

  const itemsHtml = items.length > 0
    ? items.map(item => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; color: #f5f5f5; font-size: 14px;">
            ${item.product_name || 'Producto'}
            ${item.size ? `<span style="color:#888"> — Talle ${item.size}</span>` : ''}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; color: #f5f5f5; font-size: 14px; text-align: right;">
            x${item.quantity}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; color: #FFE000; font-size: 14px; text-align: right; font-weight: 800;">
            $${Number(item.unit_price * item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="color:#888; padding: 10px 0;">—</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #0e0e0e; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #1a1a1a; border: 1px solid #2a2a2a; }
        .header { padding: 32px; text-align: center; border-bottom: 2px solid #FFE000; }
        .header h1 { color: #FFE000; font-size: 28px; margin: 0 0 8px; letter-spacing: 0.1em; }
        .header p { color: #888; margin: 0; font-size: 14px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #f5f5f5; font-size: 20px; margin-bottom: 8px; }
        .body p { color: #888888; font-size: 15px; line-height: 1.7; margin-bottom: 0; }
        .order-id {
          background: #0e0e0e;
          border: 1px solid #2a2a2a;
          padding: 16px 24px;
          margin: 24px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-id-label { color: #888; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }
        .order-id-value { color: #FFE000; font-size: 22px; font-weight: 800; letter-spacing: 0.1em; }
        .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        .total-row { margin-top: 16px; padding-top: 16px; border-top: 2px solid #FFE000; display: flex; justify-content: space-between; }
        .total-label { color: #888; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }
        .total-value { color: #FFE000; font-size: 26px; font-weight: 800; }
        .btn { display: block; width: fit-content; margin: 32px auto 0; background: #FFE000; color: #0e0e0e; font-weight: 800; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; padding: 16px 40px; text-decoration: none; }
        .footer { padding: 24px 32px; border-top: 1px solid #2a2a2a; text-align: center; }
        .footer p { color: #444444; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>▲ CIMEIRAS</h1>
          <p>Confirmación de pedido</p>
        </div>
        <div class="body">
          <h2>¡Gracias por tu compra, ${customer_name.split(' ')[0]}!</h2>
          <p>Recibimos tu pedido y ya lo estamos procesando. Te avisaremos cuando esté en camino.</p>

          <div class="order-id">
            <div>
              <div class="order-id-label">Número de pedido</div>
              <div class="order-id-value">#${shortId}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align:left; color:#888; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding-bottom:10px; border-bottom:1px solid #2a2a2a;">Producto</th>
                <th style="text-align:right; color:#888; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding-bottom:10px; border-bottom:1px solid #2a2a2a;">Cant.</th>
                <th style="text-align:right; color:#888; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding-bottom:10px; border-bottom:1px solid #2a2a2a;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-value">$${Number(total_price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
          </div>

          <a href="${process.env.FRONTEND_URL}/catalogo" class="btn">Seguir comprando →</a>
        </div>
        <div class="footer">
          <p>© 2026 CIMEIRAS. Todos los derechos reservados.</p>
          <p style="margin-top:8px;">Si tenés alguna duda escribinos a <a href="mailto:${process.env.GMAIL_USER}" style="color:#FFE000;">${process.env.GMAIL_USER}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"Cimeiras" <${process.env.GMAIL_USER}>`,
    to:      customer_email,
    subject: `✓ Pedido #${shortId} recibido — Cimeiras`,
    html,
  });
};

module.exports = { sendOrderConfirmation };