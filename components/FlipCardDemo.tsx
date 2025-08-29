'use client';

import { useState } from 'react';
import FlipCardMessage from './FlipCardMessage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Sparkles, Zap } from 'lucide-react';

export default function FlipCardDemo() {
  const [showDemo, setShowDemo] = useState(false);

  const demoMessages = [
    {
      id: '1',
      content: 'Hello! How are you doing today?',
      originalContent: 'Hola! ¿Cómo estás hoy?',
      senderId: 'demo-user-1',
      senderName: 'Maria',
      senderImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      timestamp: new Date().toISOString(),
      originalLanguage: 'es',
      translatedContent: 'Hello! How are you doing today?',
      targetLanguage: 'en',
      isTranslated: true,
    },
    {
      id: '2',
      content: 'I am doing great, thank you for asking!',
      originalContent: 'I am doing great, thank you for asking!',
      senderId: 'demo-user-2',
      senderName: 'John',
      senderImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      timestamp: new Date().toISOString(),
      originalLanguage: 'en',
      translatedContent: '¡Me va muy bien, gracias por preguntar!',
      targetLanguage: 'es',
      isTranslated: true,
    }
  ];

  if (!showDemo) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-800">
              🌟 Revolutionary Flip Card Feature
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
            <strong>World's First:</strong> See messages in your language, then flip to see the original. 
            Perfect transparency with zero friction!
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Zap className="w-3 h-3 mr-1" />
              Invisible Translation
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <RotateCcw className="w-3 h-3 mr-1" />
              Flip to Original
            </Badge>
          </div>
          
          <Button 
            onClick={() => setShowDemo(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            See Demo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          Flip Card Demo - Click the rotate buttons!
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDemo(false)}
        >
          Hide Demo
        </Button>
      </div>
      
      <div className="bg-white rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
        {demoMessages.map((message, index) => (
          <FlipCardMessage
            key={message.id}
            message={message}
            isOwn={index % 2 === 1}
          />
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          💡 <strong>Try it:</strong> Click the <RotateCcw className="w-3 h-3 inline mx-1" /> buttons to flip between translated and original messages!
        </p>
      </div>
    </div>
  );
}
