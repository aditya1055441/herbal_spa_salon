import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  receipt?: string;
  errorMessage?: string;
}

export interface RazorpayVerificationResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  message?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  private http = inject(HttpClient);

  public get backendUrl(): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return 'http://localhost:3000/api/razorpay';
    }
    return '/api/razorpay';
  }

  /**
   * Retrieves the public Razorpay Key ID from the backend server.
   * Note: The Key Secret is strictly maintained on the backend and never exposed.
   */
  public async getPublicConfig(): Promise<{ keyId: string; currency: string }> {
    try {
      const config = await firstValueFrom(
        this.http.get<{ keyId: string; currency: string }>(`${this.backendUrl}/config`)
      );
      return config;
    } catch (err) {
      // Fallback default test key ID from backend config
      return {
        keyId: 'rzp_test_TlHmBY5CY5RsrT',
        currency: 'INR'
      };
    }
  }

  /**
   * Requests backend server to create an official Razorpay order with Key Secret authentication.
   */
  public async createOrder(amount: number, currency: string = 'INR', notes?: any): Promise<RazorpayOrderResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<RazorpayOrderResponse>(`${this.backendUrl}/create-order`, {
          amount,
          currency,
          notes
        })
      );
      return response;
    } catch (err: any) {
      return {
        success: false,
        orderId: '',
        amount: Math.round(amount * 100),
        currency,
        keyId: 'rzp_test_TlHmBY5CY5RsrT',
        errorMessage: err?.error?.errorMessage || 'Could not initiate Razorpay order on server.'
      };
    }
  }

  /**
   * Verifies cryptographic HMAC-SHA256 signature on backend server.
   */
  public async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    paymentMethod: 'credit_card' | 'debit_card';
    cardDetails?: {
      cardholderName: string;
      last4: string;
      expiry: string;
    };
    customerDetails?: {
      name: string;
      email: string;
      phone?: string;
    };
  }): Promise<RazorpayVerificationResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<RazorpayVerificationResponse>(`${this.backendUrl}/verify-payment`, payload)
      );
      return response;
    } catch (err: any) {
      return {
        success: false,
        paymentId: payload.razorpay_payment_id,
        orderId: payload.razorpay_order_id,
        errorMessage: err?.error?.errorMessage || 'Payment signature verification failed.'
      };
    }
  }
}
