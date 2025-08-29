import { db, users, conversations, conversationMembers, messages, messageTranslations, pushSubscriptions, typingIndicators } from './db';
import { eq, desc, and, or, sql, inArray, ilike, ne } from 'drizzle-orm';

export interface CreateConversationData {
  name?: string;
  isGroup: boolean;
  memberIds: string[];
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  originalLanguage?: string;
}

export interface MessageWithSender {
  id: string;
  content: string;
  translatedContent?: string;
  senderId: string;
  senderName: string;
  senderImageUrl?: string;
  timestamp: Date;
  originalLanguage?: string;
  targetLanguage?: string;
  isTranslated: boolean;
}

export interface ConversationWithLastMessage {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface SearchableUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  isOnline: boolean | null;
  lastSeen?: Date | null;
}

export class DatabaseService {
  // User Management
  static async syncUser(clerkId: string, userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }) {
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        const [updatedUser] = await db
          .update(users)
          .set({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            imageUrl: userData.imageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId))
          .returning();

        return updatedUser;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            clerkId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            imageUrl: userData.imageUrl,
            preferredLanguage: 'en',
          })
          .returning();

        return newUser;
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      throw error;
    }
  }

  static async getUserByClerkId(clerkId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  static async getConversationMembers(conversationId: string) {
    try {
      const members = await db
        .select({
          id: users.id,
          clerkId: users.clerkId,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
          preferredLanguage: users.preferredLanguage,
          isAdmin: conversationMembers.isAdmin,
        })
        .from(conversationMembers)
        .innerJoin(users, eq(conversationMembers.userId, users.id))
        .where(eq(conversationMembers.conversationId, conversationId));

      return members;
    } catch (error) {
      console.error('Error getting conversation members:', error);
      throw error;
    }
  }

  static async updateUserLanguage(clerkId: string, preferredLanguage: string) {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          preferredLanguage,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user language:', error);
      throw error;
    }
  }

  static async updateUserOnlineStatus(clerkId: string, isOnline: boolean) {
    try {
      await db
        .update(users)
        .set({
          isOnline,
          lastSeen: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId));
    } catch (error) {
      console.error('Error updating user online status:', error);
      throw error;
    }
  }

  static async searchUsers(query: string, currentUserClerkId: string, limit: number = 20): Promise<SearchableUser[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;

      const foundUsers = await db
        .select({
          id: users.id,
          clerkId: users.clerkId,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(
          and(
            ne(users.clerkId, currentUserClerkId), // Exclude current user
            or(
              ilike(users.email, searchTerm),
              ilike(users.firstName, searchTerm),
              ilike(users.lastName, searchTerm),
              sql`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE ${searchTerm}`
            )
          )
        )
        .limit(limit)
        .orderBy(users.isOnline, users.firstName, users.lastName);

      return foundUsers;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  static async getAllUsers(currentUserClerkId: string, limit: number = 50): Promise<SearchableUser[]> {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          clerkId: users.clerkId,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(ne(users.clerkId, currentUserClerkId)) // Exclude current user
        .limit(limit)
        .orderBy(users.isOnline, users.firstName, users.lastName);

      return allUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // MESSENGER-STYLE DIRECT MESSAGING: Find or create 1-on-1 conversation
  static async findOrCreateDirectConversation(userClerkId: string, targetEmail: string) {
    try {
      const user = await this.getUserByClerkId(userClerkId);
      if (!user) throw new Error('User not found');

      const targetUser = await this.getUserByEmail(targetEmail);
      if (!targetUser) throw new Error('Target user not found');

      // Don't allow messaging yourself
      if (user.id === targetUser.id) {
        throw new Error('Cannot message yourself');
      }

      // Check if direct conversation already exists between these two users
      const existingConversation = await db
        .select({
          id: conversations.id,
          name: conversations.name,
          isGroup: conversations.isGroup,
        })
        .from(conversations)
        .innerJoin(conversationMembers, eq(conversations.id, conversationMembers.conversationId))
        .where(
          and(
            eq(conversations.isGroup, false),
            eq(conversationMembers.userId, user.id)
          )
        );

      // Filter to find conversation with exactly these two users
      for (const conv of existingConversation) {
        const members = await db
          .select({ userId: conversationMembers.userId })
          .from(conversationMembers)
          .where(eq(conversationMembers.conversationId, conv.id));

        const memberIds = members.map(m => m.userId);
        if (memberIds.length === 2 &&
            memberIds.includes(user.id) &&
            memberIds.includes(targetUser.id)) {
          return conv;
        }
      }

      // Create new direct conversation with smart naming
      const userName = user.firstName || user.email.split('@')[0];
      const targetUserName = targetUser.firstName || targetUser.email.split('@')[0];

      // Smart conversation name showing language bridge
      const userLang = user.preferredLanguage || 'en';
      const targetLang = targetUser.preferredLanguage || 'en';

      let conversationName;
      if (userLang !== targetLang) {
        // Show language bridge for different languages
        const langMap: { [key: string]: string } = {
          'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
          'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳'
        };
        const userFlag = langMap[userLang] || '🌍';
        const targetFlag = langMap[targetLang] || '🌍';
        conversationName = `${userName} ${userFlag} ↔ ${targetFlag} ${targetUserName}`;
      } else {
        conversationName = `${userName} & ${targetUserName}`;
      }

      const [newConversation] = await db
        .insert(conversations)
        .values({
          name: conversationName,
          isGroup: false,
          createdBy: user.id,
        })
        .returning();

      // Add both users as members
      await db.insert(conversationMembers).values([
        {
          conversationId: newConversation.id,
          userId: user.id,
          isAdmin: false,
        },
        {
          conversationId: newConversation.id,
          userId: targetUser.id,
          isAdmin: false,
        }
      ]);

      return newConversation;
    } catch (error) {
      console.error('Error finding/creating direct conversation:', error);
      throw error;
    }
  }

  // Conversation Management
  static async createConversation(creatorClerkId: string, data: CreateConversationData) {
    try {
      const creator = await this.getUserByClerkId(creatorClerkId);
      if (!creator) throw new Error('Creator not found');

      // Create conversation
      const [conversation] = await db
        .insert(conversations)
        .values({
          name: data.name,
          isGroup: data.isGroup,
          createdBy: creator.id,
        })
        .returning();

      // Add creator as member
      await db.insert(conversationMembers).values({
        conversationId: conversation.id,
        userId: creator.id,
        isAdmin: true,
      });

      // Add other members
      for (const memberClerkId of data.memberIds) {
        const member = await this.getUserByClerkId(memberClerkId);
        if (member) {
          await db.insert(conversationMembers).values({
            conversationId: conversation.id,
            userId: member.id,
            isAdmin: false,
          });
        }
      }

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  static async getUserConversations(clerkId: string): Promise<ConversationWithLastMessage[]> {
    try {
      const user = await this.getUserByClerkId(clerkId);
      if (!user) return [];

      const userConversations = await db
        .select({
          id: conversations.id,
          name: conversations.name,
          isGroup: conversations.isGroup,
          lastMessageAt: conversations.lastMessageAt,
          lastMessageId: conversations.lastMessageId,
          lastReadAt: conversationMembers.lastReadAt,
        })
        .from(conversations)
        .innerJoin(conversationMembers, eq(conversations.id, conversationMembers.conversationId))
        .where(eq(conversationMembers.userId, user.id))
        .orderBy(desc(conversations.lastMessageAt));

      // Get last messages and unread counts
      const conversationsWithDetails = await Promise.all(
        userConversations.map(async (conv) => {
          let lastMessage = '';
          let unreadCount = 0;

          if (conv.lastMessageId) {
            const [lastMsg] = await db
              .select({
                content: messages.content,
                senderId: messages.senderId,
                senderName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
              })
              .from(messages)
              .innerJoin(users, eq(messages.senderId, users.id))
              .where(eq(messages.id, conv.lastMessageId))
              .limit(1);

            if (lastMsg) {
              const isOwn = lastMsg.senderId === user.id;
              lastMessage = isOwn ? `You: ${lastMsg.content}` : `${lastMsg.senderName}: ${lastMsg.content}`;
            }
          }

          // Count unread messages
          if (conv.lastReadAt) {
            const [unreadResult] = await db
              .select({ count: sql<number>`count(*)` })
              .from(messages)
              .where(
                and(
                  eq(messages.conversationId, conv.id),
                  sql`${messages.createdAt} > ${conv.lastReadAt}`
                )
              );
            unreadCount = unreadResult?.count || 0;
          }

          return {
            id: conv.id,
            name: conv.name || 'Unnamed Chat',
            isGroup: conv.isGroup ?? false,
            lastMessage: lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage,
            lastMessageTime: conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }) : undefined,
            unreadCount,
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Message Management
  static async sendMessage(senderClerkId: string, data: SendMessageData) {
    try {
      const sender = await this.getUserByClerkId(senderClerkId);
      if (!sender) throw new Error('Sender not found');

      // Verify user is member of conversation
      const membership = await db
        .select()
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, data.conversationId),
            eq(conversationMembers.userId, sender.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new Error('User is not a member of this conversation');
      }

      // Create message
      const [message] = await db
        .insert(messages)
        .values({
          conversationId: data.conversationId,
          senderId: sender.id,
          content: data.content,
          originalLanguage: data.originalLanguage || 'auto',
        })
        .returning();

      // Update conversation with last message
      await db
        .update(conversations)
        .set({ 
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
          updatedAt: new Date() 
        })
        .where(eq(conversations.id, data.conversationId));

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async getConversationMessages(conversationId: string, clerkId: string): Promise<MessageWithSender[]> {
    try {
      const user = await this.getUserByClerkId(clerkId);
      if (!user) throw new Error('User not found');

      // Verify user is member of conversation
      const membership = await db
        .select()
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, user.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new Error('User is not a member of this conversation');
      }

      // Get messages with sender info
      const conversationMessages = await db
        .select({
          id: messages.id,
          content: messages.content,
          translatedContent: messages.translatedContent,
          senderId: messages.senderId,
          senderFirstName: users.firstName,
          senderLastName: users.lastName,
          senderImageUrl: users.imageUrl,
          createdAt: messages.createdAt,
          originalLanguage: messages.originalLanguage,
          targetLanguage: messages.targetLanguage,
          isTranslated: messages.isTranslated,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      // Update last read timestamp
      await db
        .update(conversationMembers)
        .set({ lastReadAt: new Date() })
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, user.id)
          )
        );

      return conversationMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        translatedContent: msg.translatedContent || undefined,
        senderId: msg.senderId || '',
        senderName: `${msg.senderFirstName || ''} ${msg.senderLastName || ''}`.trim() || 'Unknown User',
        senderImageUrl: msg.senderImageUrl || undefined,
        timestamp: msg.createdAt || new Date(),
        originalLanguage: msg.originalLanguage || undefined,
        targetLanguage: msg.targetLanguage || undefined,
        isTranslated: msg.isTranslated ?? false,
      }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  static async getMessageById(messageId: string) {
    try {
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      return message;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      throw error;
    }
  }

  static async updateMessageTranslation(messageId: string, translatedContent: string, targetLanguage: string) {
    try {
      const [updatedMessage] = await db
        .update(messages)
        .set({
          translatedContent,
          targetLanguage,
          isTranslated: true,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId))
        .returning();

      return updatedMessage;
    } catch (error) {
      console.error('Error updating message translation:', error);
      throw error;
    }
  }

  static async saveMessageTranslation(messageId: string, language: string, translatedText: string, confidence?: number) {
    try {
      const [translation] = await db
        .insert(messageTranslations)
        .values({
          messageId,
          language,
          translatedText,
          confidence,
        })
        .returning();

      return translation;
    } catch (error) {
      console.error('Error saving message translation:', error);
      throw error;
    }
  }

  static async getMessageTranslation(messageId: string, language: string) {
    try {
      const [translation] = await db
        .select()
        .from(messageTranslations)
        .where(
          and(
            eq(messageTranslations.messageId, messageId),
            eq(messageTranslations.language, language)
          )
        )
        .limit(1);

      return translation;
    } catch (error) {
      console.error('Error getting message translation:', error);
      throw error;
    }
  }

  // Push Notifications
  static async savePushSubscription(userId: string, subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }) {
    try {
      const user = await this.getUserByClerkId(userId);
      if (!user) throw new Error('User not found');

      // Remove existing subscriptions for this endpoint
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

      // Insert new subscription
      const [newSubscription] = await db
        .insert(pushSubscriptions)
        .values({
          userId: user.id,
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          userAgent: subscription.userAgent,
        })
        .returning();

      return newSubscription;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  static async getUserPushSubscriptions(userId: string) {
    try {
      const user = await this.getUserByClerkId(userId);
      if (!user) return [];

      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, user.id),
            eq(pushSubscriptions.isActive, true)
          )
        );

      return subscriptions;
    } catch (error) {
      console.error('Error getting user push subscriptions:', error);
      throw error;
    }
  }

  // Typing Indicators
  static async setTypingIndicator(conversationId: string, userId: string, isTyping: boolean) {
    try {
      const user = await this.getUserByClerkId(userId);
      if (!user) throw new Error('User not found');

      if (isTyping) {
        // Insert or update typing indicator
        await db
          .insert(typingIndicators)
          .values({
            conversationId,
            userId: user.id,
            isTyping: true,
          })
          .onConflictDoUpdate({
            target: [typingIndicators.conversationId, typingIndicators.userId],
            set: {
              isTyping: true,
              updatedAt: new Date(),
            },
          });
      } else {
        // Remove typing indicator
        await db
          .delete(typingIndicators)
          .where(
            and(
              eq(typingIndicators.conversationId, conversationId),
              eq(typingIndicators.userId, user.id)
            )
          );
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  static async getTypingUsers(conversationId: string) {
    try {
      const typingUsers = await db
        .select({
          userId: users.id,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          userImage: users.imageUrl,
        })
        .from(typingIndicators)
        .innerJoin(users, eq(typingIndicators.userId, users.id))
        .where(
          and(
            eq(typingIndicators.conversationId, conversationId),
            eq(typingIndicators.isTyping, true),
            sql`${typingIndicators.updatedAt} > NOW() - INTERVAL '10 seconds'`
          )
        );

      return typingUsers;
    } catch (error) {
      console.error('Error getting typing users:', error);
      throw error;
    }
  }
}