import nodemailer from 'nodemailer';
import { TicketDTO, TicketPurchaseResponseDTO } from '../dto';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface TicketPurchaseEmailData {
  customerEmail: string;
  customerName: string;
  confirmationId: string;
  tickets: TicketDTO[];
  totalAmount: number;
  discountApplied: number;
  concertName: string;
  concertDate: string;
  venue: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (!this.transporter) {
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };

      this.transporter = nodemailer.createTransport(config);
    }
    return this.transporter;
  }

  /**
   * Send ticket purchase confirmation email
   */
  static async sendTicketPurchaseConfirmation(emailData: TicketPurchaseEmailData): Promise<void> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        throw new Error('Email transporter not configured');
      }

      const htmlContent = this.generatePurchaseConfirmationHTML(emailData);
      const textContent = this.generatePurchaseConfirmationText(emailData);

      const mailOptions = {
        from: `"ConcertGo" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: emailData.customerEmail,
        subject: `🎫 Ticket Purchase Confirmation - ${emailData.concertName}`,
        text: textContent,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Purchase confirmation email sent:', info.messageId);
    } catch (error) {
      console.error('Failed to send purchase confirmation email:', error);
      // Don't throw error to avoid breaking the purchase flow
      // Log the error but continue with the successful purchase
    }
  }

  /**
   * Generate HTML email template for purchase confirmation
   */
  private static generatePurchaseConfirmationHTML(data: TicketPurchaseEmailData): string {
    const ticketRows = data.tickets.map(ticket => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${ticket.ticket_id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${ticket.zone_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">$${Number(ticket.purchase_price).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Purchase Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2c2c2c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎫 Purchase Confirmed!</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your tickets are ready</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${data.customerName}! 👋</h2>
        <p>Great news! Your ticket purchase has been confirmed. Here are your details:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📅 Event Details</h3>
          <p><strong>Concert:</strong> ${data.concertName}</p>
          <p><strong>Date:</strong> ${new Date(data.concertDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p><strong>Arena:</strong> ${data.venue}</p>
        </div>
        
        <h3 style="color: #333;">🎟️ Your Tickets</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background: #444; color: white;">
              <th style="padding: 12px; text-align: left;">Ticket ID</th>
              <th style="padding: 12px; text-align: left;">Zone</th>
              <th style="padding: 12px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${ticketRows}
          </tbody>
        </table>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">💰 Payment Summary</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Subtotal:</span>
            <span>$${(data.totalAmount + data.discountApplied).toFixed(2)}</span>
          </div>
          ${data.discountApplied > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #28a745;">
            <span>Discount Applied:</span>
            <span>-$${data.discountApplied.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin: 15px 0 0; padding-top: 15px; border-top: 2px solid #333; font-weight: bold; font-size: 18px;">
            <span>Total Paid:</span>
            <span style="color: #333;">$${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #555;">📋 Important Information</h4>
          <ul style="margin-bottom: 0; color: #555;">
            <li>Please bring a valid ID and this confirmation email to the venue</li>
            <li>Tickets are non-refundable and non-transferable</li>
            <li>Arrive at least 30 minutes before the show starts</li>
            <li>Check the venue's website for any COVID-19 requirements</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666;">Thank you for choosing ConcertGo!</p>
          <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ConcertGo. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text email template for purchase confirmation
   */
  private static generatePurchaseConfirmationText(data: TicketPurchaseEmailData): string {
    const ticketList = data.tickets.map(ticket => 
      `- Ticket ID: ${ticket.ticket_id} | Zone: ${ticket.zone_name} | Price: $${Number(ticket.purchase_price).toFixed(2)}`
    ).join('\n');

    return `
🎫 TICKET PURCHASE CONFIRMATION

Hi ${data.customerName}!

Your ticket purchase has been confirmed. Here are your details:

📅 EVENT DETAILS
Concert: ${data.concertName}
Date: ${new Date(data.concertDate).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
Arena: ${data.venue}

🎟️ YOUR TICKETS
${ticketList}

💰 PAYMENT SUMMARY
Subtotal: $${(data.totalAmount + data.discountApplied).toFixed(2)}
${data.discountApplied > 0 ? `Discount Applied: -$${data.discountApplied.toFixed(2)}\n` : ''}Total Paid: $${data.totalAmount.toFixed(2)}

📋 IMPORTANT INFORMATION
- Please bring a valid ID and this confirmation email to the venue
- Tickets are non-refundable and non-transferable
- Arrive at least 30 minutes before the show starts
- Check the venue's website for any COVID-19 requirements

Thank you for choosing ConcertGo!

© ${new Date().getFullYear()} ConcertGo. All rights reserved.
    `.trim();
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        return false;
      }
      await transporter.verify();
      console.log('Email configuration is valid');
      return true;
    } catch (error) {
      console.error('Email configuration is invalid:', error);
      return false;
    }
  }
} 