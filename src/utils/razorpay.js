/**
 * Razorpay payment integration for subscription checkout
 */

export function initRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Create Razorpay payment order via backend
 */
export async function createOrder(amount, planType, billingCycle) {
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects paisa
        planType,
        billingCycle,
      }),
    });

    if (!response.ok) throw new Error('Failed to create order');
    return await response.json();
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}

/**
 * Handle Razorpay payment checkout
 */
export async function handlePaymentCheckout({
  orderId,
  amount,
  userEmail,
  userName,
  planType,
  onSuccess,
  onError,
}) {
  const razorpayLoaded = await initRazorpay();
  if (!razorpayLoaded) {
    onError('Failed to load Razorpay');
    return;
  }

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key', // Use env variable
    order_id: orderId,
    amount: amount * 100, // Razorpay expects paisa
    currency: 'INR',
    name: 'AkmEdu',
    description: `${planType} Subscription`,
    customer_notify: 1,
    prefill: {
      name: userName || '',
      email: userEmail || '',
    },
    theme: {
      color: '#0891b2', // Teal primary color
    },
    handler: async (response) => {
      try {
        // Verify payment with backend
        const verifyResponse = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });

        if (verifyResponse.ok) {
          const data = await verifyResponse.json();
          onSuccess(data);
        } else {
          onError('Payment verification failed');
        }
      } catch (error) {
        onError(error.message);
      }
    },
    modal: {
      confirm_close: true,
      ondismiss: () => {
        onError('Payment cancelled');
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

/**
 * Format amount for display
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate annual price with discount
 */
export function calculateAnnualPrice(monthlyPrice, discountPercent = 20) {
  const monthlyTotal = monthlyPrice * 12;
  const discount = (monthlyTotal * discountPercent) / 100;
  return monthlyTotal - discount;
}
