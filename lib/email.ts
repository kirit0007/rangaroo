import { Order } from '@/types';

export async function sendOrderConfirmationEmail(order: Order, customerEmailOverride?: string) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'rangaroo.co@gmail.com';
    const recipientEmail = customerEmailOverride || (order as any).customerEmail || (order.shippingAddress as any)?.email || (order as any).email;
    const recipientName = order.shippingAddress?.fullName || 'Valued Customer';
    const orderNum = order.orderNumber || order.id || '#1001';

    console.log(`[Brevo Email Service] Initiating order confirmation email for Order ${orderNum}`);
    console.log(`[Brevo Email Service] Recipient: ${recipientEmail || 'MISSING'}, Sender: ${senderEmail}`);

    if (!apiKey) {
      const errMsg = '[Brevo Email Error] BREVO_API_KEY is not set in environment variables.';
      console.error(errMsg);
      return { success: false, error: errMsg };
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      const errMsg = `[Brevo Email Error] Invalid or missing recipient email address: "${recipientEmail}"`;
      console.error(errMsg);
      return { success: false, error: errMsg };
    }

    // Format item rows for HTML email
    const itemRows = (order.items || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 12px 8px; vertical-align: middle;">
          <strong style="color: #1f2937; font-size: 14px;">${item.productName || 'DIY Paint Kit'}</strong>
          <br><span style="color: #6b7280; font-size: 12px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #1f2937; font-weight: bold; font-size: 14px;">
          ₹${(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Rangaroo</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF9F2; margin: 0; padding: 20px; color: #333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #ffe8d6;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #FF5722; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">Rangaroo</h1>
              <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0 0; font-size: 14px; font-style: italic;">Paint. Create. Imagine.</p>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td style="padding: 30px 30px 10px 30px; text-align: center;">
              <div style="display: inline-block; background-color: #ecfdf5; color: #047857; padding: 8px 18px; border-radius: 50px; font-weight: bold; font-size: 14px; border: 1px solid #a7f3d0;">
                🎉 Payment Confirmed & Order Placed!
              </div>
              <h2 style="color: #111827; margin-top: 15px; margin-bottom: 5px; font-size: 22px;">Thank you for your order, ${recipientName}!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">We have received your payment and are getting your DIY paint kit ready for dispatch.</p>
            </td>
          </tr>

          <!-- Order Summary Card -->
          <tr>
            <td style="padding: 20px 30px;">
              <table width="100%" style="background-color: #f9fafb; border-radius: 14px; padding: 15px; border: 1px solid #f3f4f6;">
                <tr>
                  <td>
                    <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Order Number</span>
                    <br><strong style="color: #FF5722; font-size: 18px;">${orderNum}</strong>
                  </td>
                  <td style="text-align: right;">
                    <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Payment Status</span>
                    <br><strong style="color: #059669; font-size: 14px;">Paid Via Razorpay</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item Table -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h3 style="color: #111827; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #FF5722; padding-bottom: 6px; display: inline-block;">Items Ordered</h3>
              <table width="100%" cellSpacing="0" cellPadding="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" style="background-color: #fff9f2; padding: 15px; border-radius: 12px; font-size: 13px;">
                <tr>
                  <td style="color: #4b5563; padding: 3px 0;">Subtotal:</td>
                  <td style="text-align: right; font-weight: bold; color: #1f2937;">₹${(order.subtotal || order.total).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="color: #4b5563; padding: 3px 0;">Shipping Fee:</td>
                  <td style="text-align: right; font-weight: bold; color: #1f2937;">${order.shippingFee > 0 ? `₹${order.shippingFee}` : 'FREE'}</td>
                </tr>
                ${order.discountAmount > 0 ? `
                <tr>
                  <td style="color: #059669; padding: 3px 0;">Discount Applied:</td>
                  <td style="text-align: right; font-weight: bold; color: #059669;">-₹${order.discountAmount}</td>
                </tr>` : ''}
                <tr style="border-top: 1px solid #ffe4d6;">
                  <td style="color: #111827; font-size: 15px; font-weight: bold; padding-top: 8px;">Total Paid:</td>
                  <td style="text-align: right; font-size: 16px; font-weight: bold; color: #FF5722; padding-top: 8px;">₹${order.total.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #111827; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #FF5722; padding-bottom: 6px; display: inline-block;">Shipping Address</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 12px; font-size: 13px; color: #374151; line-height: 1.5; border: 1px solid #f3f4f6;">
                <strong>${order.shippingAddress?.fullName || recipientName}</strong><br>
                ${order.shippingAddress?.addressLine1 || ''}${order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br>
                ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
                📞 Phone: ${order.shippingAddress?.phone || 'N/A'}
              </div>
            </td>
          </tr>

          <!-- Support Footer -->
          <tr>
            <td style="background-color: #1a1a2e; color: #9ca3af; padding: 25px 30px; text-align: center; font-size: 12px;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-weight: bold; font-size: 14px;">Need Help with your order?</p>
              <p style="margin: 0 0 15px 0;">WhatsApp Us: <a href="https://wa.me/918793687379" style="color: #25D366; font-weight: bold; text-decoration: none;">+91 87936 87379</a> | Email: <a href="mailto:rangaroo.co@gmail.com" style="color: #ffaa00; text-decoration: none;">rangaroo.co@gmail.com</a></p>
              <p style="margin: 0; opacity: 0.7;">© 2026 Rangaroo Store. Made with ❤️ in India.</p>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `;

    // Make Brevo API POST request
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Rangaroo Store',
          email: senderEmail,
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName,
          },
        ],
        subject: `🎉 Order Confirmed! Your Rangaroo Order ${orderNum}`,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = `[Brevo API Error ${response.status}] ${data.message || JSON.stringify(data)}`;
      console.error(errMsg);
      return { success: false, error: errMsg, details: data };
    }

    console.log(`[Brevo Email Service] Success! Message ID: ${data.messageId}`);
    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    const errMsg = `[Brevo Email Exception] ${error.message || error}`;
    console.error(errMsg);
    return { success: false, error: errMsg };
  }
}
