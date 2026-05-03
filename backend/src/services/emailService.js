// src/services/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Cimeiras <hola@cimeiras.com.ar>';
// Cuando tengas el dominio verificado en Resend cambiás esto por:
// const FROM = 'Cimeiras <hola@cimeiras.com.ar>';

// ════════════════════════════════════════════════════════════
//  Email de bienvenida al registrarse
// ════════════════════════════════════════════════════════════
const sendWelcomeEmail = async (email, name, userId) => {
  const shortId = userId.slice(0, 8).toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;background:#0e0e0e;margin:0;padding:0}
      .container{max-width:560px;margin:40px auto;background:#1a1a1a;border:1px solid #2a2a2a}
      .header{padding:32px;text-align:center;border-bottom:2px solid #FFE000}
      .header h1{color:#FFE000;font-size:28px;margin:0;letter-spacing:.1em}
      .body{padding:40px 32px}
      .body h2{color:#f5f5f5;font-size:20px;margin-bottom:12px}
      .body p{color:#888;font-size:15px;line-height:1.7;margin-bottom:16px}
      .id-box{background:#0e0e0e;border:1px solid #2a2a2a;padding:16px 24px;margin:24px 0;text-align:center}
      .id-label{color:#888;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:6px}
      .id-value{color:#FFE000;font-size:22px;font-weight:800;letter-spacing:.1em}
      .badge{display:inline-block;background:#FFE000;color:#0e0e0e;font-weight:800;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:8px 20px;margin:8px 0}
      .footer{padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center}
      .footer p{color:#444;font-size:12px;margin:0}
    </style>
    </head>
    <body>
    <div class="container">
      <div class="header"><h1>▲ CIMEIRAS</h1></div>
      <div class="body">
        <h2>¡Gracias por registrarte, ${name.split(' ')[0]}!</h2>
        <p>Tu cuenta fue creada exitosamente. Estamos felices de tenerte en la comunidad Cimeiras 🏔️</p>
        <p>Tu ID de usuario es:</p>
        <div class="id-box">
          <div class="id-label">ID de usuario</div>
          <div class="id-value">#${shortId}</div>
        </div>
        <p>Guardá este ID, lo vas a necesitar si alguna vez necesitás contactarnos por consultas sobre tu cuenta.</p>
        <p>Además vas a ser el primero en enterarte de nuestras <strong style="color:#f5f5f5">ofertas exclusivas y cupones de descuento</strong> que vamos a estar lanzando. ¡Estate atento a tu email!</p>
        <div style="text-align:center;margin-top:28px">
          <a href="${process.env.FRONTEND_URL}/catalogo" style="display:inline-block;background:#FFE000;color:#0e0e0e;font-weight:800;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:16px 40px;text-decoration:none">
            Ver colección →
          </a>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 CIMEIRAS. Todos los derechos reservados.</p>
        <p style="margin-top:8px">Ropa deportiva para mujeres que no se detienen.</p>
      </div>
    </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: '¡Bienvenida a Cimeiras! 🏔️',
    html,
  });
};

// ════════════════════════════════════════════════════════════
//  Email de confirmación de compra
// ════════════════════════════════════════════════════════════
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
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;font-size:14px;text-align:right">
            x${item.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#FFE000;font-size:14px;text-align:right;font-weight:800">
            $${Number(item.unit_price * item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="color:#888;padding:10px 0">—</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8">
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
      .total-row{margin-top:16px;padding-top:16px;border-top:2px solid #FFE000;display:flex;justify-content:space-between;align-items:center}
      .total-label{color:#888;font-size:12px;letter-spacing:.2em;text-transform:uppercase}
      .total-value{color:#FFE000;font-size:26px;font-weight:800}
      .seguimiento{background:#0e0e0e;border:1px solid #2a2a2a;padding:16px 24px;margin:24px 0;text-align:center}
      .footer{padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center}
      .footer p{color:#444;font-size:12px;margin:0}
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
        <p style="margin-bottom:16px">Recibimos tu pedido y ya lo estamos procesando. Te vamos a pasar el seguimiento de tu pedido en cuanto esté en camino.</p>

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

        <div class="total-row">
          <span class="total-label">Total</span>
          <span class="total-value">$${Number(total_price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
        </div>

        <div class="seguimiento" style="margin-top:24px">
          <p style="color:#888;font-size:13px;margin:0">📦 Te avisaremos por email cuando tu pedido esté en camino con el número de seguimiento.</p>
        </div>

        <div style="text-align:center;margin-top:28px">
          <a href="${process.env.FRONTEND_URL}/catalogo" style="display:inline-block;background:#FFE000;color:#0e0e0e;font-weight:800;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:16px 40px;text-decoration:none">
            Seguir comprando →
          </a>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 CIMEIRAS. Todos los derechos reservados.</p>
        <p style="margin-top:8px">¿Dudas? Escribinos a <a href="mailto:cimeiras@gmail.com" style="color:#FFE000">cimeiras@gmail.com</a></p>
      </div>
    </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from:    FROM,
    to:      customer_email,
    subject: `✓ Pedido ${shortId} recibido — Cimeiras`,
    html,
  });
};

module.exports = { sendWelcomeEmail, sendOrderConfirmation };