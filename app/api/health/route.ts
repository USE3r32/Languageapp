import { NextRequest, NextResponse } from 'next/server';
import { systemHealth } from '@/lib/system-health';

export async function GET(request: NextRequest) {
  try {
    const healthReport = await systemHealth.runFullHealthCheck();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: healthReport.overall,
      checks: healthReport.checks,
      version: '1.0.0',
      environment: process.env.NODE_ENV
    }, {
      status: healthReport.overall === 'healthy' ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      version: '1.0.0',
      environment: process.env.NODE_ENV
    }, {
      status: 500
    });
  }
}