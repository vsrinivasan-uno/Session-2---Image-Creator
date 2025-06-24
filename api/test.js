export default function handler(req, res) {
  const { method, url, query } = req;
  
  if (method === 'GET' && url.includes('/api/assignments/1/submissions')) {
    return res.status(200).json({
      message: 'Test submissions endpoint working',
      timestamp: new Date().toISOString(),
      data: [
        {
          id: 1,
          student_name: 'Test Student',
          prompt_data: { technique: 'test', prompt: 'test prompt' },
          votes: 0,
          submitted_at: new Date().toISOString()
        }
      ]
    });
  }
  
  if (method === 'POST' && url.includes('/api/submissions')) {
    return res.status(200).json({
      message: 'Test submission endpoint working',
      id: 1,
      submission_code: 'TEST123'
    });
  }
  
  res.status(404).json({ error: 'Endpoint not found in test' });
} 