import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { database } from '../config/firebase';

const Chat = ({ roomId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Chat data received:', data);
      
      if (data) {
        const messagesList = Object.entries(data)
          .map(([key, value]) => ({ id: key, ...value }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error('Chat sync error:', error);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      const messageData = {
        text: newMessage.trim(),
        sender: userName,
        timestamp: Date.now() // Use client timestamp for better compatibility
      };
      
      console.log('Sending message:', messageData);
      
      push(messagesRef, messageData)
        .then(() => {
          console.log('Message sent successfully');
          setNewMessage('');
        })
        .catch(error => {
          console.error('Error sending message:', error);
          alert('Failed to send message. Please try again.');
        });
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-6 shadow-3d h-96 flex flex-col">
      <div className="flex items-center space-x-2 mb-4">
        <MessageCircle className="w-5 h-5 text-purple-400" />
        <h3 className="text-xl font-bold text-white">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-bubble p-3 rounded-xl max-w-xs ${
              message.sender === userName
                ? 'bg-purple-600 text-white ml-auto'
                : 'bg-gray-700 text-gray-100'
            }`}
          >
            <div className="text-xs opacity-70 mb-1">{message.sender}</div>
            <div>{message.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-xl btn-3d transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
