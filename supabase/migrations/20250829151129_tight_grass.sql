/*
  # Initial Database Schema for Translation Messenger

  1. New Tables
    - `users` - User profiles synced with Clerk
    - `conversations` - Chat conversations (direct and group)
    - `conversation_members` - Many-to-many relationship for conversation participants
    - `messages` - Chat messages with translation support
    - `message_translations` - Cached translations for different languages
    - `push_subscriptions` - Web push notification subscriptions
    - `typing_indicators` - Real-time typing status

  2. Security
    - All tables have proper indexes for performance
    - Foreign key constraints for data integrity
    - Timestamps for audit trails

  3. Features
    - Multi-language translation support
    - Real-time messaging capabilities
    - Push notification infrastructure
    - Online status tracking
    - Read receipts and typing indicators
*/

-- Users table - synced with Clerk
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  image_url text,
  preferred_language text DEFAULT 'en',
  is_online boolean DEFAULT false,
  last_seen timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  is_group boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  last_message_id uuid,
  last_message_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Conversation members table
CREATE TABLE IF NOT EXISTS conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamp DEFAULT now(),
  is_admin boolean DEFAULT false,
  last_read_at timestamp DEFAULT now(),
  notifications_enabled boolean DEFAULT true
);

-- Messages table with translation support
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  translated_content text,
  original_language text,
  target_language text,
  is_translated boolean DEFAULT false,
  message_type text DEFAULT 'text',
  metadata jsonb,
  edited_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Message translations table for multiple language support
CREATE TABLE IF NOT EXISTS message_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  language text NOT NULL,
  translated_text text NOT NULL,
  confidence integer,
  created_at timestamp DEFAULT now()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Typing indicators table for realtime
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_typing boolean DEFAULT true,
  updated_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS clerk_id_idx ON users(clerk_id);
CREATE INDEX IF NOT EXISTS email_idx ON users(email);
CREATE INDEX IF NOT EXISTS online_idx ON users(is_online);

CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON conversations(created_by);
CREATE INDEX IF NOT EXISTS conversations_last_message_idx ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS conversation_user_idx ON conversation_members(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS user_conversation_idx ON conversation_members(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages(message_type);

CREATE INDEX IF NOT EXISTS message_language_idx ON message_translations(message_id, language);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx ON push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS typing_conversation_user_idx ON typing_indicators(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS typing_updated_at_idx ON typing_indicators(updated_at);

-- Add foreign key constraint for last_message_id (after messages table is created)
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message 
  FOREIGN KEY (last_message_id) REFERENCES messages(id);