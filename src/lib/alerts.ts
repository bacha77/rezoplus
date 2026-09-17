import { Resend } from 'resend';
import twilio from 'twilio';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

export const sendSlackAlert = async (message: string) => {
  if (!SLACK_WEBHOOK_URL) {
    console.log(`[SLACK ALERT MOCK] ${message}`);
    return;
  }

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
};

export const sendUserEmailAlert = async (toEmail: string, carrierName: string, dotNumber: string, status: string) => {
  if (!resend) {
    console.log(`[EMAIL ALERT MOCK to ${toEmail}] Carrier: ${carrierName}, Status: ${status}`);
    return;
  }

  const subject = `🚨 URGENT: ${carrierName} (DOT: ${dotNumber}) Status Change!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #d9534f;">Carrier Status Alert</h2>
      <p>This is an automated alert from <strong>RezoPlus Monitor</strong>.</p>
      <p>The following carrier has had a critical status change:</p>
      <ul>
        <li><strong>Carrier Name:</strong> ${carrierName}</li>
        <li><strong>DOT Number:</strong> ${dotNumber}</li>
        <li><strong>New Status:</strong> <span style="color: #d9534f; font-weight: bold;">${status}</span></li>
      </ul>
      <p>Please take immediate action if this carrier is actively hauling freight for your brokerage.</p>
      <br/>
      <p style="font-size: 12px; color: #777;">
        You are receiving this email because you are subscribed to RezoPlus alerts.
        <br/>
        <a href="https://rezoplus.vercel.app/dashboard">Manage your notification settings here.</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'RezoPlus Alerts <onboarding@resend.dev>', // Use onboarding until domain is verified
      to: [toEmail],
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.error(`Failed to send Email alert to ${toEmail}:`, error);
  }
};

export const sendUserSmsAlert = async (toNumber: string, carrierName: string, status: string) => {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log(`[SMS ALERT MOCK to ${toNumber}] Carrier: ${carrierName}, Status: ${status}`);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: `🚨 RezoPlus Alert: Carrier ${carrierName} status changed to ${status}. Log in to view details.`,
      from: TWILIO_PHONE_NUMBER,
      to: toNumber
    });
  } catch (error) {
    console.error(`Failed to send SMS alert to ${toNumber}:`, error);
  }
};
