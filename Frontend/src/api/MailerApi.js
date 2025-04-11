import axios from 'axios';
import { API_BASE_URLS } from '../config/api';

const mailerApi = axios.create({
  baseURL: API_BASE_URLS.mailer,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Create and export the mailerService object
export const mailerService = {
  sendMail: async (mailData) => {
    try {
      const response = await mailerApi.post('/send-mail', {
        mail_id: mailData.email,
        subject: mailData.subject,
        mail_body: mailData.mail_body
      });
      return response.data;
    } catch (error) {
      console.error('Error sending mail:', error);
      throw error;
    }
  }
};
