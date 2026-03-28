import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Coupang Seller (Marketplace) API implementation
 * Used for product registration, inventory management, etc.
 */

const VENDOR_ID = process.env.COUPANG_VENDOR_ID || '';
const SELLER_ACCESS_KEY = process.env.COUPANG_SELLER_ACCESS_KEY || '';
const SELLER_SECRET_KEY = process.env.COUPANG_SELLER_SECRET_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'status';
  
  try {
    if (!SELLER_ACCESS_KEY || !SELLER_SECRET_KEY) {
      return NextResponse.json({ error: 'Seller API Credentials required' }, { status: 400 });
    }

    if (type === 'categories') {
      const categoryPath = '/v2/providers/openapi/apis/api/v1/categories';
      const result = await fetchSellerData('GET', categoryPath, '');
      return NextResponse.json(result);
    }

    if (type === 'shipping-places') {
      const shippingPath = '/v2/providers/seller_api/apis/api/v1/marketplace/shipping-places';
      const result = await fetchSellerData('GET', shippingPath, `vendorId=${VENDOR_ID}`);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Seller API Ready', vendorId: VENDOR_ID });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!SELLER_ACCESS_KEY || !SELLER_SECRET_KEY || !VENDOR_ID) {
      throw new Error('Seller API Credentials (Key, Secret, VendorID) are missing');
    }

    const body = await request.json();
    const { product, salePrice, displayCategoryCode } = body;

    // 1. Automatically fetch the first available shipping place
    const shippingPath = '/v2/providers/seller_api/apis/api/v1/marketplace/shipping-places';
    const shippingResult = await fetchSellerData('GET', shippingPath, `vendorId=${VENDOR_ID}`);
    
    // Pick the first shipping place or a default one
    const shippingPlaces = shippingResult.data?.content || [];
    if (shippingPlaces.length === 0) {
      throw new Error('판매자 센터에 등록된 출고지가 없습니다. 먼저 쿠팡 판매자 센터에서 출고지를 등록해주세요.');
    }
    const outboundCode = shippingPlaces[0].outboundShippingPlaceCode;

    // 2. Construct the registration payload
    const sellerProductPayload = {
      displayCategoryCode: displayCategoryCode || 123456, // Fallback if not selected
      sellerProductName: `[프리미엄] ${product.productName}`.substring(0, 100),
      vendorId: VENDOR_ID,
      salePrice: salePrice,

      maximumBuyCount: 99,
      outboundShippingPlaceCode: outboundCode,
      deliveryCompanyCode: 'KDEXP', 
      deliveryChargeType: 'FREE',
      deliveryTimeType: 'GENERAL',
      deliveryPeriod: 2,
      attributes: [], 
      items: [
        {
          itemName: '단일 상품',
          originalPrice: product.productPrice,
          salePrice: salePrice,
          maximumBuyCount: 99,
          stockQuantity: 100,
          pccNeeded: false,
          images: [{ imageOrder: 0, imageType: 'REPRESENTATIVE', vendorPath: product.productImage }],
          contents: [{ contentsType: 'HTML', content: `<div><img src="${product.productImage}" /></div>` }]
        }
      ]
    };

    const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
    const result = await fetchSellerData('POST', path, '', sellerProductPayload);

    return NextResponse.json({ 
      success: true, 
      sellerProductId: result.data || 'Success',
      message: 'Product registered successfully'
    });

  } catch (error: any) {
    console.error('Seller POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


/**
 * Common HMAC signature generator for Marketplace API
 */
async function generateSellerSignature(method: string, path: string, query: string) {
  const now = new Date();
  
  const yy = now.getUTCFullYear().toString().substring(2);
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = now.getUTCDate().toString().padStart(2, '0');
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const min = now.getUTCMinutes().toString().padStart(2, '0');
  const ss = now.getUTCSeconds().toString().padStart(2, '0');
  
  const timestamp = `${yy}${mm}${dd}T${hh}${min}${ss}Z`;
  const message = timestamp + method + path + query;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(SELLER_SECRET_KEY);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { timestamp, signature };
}

async function fetchSellerData(method: string, path: string, query: string, body?: any) {
  const url = `https://api-gateway.coupang.com${path}${query ? '?' + query : ''}`;
  const { timestamp, signature } = await generateSellerSignature(method, path, query);

  const authorization = `CEA algorithm=HmacSHA256, access-key=${SELLER_ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`;

  const fetchOptions: any = {
    method,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': authorization,
      'X-Requested-With': 'XMLHttpRequest'
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Seller API Error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

