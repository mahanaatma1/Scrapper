import axios from 'axios';
import { API_BASE_URLS } from '../config/api';

const gptMailApi = axios.create({
  baseURL: API_BASE_URLS.gptMail,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Create and export the gptMailService object
export const gptMailService = {
  generateMail: async (mailData) => {
    try {
      const response = await gptMailApi.post('/generate/', {
        title: mailData.title,
        description: mailData.description,
        dateOfPost: mailData.date,
        persona: "Abj",
        link: mailData.link,
        city: mailData.city
      });
      return response.data.reply;
    } catch (error) {
      console.error('Error generating mail:', error);
      throw error;
    }
  },

  // Helper function to parse mail response into subject and content
  parseMailResponse: (response) => {
    try {
      const [subjectLine, ...contentParts] = response.split('\n\n');
      const subject = subjectLine.replace('Subject:', '').trim();
      const content = contentParts.join('\n\n');
      return {
        subject: subject,
        content: content.trim()
      };
    } catch (error) {
      console.error('Error parsing mail response:', error);
      return {
        subject: '',
        content: response
      };
    }
  }
};
