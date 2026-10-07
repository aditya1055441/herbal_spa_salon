export interface TreatmentService {
  id: string;
  name: string;
  subtitle: string;
  category: 'hair' | 'skin' | 'body' | 'ritual';
  durationMinutes: number;
  price: number;
  herbalIngredients: string[];
  description: string;
  benefits: string[];
  ritualSteps: string[];
  suitableFor: string[];
  iconSvg?: string;
  featured?: boolean;
}

export interface QuestionChoice {
  text: string;
  tag: string;
  description?: string;
}

export interface DiagnosticQuestion {
  id: string;
  category: 'primary_concern' | 'hair_scalp' | 'skin_condition' | 'wellness_stress';
  title: string;
  subtitle: string;
  choices: QuestionChoice[];
}

export interface DiagnosticResult {
  primaryConcern: string;
  recommendedServices: TreatmentService[];
  recommendedProducts: HerbalProduct[];
  botanicalPrescriptionNotes: string[];
}

export interface HerbalProduct {
  id: string;
  name: string;
  botanicalCategory: 'elixir' | 'scalp_oil' | 'botanical_mist' | 'herbal_balm' | 'bath_soak';
  price: number;
  size: string;
  description: string;
  keyHerbs: string[];
  directions: string;
  rating: number;
  inStock: boolean;
}

export interface CartItem {
  product: HerbalProduct;
  quantity: number;
}

export interface AppointmentBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  date: string;
  timeSlot: string;
  specialistName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  healthNotes?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  squarePaymentId?: string;
  squareOrderId?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  guestName: string;
  location: string;
  treatmentName: string;
  rating: number;
  quote: string;
  detailedReview: string;
  date: string;
}

export interface CustomerOrder {
  id: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  squarePaymentId?: string;
  squareOrderId?: string;
  createdAt: string;
  status: 'confirmed' | 'dispatched' | 'delivered';
}
