import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status === 'paid') {
          await handleSuccessfulPayment(session);
        }
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleExpiredPayment(session);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleFailedPayment(paymentIntent);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    const { purchaseId, userId } = session.metadata || {};
    
    if (!purchaseId || !userId) {
      console.error('Missing metadata in successful payment session:', session.id);
      return;
    }

    // This function is no longer needed as ebooks have been removed
    console.log(`Payment ${purchaseId} completed successfully for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handleExpiredPayment(session: Stripe.Checkout.Session) {
  try {
    const { purchaseId } = session.metadata || {};
    
    if (!purchaseId) {
      console.error('Missing purchaseId in expired payment session:', session.id);
      return;
    }

    // This function is no longer needed as ebooks have been removed
    console.log(`Purchase ${purchaseId} expired`);
    
  } catch (error) {
    console.error('Error handling expired payment:', error);
    throw error;
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    // This function is no longer needed as ebooks have been removed
    console.log(`Payment ${paymentIntent.id} failed`);
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}
