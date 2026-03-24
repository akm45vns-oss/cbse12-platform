/**
 * Backend API handlers for payment processing
 * 
 * These endpoints should be implemented in your backend:
 * - POST /api/create-order - Create Razorpay order
 * - POST /api/verify-payment - Verify payment signature
 * - POST /api/webhook/razorpay - Handle Razorpay webhooks
 */

import crypto from 'crypto';

/**
 * Create Razorpay Order
 * Endpoint: POST /api/create-order
 * Body: { amount, planType, billingCycle, userId, email }
 */
export async function createOrderHandler(req) {
  try {
    const { amount, planType, billingCycle, userId, email } = req.body;

    // Validate input
    if (!amount || !planType) {
      return { status: 400, error: 'Missing required fields' };
    }

    // Create order with Razorpay
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amount, // Already in paisa
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          plan_type: planType,
          billing_cycle: billingCycle,
          user_id: userId,
          email: email,
        },
      }),
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    const order = await orderResponse.json();
    return {
      status: 200,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    };
  } catch (error) {
    console.error('Order creation error:', error);
    return { status: 500, error: 'Failed to create order' };
  }
}

/**
 * Verify Payment Signature
 * Endpoint: POST /api/verify-payment
 * Body: { orderId, paymentId, signature, userId }
 */
export async function verifyPaymentHandler(req) {
  try {
    const { orderId, paymentId, signature, userId } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return { status: 400, error: 'Invalid payment signature' };
    }

    // Get payment details from Razorpay
    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      throw new Error('Failed to fetch payment details');
    }

    const payment = await paymentResponse.json();

    // Verify order amount
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    const order = await orderResponse.json();
    if (payment.amount !== order.amount) {
      return { status: 400, error: 'Amount mismatch' };
    }

    // Payment verified successfully
    // TODO: Save subscription to database
    const planType = order.notes.plan_type;
    const billingCycle = order.notes.billing_cycle;

    // Calculate subscription dates
    const startDate = new Date();
    let endDate = new Date();
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return {
      status: 200,
      data: {
        paymentId,
        orderId,
        planType,
        billingCycle,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        message: 'Payment verified successfully',
      },
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { status: 500, error: 'Failed to verify payment' };
  }
}

/**
 * Handle Razorpay Webhook
 * Endpoint: POST /api/webhook/razorpay
 * Verify webhook signature and process events
 */
export async function handleRazorpayWebhook(req) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('base64');

    if (generatedSignature !== signature) {
      return { status: 400, error: 'Invalid webhook signature' };
    }

    const event = req.body;

    // Handle different webhook events
    switch (event.event) {
      case 'payment.authorized':
        // Payment authorized, save subscription
        console.log('Payment authorized:', event.payload.payment);
        break;

      case 'payment.failed':
        // Payment failed, log for debugging
        console.log('Payment failed:', event.payload.payment);
        break;

      case 'refund.created':
        // Refund processed, cancel subscription
        console.log('Refund created:', event.payload.refund);
        // TODO: Cancel user subscription
        break;

      case 'subscription.activated':
        // Subscription activated
        console.log('Subscription activated:', event.payload.subscription);
        break;

      case 'subscription.paused':
        // Subscription paused
        console.log('Subscription paused:', event.payload.subscription);
        break;

      case 'subscription.cancelled':
        // Subscription cancelled
        console.log('Subscription cancelled:', event.payload.subscription);
        // TODO: Update subscription status in database
        break;

      case 'subscription.completed':
        // Subscription completed
        console.log('Subscription completed:', event.payload.subscription);
        break;
    }

    return { status: 200, data: { message: 'Webhook processed' } };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { status: 500, error: 'Failed to process webhook' };
  }
}

/**
 * Get subscription details
 * Endpoint: GET /api/subscriptions/:userId
 */
export async function getSubscriptionHandler(userId) {
  try {
    // TODO: Fetch from database
    // SELECT * FROM subscriptions WHERE user_id = userId AND cancelled_at IS NULL
    return {
      status: 200,
      data: {
        userId,
        tier: 'premium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { status: 500, error: 'Failed to fetch subscription' };
  }
}

/**
 * Cancel subscription
 * Endpoint: POST /api/subscriptions/:userId/cancel
 */
export async function cancelSubscriptionHandler(userId) {
  try {
    // TODO: Update database
    // UPDATE subscriptions SET cancelled_at = NOW() WHERE user_id = userId
    return {
      status: 200,
      data: { message: 'Subscription cancelled successfully' },
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { status: 500, error: 'Failed to cancel subscription' };
  }
}

export default {
  createOrderHandler,
  verifyPaymentHandler,
  handleRazorpayWebhook,
  getSubscriptionHandler,
  cancelSubscriptionHandler,
};
