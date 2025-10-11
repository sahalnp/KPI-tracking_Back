import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class GmailSMTPClient {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD // Your Gmail App Password (not regular password)
      }
    });
  }

  async sendEmail(emailData) {
    try {
      const { to, sender, subject, htmlContent, attachment } = emailData;
      
      const mailOptions = {
        from: {
          name: sender.name,
          address: sender.email
        },
        to: to.map(recipient => `${recipient.name} <${recipient.email}>`).join(', '),
        subject: subject,
        html: htmlContent,
        attachments: attachment ? attachment.map(att => ({
          filename: att.name,
          content: att.content,
          encoding: 'base64',
          cid: att.cid
        })) : []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully via Gmail SMTP:', result.messageId);
      return result;
    } catch (error) {
      console.error('Gmail SMTP Error:', error);
      throw error;
    }
  }
}

const gmailClient = new GmailSMTPClient();
export default gmailClient;
