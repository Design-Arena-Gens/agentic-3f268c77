import { NextRequest, NextResponse } from 'next/server';

interface EmailConfig {
  provider: string;
  email: string;
  password: string;
  imapHost: string;
  imapPort: string;
  maxEmails: string;
  autoUnsubscribe: boolean;
}

interface EmailData {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  headers: any;
}

interface EmailResult {
  id: string;
  from: string;
  subject: string;
  date: string;
  classification: 'marketing' | 'important';
  action: string;
  reason: string;
  unsubscribeLink?: string;
}

// Simulated email classification using pattern matching
function classifyEmail(email: EmailData): EmailResult {
  const subject = email.subject.toLowerCase();
  const from = email.from.toLowerCase();
  const body = email.body.toLowerCase();

  // Marketing indicators
  const marketingKeywords = [
    'unsubscribe', 'promotional', 'sale', 'discount', 'offer', 'deal',
    'newsletter', 'marketing', 'advertisement', 'promo', 'limited time',
    'buy now', 'shop now', 'exclusive', 'free shipping', 'save now',
    'special offer', 'subscribe', 'notification', 'update', 'digest'
  ];

  // Important indicators
  const importantKeywords = [
    'invoice', 'receipt', 'payment', 'account', 'security', 'alert',
    'verification', 'confirm', 'reset password', 'bank', 'statement',
    'bill', 'transaction', 'urgent', 'action required', 'contract',
    'meeting', 'appointment', 'deadline', 'legal', 'tax'
  ];

  let marketingScore = 0;
  let importantScore = 0;

  // Check for marketing keywords
  marketingKeywords.forEach(keyword => {
    if (subject.includes(keyword) || body.includes(keyword)) marketingScore++;
  });

  // Check for important keywords
  importantKeywords.forEach(keyword => {
    if (subject.includes(keyword) || body.includes(keyword)) importantScore++;
  });

  // Check sender patterns
  if (from.includes('noreply') || from.includes('no-reply') || from.includes('marketing')) {
    marketingScore += 2;
  }

  if (from.includes('admin') || from.includes('support') || from.includes('billing')) {
    importantScore += 2;
  }

  // Find unsubscribe link
  const unsubscribeMatch = body.match(/https?:\/\/[^\s]+unsubscribe[^\s]*/i);
  const unsubscribeLink = unsubscribeMatch ? unsubscribeMatch[0] : undefined;

  if (unsubscribeLink) {
    marketingScore += 3;
  }

  // Classify
  const isMarketing = marketingScore > importantScore;

  return {
    id: email.id,
    from: email.from,
    subject: email.subject,
    date: email.date,
    classification: isMarketing ? 'marketing' : 'important',
    action: isMarketing
      ? (unsubscribeLink ? 'Unsubscribe available' : 'Mark as spam or delete')
      : 'Keep and respond professionally if needed',
    reason: isMarketing
      ? `Marketing email detected (score: ${marketingScore}). Contains promotional content.`
      : `Important email detected (score: ${importantScore}). Requires attention.`,
    unsubscribeLink,
  };
}

// Generate demo emails for testing
function generateDemoEmails(count: number): EmailData[] {
  const demoEmails: EmailData[] = [
    {
      id: '1',
      from: 'newsletter@techcompany.com',
      subject: '🎉 Exclusive 50% OFF Sale - Limited Time!',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      body: 'Hi there! Don\'t miss our biggest sale of the year. Get 50% off all products. Shop now! Click here to unsubscribe: https://techcompany.com/unsubscribe?id=123',
      headers: {}
    },
    {
      id: '2',
      from: 'billing@yourbank.com',
      subject: 'Your Monthly Statement is Ready',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      body: 'Your bank statement for this month is now available. Please review your transactions. Contact us if you have any questions.',
      headers: {}
    },
    {
      id: '3',
      from: 'noreply@deals.com',
      subject: 'Today Only: Free Shipping on Everything!',
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      body: 'Amazing deal alert! Free shipping on all orders today only. Don\'t wait! Unsubscribe here: https://deals.com/unsubscribe',
      headers: {}
    },
    {
      id: '4',
      from: 'support@company.com',
      subject: 'Security Alert: New Login Detected',
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      body: 'We detected a new login to your account from a new device. If this wasn\'t you, please reset your password immediately.',
      headers: {}
    },
    {
      id: '5',
      from: 'marketing@fashion.com',
      subject: 'New Arrivals You\'ll Love ❤️',
      date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      body: 'Check out our latest collection! Spring fashion is here. Browse now and enjoy exclusive discounts. Unsubscribe: https://fashion.com/unsub',
      headers: {}
    },
    {
      id: '6',
      from: 'admin@workspace.com',
      subject: 'Action Required: Verify Your Account',
      date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      body: 'Your account verification is pending. Please verify your email address within 24 hours to maintain access to your account.',
      headers: {}
    },
  ];

  // Repeat and modify emails to reach requested count
  const emails: EmailData[] = [];
  for (let i = 0; i < count; i++) {
    const template = demoEmails[i % demoEmails.length];
    emails.push({
      ...template,
      id: `${i + 1}`,
      date: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
    });
  }

  return emails;
}

export async function POST(request: NextRequest) {
  try {
    const config: EmailConfig = await request.json();

    // In a real implementation, you would connect to IMAP here
    // For demo purposes, we'll generate sample emails
    const maxEmails = Math.min(parseInt(config.maxEmails) || 50, 100);
    const emails = generateDemoEmails(maxEmails);

    // Classify each email
    const results = emails.map(email => classifyEmail(email));

    // Calculate stats
    const stats = {
      total: results.length,
      marketing: results.filter(r => r.classification === 'marketing').length,
      important: results.filter(r => r.classification === 'important').length,
      unsubscribed: config.autoUnsubscribe
        ? results.filter(r => r.classification === 'marketing' && r.unsubscribeLink).length
        : 0,
    };

    // Simulate auto-unsubscribe (in real implementation, would make HTTP requests)
    if (config.autoUnsubscribe) {
      results.forEach(result => {
        if (result.classification === 'marketing' && result.unsubscribeLink) {
          result.action = 'Successfully unsubscribed';
        }
      });
    }

    return NextResponse.json({ results, stats });
  } catch (error) {
    console.error('Error analyzing emails:', error);
    return NextResponse.json(
      { error: 'Failed to analyze emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
