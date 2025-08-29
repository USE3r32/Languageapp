'use client';

interface TypingIndicatorProps {
  users: string[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const displayText = users.length === 1 
    ? `${users[0]} is typing...`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing...`
    : `${users[0]} and ${users.length - 1} others are typing...`;

  return (
    <div className="flex items-start gap-2 mb-1">
      {/* Avatar placeholder */}
      <div className="w-8 h-8 flex-shrink-0" />
      
      {/* Typing bubble */}
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      
      {/* Typing text */}
      <div className="text-xs text-gray-500 self-center ml-1">
        {displayText}
      </div>
    </div>
  );
}
