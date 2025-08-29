'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  MessageCircle, 
  RotateCcw, 
  Globe, 
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Crown,
  Sparkles
} from 'lucide-react';

interface CompetitorFeature {
  name: string;
  hasFeature: boolean;
  description: string;
}

interface Competitor {
  name: string;
  logo: string;
  color: string;
  users: string;
  features: CompetitorFeature[];
}

export default function CompetitiveAdvantage() {
  const [showComparison, setShowComparison] = useState(false);

  const ourFeatures = [
    { name: 'Invisible Translation', description: 'Messages arrive in your language automatically' },
    { name: 'Flip Card Verification', description: 'Click to see original message anytime' },
    { name: 'Real-time Language Detection', description: 'Automatically detects message language' },
    { name: 'Cross-language Insights', description: 'Analytics on language usage patterns' },
    { name: 'Zero-friction Communication', description: 'No buttons, no extra steps' },
    { name: 'Translation Transparency', description: 'Perfect trust with verification' }
  ];

  const competitors: Competitor[] = [
    {
      name: 'WhatsApp',
      logo: '💬',
      color: 'green',
      users: '2B+',
      features: [
        { name: 'Invisible Translation', hasFeature: false, description: 'No built-in translation' },
        { name: 'Flip Card Verification', hasFeature: false, description: 'No translation verification' },
        { name: 'Real-time Language Detection', hasFeature: false, description: 'Manual language selection' },
        { name: 'Cross-language Insights', hasFeature: false, description: 'No language analytics' },
        { name: 'Zero-friction Communication', hasFeature: false, description: 'Copy-paste required' },
        { name: 'Translation Transparency', hasFeature: false, description: 'No original message access' }
      ]
    },
    {
      name: 'Messenger',
      logo: '📘',
      color: 'blue',
      users: '1.3B+',
      features: [
        { name: 'Invisible Translation', hasFeature: false, description: 'Manual translate button' },
        { name: 'Flip Card Verification', hasFeature: false, description: 'No flip functionality' },
        { name: 'Real-time Language Detection', hasFeature: false, description: 'Basic detection only' },
        { name: 'Cross-language Insights', hasFeature: false, description: 'No insights provided' },
        { name: 'Zero-friction Communication', hasFeature: false, description: 'Extra clicks required' },
        { name: 'Translation Transparency', hasFeature: false, description: 'Limited verification' }
      ]
    },
    {
      name: 'Telegram',
      logo: '✈️',
      color: 'cyan',
      users: '800M+',
      features: [
        { name: 'Invisible Translation', hasFeature: false, description: 'Hidden in menu' },
        { name: 'Flip Card Verification', hasFeature: false, description: 'No verification system' },
        { name: 'Real-time Language Detection', hasFeature: false, description: 'Manual setup required' },
        { name: 'Cross-language Insights', hasFeature: false, description: 'No analytics' },
        { name: 'Zero-friction Communication', hasFeature: false, description: 'Multiple steps needed' },
        { name: 'Translation Transparency', hasFeature: false, description: 'No original access' }
      ]
    }
  ];

  if (!showComparison) {
    return (
      <Card className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">
                🏆 Our Competitive Advantage
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
              See how we're revolutionizing messaging with features that <strong>WhatsApp, Messenger, and Telegram don't have</strong>
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {ourFeatures.slice(0, 3).map((feature, index) => (
                <Badge key={index} className="bg-purple-100 text-purple-800 border-purple-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {feature.name}
                </Badge>
              ))}
            </div>
            
            <Button 
              onClick={() => setShowComparison(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Full Comparison
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Crown className="w-5 h-5 mr-2 text-purple-600" />
            Competitive Analysis
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComparison(false)}
          >
            Hide
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Our App */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border-2 border-green-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                🚀
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Our Translation Messenger</h4>
                <p className="text-sm text-gray-600">The Future of Global Communication</p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white">
              <Crown className="w-3 h-3 mr-1" />
              LEADER
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ourFeatures.map((feature, index) => (
              <div key={index} className="flex items-center bg-white rounded p-2">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-800">{feature.name}</span>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitors */}
        {competitors.map((competitor, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  {competitor.logo}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{competitor.name}</h4>
                  <p className="text-sm text-gray-600">{competitor.users} users</p>
                </div>
              </div>
              <Badge variant="outline" className="text-gray-600">
                Traditional
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {competitor.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center bg-gray-50 rounded p-2">
                  <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-800">{feature.name}</span>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border border-yellow-300">
          <div className="text-center">
            <Zap className="w-6 h-6 mx-auto text-orange-600 mb-2" />
            <h4 className="font-bold text-gray-800 mb-2">🎯 Market Opportunity</h4>
            <p className="text-sm text-gray-700">
              <strong>4+ billion messaging users</strong> worldwide struggle with language barriers. 
              We're the <strong>first and only</strong> app to solve this with invisible translation + flip card verification.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
