/**
 * SENIOR DEVELOPER SYSTEM HEALTH CHECKER
 * Comprehensive system validation for Translation Messenger
 */

import { neon } from '@neondatabase/serverless';
import { FeatherlessTranslator } from './featherless';

export class SystemHealthChecker {
  private sql = neon(process.env.DATABASE_URL!);

  async checkDatabaseConnection(): Promise<{ status: 'healthy' | 'error', message: string }> {
    try {
      await this.sql`SELECT 1 as test`;
      return { status: 'healthy', message: 'Neon database connection successful' };
    } catch (error) {
      return { status: 'error', message: `Database connection failed: ${error}` };
    }
  }

  async checkDatabaseTables(): Promise<{ status: 'healthy' | 'error', tables: string[], message: string }> {
    try {
      const tables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      const requiredTables = [
        'users', 'conversations', 'conversation_members', 
        'messages', 'message_translations', 'push_subscriptions', 
        'typing_indicators'
      ];
      
      const existingTables = tables.map(t => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length === 0) {
        return { 
          status: 'healthy', 
          tables: existingTables, 
          message: `All ${requiredTables.length} required tables exist` 
        };
      } else {
        return { 
          status: 'error', 
          tables: existingTables, 
          message: `Missing tables: ${missingTables.join(', ')}` 
        };
      }
    } catch (error) {
      return { status: 'error', tables: [], message: `Table check failed: ${error}` };
    }
  }

  async checkFeatherlessAI(): Promise<{ status: 'healthy' | 'error', message: string }> {
    try {
      if (!process.env.FEATHERLESS_API_KEY) {
        return { status: 'error', message: 'FEATHERLESS_API_KEY not configured' };
      }

      const translator = new FeatherlessTranslator(process.env.FEATHERLESS_API_KEY);
      const testResult = await translator.translateText({
        text: 'Hello world',
        targetLanguage: 'es'
      });

      if (testResult.translatedText && testResult.confidence > 0) {
        return { status: 'healthy', message: 'Featherless.AI translation service operational' };
      } else {
        return { status: 'error', message: 'Featherless.AI test translation failed' };
      }
    } catch (error) {
      return { status: 'error', message: `Featherless.AI error: ${error}` };
    }
  }

  checkPushNotifications(): { status: 'healthy' | 'error', message: string } {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey) {
      return { status: 'error', message: 'VAPID keys not configured' };
    }

    if (publicKey.length < 80 || privateKey.length < 40) {
      return { status: 'error', message: 'VAPID keys appear to be invalid (too short)' };
    }

    return { 
      status: 'healthy', 
      message: `Push notifications configured with VAPID keys (subject: ${subject || 'default'})` 
    };
  }

  checkEnvironmentVariables(): { status: 'healthy' | 'error', missing: string[], message: string } {
    const required = [
      'DATABASE_URL',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'FEATHERLESS_API_KEY',
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length === 0) {
      return { status: 'healthy', missing: [], message: 'All required environment variables configured' };
    } else {
      return { 
        status: 'error', 
        missing, 
        message: `Missing environment variables: ${missing.join(', ')}` 
      };
    }
  }

  async runFullHealthCheck(): Promise<{
    overall: 'healthy' | 'error',
    checks: {
      environment: any,
      database: any,
      tables: any,
      featherless: any,
      pushNotifications: any
    }
  }> {
    console.log('🔍 Running comprehensive system health check...');

    const checks = {
      environment: this.checkEnvironmentVariables(),
      database: await this.checkDatabaseConnection(),
      tables: await this.checkDatabaseTables(),
      featherless: await this.checkFeatherlessAI(),
      pushNotifications: this.checkPushNotifications()
    };

    const hasErrors = Object.values(checks).some(check => check.status === 'error');
    const overall = hasErrors ? 'error' : 'healthy';

    console.log('\n📊 SYSTEM HEALTH REPORT:');
    console.log('========================');
    Object.entries(checks).forEach(([key, result]) => {
      const icon = result.status === 'healthy' ? '✅' : '❌';
      console.log(`${icon} ${key.toUpperCase()}: ${result.message}`);
    });
    console.log(`\n🎯 OVERALL STATUS: ${overall.toUpperCase()}`);

    return { overall, checks };
  }
}

// Export singleton instance
export const systemHealth = new SystemHealthChecker();