// src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;background:#0e0e0e;margin:0;padding:0}
      .container{max-width:560px;margin:40px auto;background:#1a1a1a;border:1px solid #2a2a2a}
      .header{padding:32px;text-align:center;border-bottom:2px solid #FFE000}
      .header h1{color:#FFE000;font-size:28px;margin:0;letter-spacing:.1em}
      .body{padding:40px 32px}
      .body h2{color:#f5f5f5;font-size:20px;margin-bottom:12px}
      .body p{color:#888;font-size:15px;line-height:1.7;margin-bottom:24px}
      .btn{display:block;width:fit-content;margin:0 auto 24px;background:#FFE000;color:#0e0e0e;font-weight:800;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:16px 40px;text-decoration:none}
      .footer{padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center}
      .footer p{color:#444;font-size:12px;margin:0}
      .url{color:#555;font-size:12px;word-break:break-all;margin-top:16px}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>▲ CIMEIRAS</h1></div>
      <div class="body">
        <h2>¡Hola, ${name}!</h2>
        <p>Gracias por registrarte en Cimeiras. Hacé click en el botón para activar tu cuenta.</p>
        <a href="${verifyUrl}" class="btn">Verificar mi cuenta</a>
        <p>Este enlace expira en <strong style="color:#f5f5f5">1 hora</strong>. Si no creaste una cuenta, ignorá este email.</p>
        <p class="url">Si el botón no funciona copiá este enlace:<br>${verifyUrl}</p>
      </div>
      <div class="footer"><p>© 2026 CIMEIRAS. Todos los derechos reservados.</p></div>
    </div></body></html>
  `;
  await transporter.sendMail({
    from:    `"Cimeiras" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject: 'Verificá tu cuenta de Cimeiras',
    html,
  });
};

const sendOrderConfirmation = async (order) => {
  const { customer_name, customer_email, id, total_price, items = [], order_code } = order;
  const shortId = order_code || id.slice(0, 8).toUpperCase();

  const itemsHtml = items.length > 0
    ? items.map(item => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;font-size:14px">
            ${item.product_name || 'Producto'}
            ${item.size ? `<span style="color:#888"> — Talle ${item.size}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;font-size:14px;text-align:right">x${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#FFE000;font-size:14px;text-align:right;font-weight:800">
            $${Number(item.unit_price * item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="color:#888;padding:10px 0">—</td></tr>`;

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;background:#0e0e0e;margin:0;padding:0}
      .container{max-width:580px;margin:40px auto;background:#1a1a1a;border:1px solid #2a2a2a}
      .header{padding:32px;text-align:center;border-bottom:2px solid #FFE000}
      .header h1{color:#FFE000;font-size:28px;margin:0 0 8px;letter-spacing:.1em}
      .header p{color:#888;margin:0;font-size:14px}
      .body{padding:40px 32px}
      .body h2{color:#f5f5f5;font-size:20px;margin-bottom:8px}
      .body p{color:#888;font-size:15px;line-height:1.7;margin-bottom:0}
      .order-box{background:#0e0e0e;border:1px solid #2a2a2a;padding:16px 24px;margin:24px 0}
      .label{color:#888;font-size:12px;letter-spacing:.2em;text-transform:uppercase}
      .code{color:#FFE000;font-size:26px;font-weight:800;letter-spacing:.1em;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin:24px 0}
      th{text-align:left;color:#888;font-size:11px;letter-spacing:.15em;text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid #2a2a2a}
      th:not(:first-child){text-align:right}
      .total{margin-top:16px;padding-top:16px;border-top:2px solid #FFE000;display:flex;justify-content:space-between}
      .total-label{color:#888;font-size:12px;letter-spacing:.2em;text-transform:uppercase}
      .total-value{color:#FFE000;font-size:26px;font-weight:800}
      .btn{display:block;width:fit-content;margin:32px auto 0;background:#FFE000;color:#0e0e0e;font-weight:800;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:16px 40px;text-decoration:none}
      .footer{padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center}
      .footer p{color:#444;font-size:12px;margin:0}
    </style></head>
    <body><div class="container">
      <div class="header">
        <h1>▲ CIMEIRAS</h1>
        <p>Confirmación de pedido</p>
      </div>
      <div class="body">
        <h2>¡Gracias por tu compra, ${customer_name.split(' ')[0]}!</h2>
        <p>Recibimos tu pedido y ya lo estamos procesando. Te avisaremos cuando esté en camino.</p>
        <div class="order-box">
          <div class="label">Número de pedido</div>
          <div class="code">${shortId}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align:right">Cant.</th>
              <th style="text-align:right">Precio</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">
          <span class="total-label">Total</span>
          <span class="total-value">$${Number(total_price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
        </div>
        <a href="${process.env.FRONTEND_URL}/catalogo" class="btn">Seguir comprando →</a>
      </div>
      <div class="footer">
        <p>© 2026 CIMEIRAS. Todos los derechos reservados.</p>
        <p style="margin-top:8px">¿Dudas? Escribinos a <a href="mailto:${process.env.GMAIL_USER}" style="color:#FFE000">${process.env.GMAIL_USER}</a></p>
      </div>
    </div></body></html>
  `;

  await transporter.sendMail({
    from:    `"Cimeiras" <${process.env.GMAIL_USER}>`,
    to:      customer_email,
    subject: `✓ Pedido ${shortId} recibido — Cimeiras`,
    html,
  });
};

module.exports = { sendVerificationEmail, sendOrderConfirmation };