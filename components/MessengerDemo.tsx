'use client';

import FlipCardMessage from './FlipCardMessage';

const demoMessages = [
  {
    id: '1',
    content: 'Hey! How are you doing today?',
    senderId: 'other-user',
    senderName: 'Sarah Johnson',
    senderImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    originalLanguage: 'en',
    translatedContent: 'Hola! ¿Cómo estás hoy?',
    targetLanguage: 'es',
    isTranslated: true
  },
  {
    id: '2',
    content: 'I\'m doing great! Just finished a big project at work.',
    senderId: 'current-user',
    senderName: 'You',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    originalLanguage: 'en',
    translatedContent: '¡Estoy muy bien! Acabo de terminar un gran proyecto en el trabajo.',
    targetLanguage: 'es',
    isTranslated: true
  },
  {
    id: '3',
    content: 'That\'s awesome! What kind of project was it?',
    senderId: 'other-user',
    senderName: 'Sarah Johnson',
    senderImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    originalLanguage: 'en',
    translatedContent: '¡Eso es increíble! ¿Qué tipo de proyecto era?',
    targetLanguage: 'es',
    isTranslated: true
  },
  {
    id: '4',
    content: 'It was a translation messaging app! Pretty cool stuff 😊',
    senderId: 'current-user',
    senderName: 'You',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    originalLanguage: 'en',
    translatedContent: '¡Era una aplicación de mensajería con traducción! Cosas muy geniales 😊',
    targetLanguage: 'es',
    isTranslated: true
  },
  {
    id: '5',
    content: 'Wow, that sounds really innovative! Can you tell me more about it?',
    senderId: 'other-user',
    senderName: 'Sarah Johnson',
    senderImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    originalLanguage: 'en',
    translatedContent: '¡Vaya, eso suena realmente innovador! ¿Puedes contarme más al respecto?',
    targetLanguage: 'es',
    isTranslated: true
  },
  {
    id: '6',
    content: 'Sure! It automatically translates messages between users who speak different languages. Like WhatsApp but with real-time translation!',
    senderId: 'current-user',
    senderName: 'You',
    timestamp: new Date().toISOString(),
    originalLanguage: 'en',
    translatedContent: '¡Claro! Traduce automáticamente mensajes entre usuarios que hablan diferentes idiomas. ¡Como WhatsApp pero con traducción en tiempo real!',
    targetLanguage: 'es',
    isTranslated: true
  }
];

interface MessengerDemoProps {
  currentUserId?: string;
}

export default function MessengerDemo({ currentUserId = 'current-user' }: MessengerDemoProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center">
          <button className="mr-3 p-2 hover:bg-gray-100 rounded-full">
            ←
          </button>
          <div className="flex items-center">
            <img
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
              alt="Sarah Johnson"
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Sarah Johnson</h1>
              <p className="text-sm text-green-600">Active now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 py-4">
        <div className="space-y-1">
          {demoMessages.map((message) => (
            <FlipCardMessage
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              placeholder="Type a message..."
              className="w-full min-h-[44px] max-h-[120px] resize-none border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-3xl px-4 py-3 text-[15px] leading-[1.4] shadow-sm"
              rows={1}
            />
          </div>
          <button className="w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0 shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
