import axios from 'axios';

export const executeCode = async (questionsId: string, code: string, language: string = 'python') => {
  try {
    const response = await axios.post('/api/proxy/executeCode', {
      questionsId,
      code,
      language
    });
    return response.data;
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
};
