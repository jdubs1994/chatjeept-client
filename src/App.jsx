import "./App.css";

import { useState, useCallback } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_KEY = ''; 
  const BASE_URL = 'https://api.runpod.ai/v2/iwb8t4joxdek0e';

  const pollStatus = useCallback(async (id) => {
    const response = await fetch(`${BASE_URL}/status/${id}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    const data = await response.json();
    return data;
  }, []);

  const waitForCompletion = useCallback(async (id) => {
    while (true) {
      const statusData = await pollStatus(id);
      if (statusData.status === 'COMPLETED') {
        return statusData;
      } else if (statusData.status === 'FAILED') {
        throw new Error('API request failed');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [pollStatus]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user'
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          input: {
            text: inputMessage
          }
        })
      });

      const initialData = await response.json();
      
      const finalData = await waitForCompletion(initialData.id);
      
      const assistantMessage = finalData.output.find(
        msg => msg.role === 'assistant'
      )?.content || 'Sorry, I could not generate a response.';

      const botMessage = {
        id: Date.now() + 1,
        text: assistantMessage,
        sender: 'bot'
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, there was an error processing your message.',
        sender: 'bot'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 h-screen flex items-center">
        <div className="w-full bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h1 className="text-xl font-bold">Chat Room</h1>
          </div>

          <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-2xl px-4 py-2 text-gray-500 rounded-bl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={sendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
