import { Injectable, signal, computed } from '@angular/core';
import { TreatmentService, DiagnosticQuestion, HerbalProduct, CartItem, AppointmentBooking, Testimonial, DiagnosticResult, CustomerOrder } from '../models/spa.model';

@Injectable({
  providedIn: 'root'
})
export class SpaDataService {
  private readonly STORAGE_BOOKINGS_KEY = 'aura_botanica_bookings';
  private readonly STORAGE_SERVICES_KEY = 'aura_botanica_services';
  private readonly STORAGE_PRODUCTS_KEY = 'aura_botanica_products';
  private readonly STORAGE_CART_KEY = 'aura_botanica_cart';
  private readonly STORAGE_ORDERS_KEY = 'aura_botanica_customer_orders';

  // Initial Services Data
  private initialServices: TreatmentService[] = [
    {
      id: 'srv-scalp-restoration',
      name: 'Ayurvedic Scalp & Follicle Restoration',
      subtitle: 'Ancient trichological ritual with steam-infused herb oil therapy',
      category: 'hair',
      durationMinutes: 75,
      price: 165,
      featured: true,
      herbalIngredients: ['Cold-pressed Bhringraj', 'Organic Brahmi', 'Sun-cured Amla', 'Wild Alpine Rosemary', 'Cold-pressed Jojoba'],
      description: 'A deeply meditative head, neck, and scalp therapy rooted in ancient herbal science. We infuse freshly decocted botanical oils warmed over botanical coals directly into the root follicles, melting away nervous tension while fortifying brittle strands without a single surfactant or silicone.',
      benefits: [
        'Stimulates micro-circulation to encourage healthy follicle density',
        'Relieves dry scalp irritation, flaking, and inflammation naturally',
        'Calms the parasympathetic nervous system through marma point release',
        'Imparts weightless mirror-shine using purely bio-active botanicals'
      ],
      ritualSteps: [
        'Herbal Consultation & Trichological Scalp Scope',
        'Acupressure Marma Point Release with warmed Bhringraj nectar',
        'Gentle botanical hair steam infused with mountain lavender',
        'Double herbal decoction rinse using soapnut (reetha) & shikakai',
        'Final cold rose hydrosol tonic mist and gentle air dry'
      ],
      suitableFor: ['Thinning hair', 'Dry scalp', 'Chemical overload', 'High stress & migraine tension']
    },
    {
      id: 'srv-herbal-gloss-henna',
      name: 'Pure Botanical Gloss & Henna Alchemy',
      subtitle: '100% chemical-free hair color and restorative protein conditioning',
      category: 'hair',
      durationMinutes: 90,
      price: 195,
      featured: true,
      herbalIngredients: ['Organic Rajasthan Henna', 'Wild Indigo Leaf', 'Cassia Obovata', 'Hibiscus Petal Powder', 'Chamomile Flowers'],
      description: 'Zero ammonia, zero PPD, zero metallic salts. Our master herbalists blend organic whole plant powders tailored to your specific hair shade—delivering rich multidimensional tones from warm honey chestnut to deep espresso, while simultaneously building keratin bonds.',
      benefits: [
        'Completely non-toxic hair coloring safe for sensitive scalps and expectant mothers',
        'Coats the hair cuticle in protective herbal tannins for exceptional tensile strength',
        'Naturally shields strands against UV degradation and environmental pollution',
        'Zero fading to brassy or synthetic orange undertones'
      ],
      ritualSteps: [
        'Color tone formulation with freshly ground dried botanicals',
        'Deep botanical prep cleanse with rosemary and horsetail tea',
        'Precision brush application of warm herbal paste',
        'Infrared gentle warmth activation',
        'Botanical cider rinse and cold-pressed camellia glaze'
      ],
      suitableFor: ['Gray coverage', 'Chemical-sensitive individuals', 'Dull or damaged hair', 'Luster restoration']
    },
    {
      id: 'srv-cedar-nettle-detox',
      name: 'Restorative Cedar & Wild Nettle Scalp Purifying',
      subtitle: 'Clarifying therapy for sluggish roots, excess sebum, and follicle congestion',
      category: 'hair',
      durationMinutes: 60,
      price: 135,
      featured: false,
      herbalIngredients: ['Wild-harvested Stinging Nettle', 'Cypress Needle Essence', 'Organic Horsetail', 'Fermented Wild Apple Cider', 'White Willow Bark'],
      description: 'A clarifying ritual designed to liberate follicles congested by silicone buildup and environmental pollutants. Natural salicin from willow bark gently dissolves dead cells while nettle and cedar invigorate the root matrix.',
      benefits: [
        'Breaks down stubborn synthetic product buildup and hard water minerals',
        'Balances overactive sebaceous activity without stripping moisture',
        'Fortifies hair root anchorage with bio-available plant silica'
      ],
      ritualSteps: [
        'Dry herbal scalp brush exfoliation',
        'Warm willow bark & nettle tincture soak',
        'Lymphatic scalp drainage massage',
        'Bio-fermented apple cider vinegar seal rinse'
      ],
      suitableFor: ['Oily scalp', 'Product buildup', 'Dull hair', 'Environmental pollution exposure']
    },
    {
      id: 'srv-calendula-frankincense-facial',
      name: 'Calendula & Frankincense Cellular Renewal Facial',
      subtitle: 'Regenerative organic facial for barrier repair and deep replenishment',
      category: 'skin',
      durationMinutes: 80,
      price: 185,
      featured: true,
      herbalIngredients: ['Biodynamic Calendula Petals', 'Wild Sacred Frankincense Resin', 'Marshmallow Root Mucilage', 'Elderberry Seed Oil', 'Centella Asiatica'],
      description: 'A luxurious healing ritual crafted for sensitized, sun-worn, or aging skin. We harvest whole organic calendula flowers and gently fold them with steam-distilled Oman frankincense. Enhances skin density and stimulates cellular longevity without harsh acids or retinoids.',
      benefits: [
        'Reinforces the delicate lipid barrier against transepidermal water loss',
        'Soothes visible redness, micro-inflammation, and dermal reactivity',
        'Firms and sculpts facial contours via lifting lymphatic drainage strokes',
        'Leaves skin supple, plump, and luminous with zero downtime'
      ],
      ritualSteps: [
        'Chamomile flower compress and gentle cleansing oil balm',
        'Marshmallow root warm herbal poultice compression',
        'Frankincense resin infused acupressure sculpting massage',
        'Fresh calendula blossom masque with cold rose quartz stones',
        'Centella moisture barrier sealant and elderberry eye nectar'
      ],
      suitableFor: ['Dry skin', 'Sensitive skin', 'Redness/Rosacea', 'Premature aging', 'Barrier compromise']
    },
    {
      id: 'srv-rose-otto-facial',
      name: 'Rose Otto & Camellia Radiance Elixir Facial',
      subtitle: 'Intensive hydration and luminous antioxidant infusion',
      category: 'skin',
      durationMinutes: 75,
      price: 175,
      featured: false,
      herbalIngredients: ['Bulgarian Rose Otto Hydrosol', 'Cold-pressed Camellia Oleifera', 'Gotu Kola Extract', 'Tremella Snow Mushroom', 'Sweet Violet Leaf'],
      description: 'Harnesses the vibration of 100% steam-distilled Bulgarian damask rose petals alongside wild tremella snow mushroom—nature’s bio-compatible alternative to hyaluronic acid. Quenches thirsty skin cells with profound multidimensional hydration.',
      benefits: [
        'Delivers moisture 400x denser than water via tremella polysaccharides',
        'Restores dewy glow and velvety texture to tired skin',
        'Diminishes fine dryness lines with pure essential lipid replenishment'
      ],
      ritualSteps: [
        'Rose hydrosol misting ceremony with gentle botanical milk cleanse',
        'Gotu kola enzymatic clarifying polish',
        'Gua Sha crystal sculpting using cold-pressed camellia seed oil',
        'Tremella and violet flower hydro-jelly herbal masque',
        'Final protective dew drops'
      ],
      suitableFor: ['Dehydrated skin', 'Frequent flyers', 'Dull complexions', 'Special occasions']
    },
    {
      id: 'srv-thyme-willow-facial',
      name: 'Raw Herbal Clarifying & Blemish Soothing Facial',
      subtitle: 'Purifying botanical care for congested, inflamed, or hormonal skin',
      category: 'skin',
      durationMinutes: 70,
      price: 155,
      featured: false,
      herbalIngredients: ['Wild Thyme Essential Water', 'French Green Clay', 'White Willow Bark', 'Organic Tea Tree Leaf', 'Licorice Root'],
      description: 'A targeted balancing ritual designed to clear pores and pacify breakouts without stripping the natural microbiome. Natural antimicrobial herbs calm angry cystic flare-ups and re-educate the skin toward equilibrium.',
      benefits: [
        'Absorbs impurities and toxic buildup without skin dryness',
        'Fades stubborn post-inflammatory hyperpigmentation with licorice root',
        'Calms immediate inflammation and irritation'
      ],
      ritualSteps: [
        'Purifying wild thyme steam infusion',
        'French green clay and willow bark clarifying mask',
        'Cooling tea tree and witch hazel compress',
        'Soothing licorice and aloe balancing emulsion'
      ],
      suitableFor: ['Acne-prone skin', 'Hormonal congestion', 'Blemish concerns', 'Excess oiliness']
    },
    {
      id: 'srv-warm-poultice-massage',
      name: 'Herbal Compression & Warm Poultice Massage',
      subtitle: 'Traditional heated muslin bundle ritual with sacred medicinal herbs',
      category: 'body',
      durationMinutes: 90,
      price: 210,
      featured: true,
      herbalIngredients: ['Organic Lemongrass', 'Wild Turmeric Root', 'Kaffir Lime Leaves', 'Pounded Ginger', 'Camphor Leaf', 'Cold-pressed Sesame Oil'],
      description: 'Heated steamed herbal bundles packed with wild aromatic medicinal herbs are pressed rhythmically along energy meridians. As the healing herbal oils permeate tired connective tissues, joint stiffness dissolves and deep muscular pain melts away.',
      benefits: [
        'Profound relief from chronic muscle soreness, stiffness, and joint inflammation',
        'Stimulates whole-body lymphatic drainage and toxic metabolite evacuation',
        'Improves vascular circulation while warming internal cold stagnation',
        'Envelopes the senses in a deeply restorative aromatherapeutic cocoon'
      ],
      ritualSteps: [
        'Herbal foot bath ritual with sea salt, ginger, and fresh mint',
        'Full-body warm botanical oil anointing strokes',
        'Steamed herbal poultice rhythmic pressing along major muscle chains',
        'Targeted spinal column and scapular warm compression',
        'Warm tea ceremony with spiced holy basil & lemongrass'
      ],
      suitableFor: ['Chronic muscle tension', 'Athletes', 'Fibromyalgia', 'Winter chill', 'Mental stress']
    },
    {
      id: 'srv-arnica-juniper-release',
      name: 'Wild Forest Arnica & Juniper Deep Release Bodywork',
      subtitle: 'Targeted deep tissue work with hand-foraged alpine healing botanicals',
      category: 'body',
      durationMinutes: 75,
      price: 180,
      featured: false,
      herbalIngredients: ['Wild Alpine Arnica Montana', 'Juniper Berry Essence', 'St. John’s Wort Red Oil', 'Black Spruce Needle', 'Warm Castor Oil'],
      description: 'A firm, restorative body treatment fusing deep tissue therapy with wild-foraged arnica and warming juniper berry. Eliminates lactic acid deposits and restores freedom of movement to bound myofascial tissue.',
      benefits: [
        'Eases structural tension in the neck, lower back, and hips',
        'Accelerates muscular recovery and micro-tear healing',
        'Balances sympathetic overload with grounding forest terpenes'
      ],
      ritualSteps: [
        'Dry bristle body brush to stimulate surface circulation',
        'Warm St. John’s wort and arnica oil application',
        'Slow myofascial deep work with trigger point holds',
        'Juniper and black spruce thermal towel compression'
      ],
      suitableFor: ['Deep tension', 'Sedentary desk workers', 'Post-workout fatigue', 'Postural fatigue']
    },
    {
      id: 'srv-sanctuary-full-immersion',
      name: 'The Sacred Botanical Reset (Full Sanctuary Ritual)',
      subtitle: 'Comprehensive 3-hour signature journey across scalp, skin, and body',
      category: 'ritual',
      durationMinutes: 180,
      price: 395,
      featured: true,
      herbalIngredients: ['Rare Sandalwood Extract', 'Damask Rose Otto', 'Bhringraj', 'Calendula', 'Warm Herbal Poultice Bundles', 'Dead Sea Mineral Mud'],
      description: 'The pinnacle of chemical-free holistic rejuvenation. Combines our signature Ayurvedic Scalp Restoration, the Calendula Cellular Facial, and the Steamed Herbal Poultice Massage into one uninterrupted three-hour sanctuary experience.',
      benefits: [
        'Complete mind-body-spirit equilibrium and biological reset',
        'Total skin barrier rehydration, scalp purification, and muscular bliss',
        'Accompanied by a bespoke herbal elixir tasting flight and take-home bath blend'
      ],
      ritualSteps: [
        'Welcome herbal elixir & sensory botanical consultation',
        '75-minute Warm Herbal Poultice Full-Body Massage',
        '60-minute Calendula & Frankincense Cellular Facial',
        '45-minute Ayurvedic Scalp & Hair Restoration Ritual',
        'Sound bowl resonance integration & grounding botanical tea'
      ],
      suitableFor: ['Special milestones', 'Burnout recovery', 'Ultimate bridal pampering', 'Deep wellness reset']
    }
  ];

  // Diagnostic Questions
  public readonly diagnosticQuestions: DiagnosticQuestion[] = [
    {
      id: 'q1',
      category: 'primary_concern',
      title: 'What brings you to our sanctuary today?',
      subtitle: 'Select the primary intention that resonates most with your body right now.',
      choices: [
        { text: 'Scalp & Hair Revival', tag: 'hair', description: 'Address thinning, chemical overload, dryness, or seeking pure herbal color.' },
        { text: 'Skin Radiance & Barrier Calming', tag: 'skin', description: 'Soothe redness, replenish deep hydration, or clear persistent congestion.' },
        { text: 'Deep Muscular Release & Nervous Reset', tag: 'body', description: 'Melt accumulated postural tension, chronic stiffness, and mental fatigue.' },
        { text: 'The Full Botanical Reset', tag: 'all', description: 'A complete holistic rejuvenation of head, skin, and body without chemicals.' }
      ]
    },
    {
      id: 'q2',
      category: 'hair_scalp',
      title: 'How does your scalp and hair currently feel?',
      subtitle: 'Our formulas are completely chemical-free and tailored to root biology.',
      choices: [
        { text: 'Dry, tight scalp with brittle, fragile strands', tag: 'dry_hair', description: 'Requires rich Ayurvedic lipid decoctions and soothing warmth.' },
        { text: 'Damaged by synthetic chemical dyes or hot tools', tag: 'damaged_color', description: 'Seeking pure henna/indigo botanical glazing and cuticle repair.' },
        { text: 'Congested, oily roots with flat or thinning volume', tag: 'oily_thinning', description: 'Needs wild nettle, willow bark clarifying, and follicle stimulation.' },
        { text: 'Balanced hair seeking organic defense and shine', tag: 'healthy_shine', description: 'Seeking maintenance of vital hair health with pure herbs.' }
      ]
    },
    {
      id: 'q3',
      category: 'skin_condition',
      title: 'Describe your facial skin state at this moment:',
      subtitle: 'We use whole botanical extractions rather than synthetic isolated acids.',
      choices: [
        { text: 'Reactive, red, or easily sensitized by weather & products', tag: 'sensitive_red', description: 'Responds best to cold-steeped calendula, marshmallow, and elderberry.' },
        { text: 'Dehydrated, dull, lacking plumpness and morning glow', tag: 'dull_dehydrated', description: 'Needs Bulgarian rose otto and tremella snow mushroom hydration.' },
        { text: 'Congested pores, occasional breakouts, or hormonal imbalances', tag: 'congested_acne', description: 'Benefits from French green clay, thyme, and wild willow bark.' },
        { text: 'Noticeable loss of firmness and fine expression lines', tag: 'aging_lines', description: 'Requires frankincense resin sculpting and centella cellular renewal.' }
      ]
    },
    {
      id: 'q4',
      category: 'wellness_stress',
      title: 'Where do you hold the weight of daily stress?',
      subtitle: 'Our herbal bodywork addresses both physical knots and parasympathetic tension.',
      choices: [
        { text: 'Upper neck, shoulders, and cervical spine stiffness', tag: 'upper_tension', description: 'Thrives under warm herbal poultice compression and lemongrass vapors.' },
        { text: 'Deep lower back, hips, or athletic muscle soreness', tag: 'lower_body', description: 'Needs wild alpine arnica, juniper berry, and deep myofascial release.' },
        { text: 'Mental fatigue, racing thoughts, and restless sleep', tag: 'insomnia_mind', description: 'Calls for Ayurvedic marma point release and lavender steam therapy.' },
        { text: 'General heaviness, sluggish lymphatic flow, water retention', tag: 'lymphatic', description: 'Wants dry bristle brushing and aromatic herbal steam cocooning.' }
      ]
    }
  ];

  // Secondary Take-Home Herbal Apothecary Products
  private initialProducts: HerbalProduct[] = [
    {
      id: 'prod-scalp-nectar',
      name: 'Sanctuary Follicle Nectar (Bhringraj & Rosemary Scalp Elixir)',
      botanicalCategory: 'scalp_oil',
      price: 54,
      size: '50 ml / 1.7 fl oz',
      description: 'Slow-infused over 21 days with organic bhringraj, wild alpine rosemary, and amla berries. Massaged into roots 2x weekly to invigorate follicle density and soothe dry scalp.',
      keyHerbs: ['Bhringraj Leaf', 'Wild Alpine Rosemary', 'Cold-Pressed Jojoba', 'Sun-cured Amla'],
      directions: 'Dispense 1 full pipette directly to dry scalp. Massage gently for 3-5 minutes. Leave overnight or rinse after 45 minutes.',
      rating: 4.9,
      inStock: true
    },
    {
      id: 'prod-petal-barrier-oil',
      name: 'Petal & Resin Barrier Restorative Face Oil',
      botanicalCategory: 'elixir',
      price: 68,
      size: '30 ml / 1.0 fl oz',
      description: 'A silky, fast-absorbing botanical nectar powered by Oman sacred frankincense and organic whole calendula flowers. Rebuilds the lipid mantle without clogging pores.',
      keyHerbs: ['Sacred Frankincense', 'Biodynamic Calendula', 'Elderberry Seed', 'Cold-Pressed Camellia'],
      directions: 'Warm 3 to 4 drops between palms. Press gently into clean, damp skin morning and night.',
      rating: 5.0,
      inStock: true
    },
    {
      id: 'prod-rose-hydrosol',
      name: 'Wild Damask Rose Botanical Hydrosol Mist',
      botanicalCategory: 'botanical_mist',
      price: 38,
      size: '100 ml / 3.4 fl oz',
      description: '100% pure copper-distilled organic Bulgarian rose petals. Balances skin pH, plumps dehydrated cells, and elevates your spirit with zero alcohol or synthetic fragrance.',
      keyHerbs: ['Organic Rosa Damascena Hydrosol', 'Plant Glycerin'],
      directions: 'Mist liberally over face, neck, and hair anytime skin needs moisture or sensory grounding.',
      rating: 4.8,
      inStock: true
    },
    {
      id: 'prod-arnica-balm',
      name: 'Alpine Arnica & Juniper Deep Relief Salve',
      botanicalCategory: 'herbal_balm',
      price: 46,
      size: '60 g / 2.1 oz',
      description: 'A comforting, concentrated herbal balm featuring wild-foraged arnica montana, black spruce, and alpine juniper. Relieves tight shoulders and sore joints on contact.',
      keyHerbs: ['Wild Alpine Arnica', 'Juniper Berry', 'St. John’s Wort', 'Organic Beeswax', 'Black Spruce'],
      directions: 'Warm a dime-sized amount between fingertips. Rub thoroughly into aching muscles, neck, or lower back.',
      rating: 4.9,
      inStock: true
    },
    {
      id: 'prod-detox-bath-soak',
      name: 'Herbal Earth Detox Bath Soak',
      botanicalCategory: 'bath_soak',
      price: 42,
      size: '350 g / 12.3 oz',
      description: 'Dead Sea mineral salts tumbled with wild clary sage, dried lavender buds, and crushed lemongrass. Melts away nervous fatigue and draws out bodily impurities.',
      keyHerbs: ['Dead Sea Salts', 'Wild Clary Sage', 'Dried Lavender Blossoms', 'Lemongrass Leaves'],
      directions: 'Add 1/2 cup to hot running bath water. Soak for 20-30 minutes and follow with warm herbal tea.',
      rating: 4.9,
      inStock: true
    }
  ];

  // Testimonials
  public readonly testimonials: Testimonial[] = [
    {
      id: 'test-1',
      guestName: 'Helena Vance',
      location: 'San Francisco, CA',
      treatmentName: 'Ayurvedic Scalp & Follicle Restoration',
      rating: 5,
      quote: 'My scalp has never felt this calm. After years of irritation from salon chemicals, Aura Botanica is a sanctuary.',
      detailedReview: 'I was skeptical that herbal oils could replace deep conditioning treatments, but the Ayurvedic ritual exceeded every expectation. My chronic flakey scalp disappeared after one visit, and the herbal scent lingered naturally for days without any artificial perfumes.',
      date: 'September 2026'
    },
    {
      id: 'test-2',
      guestName: 'Julian Mercer',
      location: 'Oakland, CA',
      treatmentName: 'Herbal Compression & Warm Poultice Massage',
      rating: 5,
      quote: 'The warm steamed herbal bundles dissolved months of desk fatigue and thoracic tension in 90 minutes.',
      detailedReview: 'As an architect hunched over drawings and CAD models, I carry unbearable stiffness in my shoulders. The aroma of lemongrass and ginger steaming in the treatment room set the tone immediately. The poultice work penetrated deeper than standard deep tissue ever has.',
      date: 'August 2026'
    },
    {
      id: 'test-3',
      guestName: 'Soraya Lindqvist',
      location: 'Marin County, CA',
      treatmentName: 'Calendula & Frankincense Cellular Renewal Facial',
      rating: 5,
      quote: 'Finally, a luxury facial for sensitive rosacea-prone skin that leaves you glowing instead of inflamed!',
      detailedReview: 'Traditional spas always pushed clinical acid peels that caused my rosacea to flare up. Here, everything was fresh, soothing, and purely botanical. The frankincense face massage transformed my jawline tension and left my skin baby soft.',
      date: 'July 2026'
    },
    {
      id: 'test-4',
      guestName: 'Eleanor Sterling',
      location: 'Berkeley, CA',
      treatmentName: 'Pure Botanical Gloss & Henna Alchemy',
      rating: 5,
      quote: '100% chemical-free hair color that completely covered my stubborn grays and left my hair like glass.',
      detailedReview: 'Finding a truly chemical-free salon without greenwashing is nearly impossible. The master herbalist blended henna and indigo right in front of me with warm botanical tea. My hair has incredible multidimensional rich tone without a single itch.',
      date: 'June 2026'
    }
  ];

  // Reactive Signals State
  public services = signal<TreatmentService[]>(this.loadServices());
  public products = signal<HerbalProduct[]>(this.loadProducts());
  public cart = signal<CartItem[]>(this.loadCart());
  public customerOrders = signal<CustomerOrder[]>(this.loadCustomerOrders());
  public bookings = signal<AppointmentBooking[]>(this.loadBookings());
  
  // Selected Service for Quick Booking or Modal
  public activeBookingService = signal<TreatmentService | null>(null);

  // Cart Computed Signals
  public cartItemCount = computed(() => 
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  public cartSubtotal = computed(() => 
    this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  );

  constructor() {}

  // Persistence helpers
  private loadCart(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_CART_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read cart from localStorage', e);
    }
    return [];
  }

  private saveCart() {
    try {
      localStorage.setItem(this.STORAGE_CART_KEY, JSON.stringify(this.cart()));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }

  private loadCustomerOrders(): CustomerOrder[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_ORDERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read customer orders from localStorage', e);
    }
    return [];
  }

  public recordCompletedOrder(order: CustomerOrder) {
    this.customerOrders.update(current => [order, ...current]);
    try {
      localStorage.setItem(this.STORAGE_ORDERS_KEY, JSON.stringify(this.customerOrders()));
    } catch (e) {
      console.warn('Could not save customer orders to localStorage', e);
    }
  }

  private loadServices(): TreatmentService[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_SERVICES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read services from localStorage', e);
    }
    return this.initialServices;
  }

  private loadProducts(): HerbalProduct[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_PRODUCTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read products from localStorage', e);
    }
    return this.initialProducts;
  }

  private loadBookings(): AppointmentBooking[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_BOOKINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read bookings from localStorage', e);
    }
    // Return sample confirmed bookings for schedule realism
    return [
      {
        id: 'bk-101',
        serviceId: 'srv-scalp-restoration',
        serviceName: 'Ayurvedic Scalp & Follicle Restoration',
        price: 165,
        durationMinutes: 75,
        date: '2026-10-12',
        timeSlot: '10:00 AM',
        specialistName: 'Elowen Reed (Herbal Trichologist)',
        guestName: 'Claire Dubois',
        guestEmail: 'claire.dubois@example.com',
        guestPhone: '(415) 555-0192',
        status: 'confirmed',
        createdAt: '2026-10-06T14:20:00.000Z'
      },
      {
        id: 'bk-102',
        serviceId: 'srv-warm-poultice-massage',
        serviceName: 'Herbal Compression & Warm Poultice Massage',
        price: 210,
        durationMinutes: 90,
        date: '2026-10-14',
        timeSlot: '02:30 PM',
        specialistName: 'Kaelen Thorne (Medicinal Herbalist)',
        guestName: 'Marcus Bennett',
        guestEmail: 'm.bennett@example.com',
        guestPhone: '(510) 555-0381',
        status: 'confirmed',
        createdAt: '2026-10-06T16:45:00.000Z'
      }
    ];
  }

  // Diagnostic Recommendation Engine
  public evaluateDiagnostic(answers: Record<string, string>): DiagnosticResult {
    const q1Tag = answers['q1'] || 'all';
    const q2Tag = answers['q2'] || 'healthy_shine';
    const q3Tag = answers['q3'] || 'sensitive_red';
    const q4Tag = answers['q4'] || 'upper_tension';

    const currentServices = this.services();
    const currentProducts = this.products();

    let matchedServices: TreatmentService[] = [];
    let matchedProducts: HerbalProduct[] = [];
    let notes: string[] = [];

    if (q1Tag === 'hair' || q2Tag === 'dry_hair' || q2Tag === 'damaged_color') {
      const hairService = currentServices.find(s => s.id === 'srv-scalp-restoration') || currentServices[0];
      const hennaService = currentServices.find(s => s.id === 'srv-herbal-gloss-henna') || currentServices[1];
      matchedServices.push(hairService, hennaService);
      
      const nectar = currentProducts.find(p => p.id === 'prod-scalp-nectar');
      if (nectar) matchedProducts.push(nectar);

      notes.push('Your hair and scalp require gentle lipid replenishment through warmed Ayurvedic herbs rather than detergents.');
      notes.push('Recommend avoiding all commercial sulfate and synthetic dimethicone products during your recovery cycle.');
    } else if (q1Tag === 'skin' || q3Tag === 'sensitive_red' || q3Tag === 'dull_dehydrated') {
      const facialService = currentServices.find(s => s.id === 'srv-calendula-frankincense-facial') || currentServices[3];
      const roseFacial = currentServices.find(s => s.id === 'srv-rose-otto-facial') || currentServices[4];
      matchedServices.push(facialService, roseFacial);

      const faceOil = currentProducts.find(p => p.id === 'prod-petal-barrier-oil');
      const mist = currentProducts.find(p => p.id === 'prod-rose-hydrosol');
      if (faceOil) matchedProducts.push(faceOil);
      if (mist) matchedProducts.push(mist);

      notes.push('Your epidermal barrier is primed for pure botanical infusions of cold-pressed calendula and sacred frankincense.');
      notes.push('Pure copper-distilled hydrosols will re-educate your skin to retain optimal intracellular hydration.');
    } else if (q1Tag === 'body' || q4Tag === 'upper_tension' || q4Tag === 'lower_body') {
      const poulticeService = currentServices.find(s => s.id === 'srv-warm-poultice-massage') || currentServices[6];
      const arnicaService = currentServices.find(s => s.id === 'srv-arnica-juniper-release') || currentServices[7];
      matchedServices.push(poulticeService, arnicaService);

      const arnicaBalm = currentProducts.find(p => p.id === 'prod-arnica-balm');
      const bathSoak = currentProducts.find(p => p.id === 'prod-detox-bath-soak');
      if (arnicaBalm) matchedProducts.push(arnicaBalm);
      if (bathSoak) matchedProducts.push(bathSoak);

      notes.push('Steamed herbal compression bundles will deliver anti-inflammatory botanicals straight into contracted myofascial fascia.');
      notes.push('A complementary Dead Sea soak infused with wild clary sage will continue releasing muscular knots at home.');
    } else {
      // Full Sanctuary Reset
      const fullReset = currentServices.find(s => s.id === 'srv-sanctuary-full-immersion') || currentServices[8];
      const scalpService = currentServices.find(s => s.id === 'srv-scalp-restoration') || currentServices[0];
      matchedServices.push(fullReset, scalpService);

      matchedProducts = currentProducts.slice(0, 3);
      notes.push('A whole-body holistic protocol harmonizing scalp follicles, facial radiance, and nervous system decompresion.');
      notes.push('Pure organic herbs work synergistically across all three bodily systems for profound biological renewal.');
    }

    return {
      primaryConcern: q1Tag.toUpperCase(),
      recommendedServices: matchedServices,
      recommendedProducts: matchedProducts,
      botanicalPrescriptionNotes: notes
    };
  }

  // Cart operations
  public addToCart(product: HerbalProduct, quantity: number = 1) {
    this.cart.update(currentItems => {
      const existing = currentItems.find(item => item.product.id === product.id);
      if (existing) {
        return currentItems.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...currentItems, { product, quantity }];
    });
    this.saveCart();
  }

  public updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cart.update(current => 
      current.map(item => item.product.id === productId ? { ...item, quantity } : item)
    );
    this.saveCart();
  }

  public removeFromCart(productId: string) {
    this.cart.update(current => current.filter(item => item.product.id !== productId));
    this.saveCart();
  }

  public clearCart() {
    this.cart.set([]);
    this.saveCart();
  }

  // Booking operations
  public createBooking(booking: Omit<AppointmentBooking, 'id' | 'createdAt'>): AppointmentBooking {
    const newBooking: AppointmentBooking = {
      ...booking,
      id: `bk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    this.bookings.update(current => [newBooking, ...current]);
    try {
      localStorage.setItem(this.STORAGE_BOOKINGS_KEY, JSON.stringify(this.bookings()));
    } catch (e) {
      console.warn('Could not save booking to localStorage', e);
    }
    return newBooking;
  }

  public updateBookingStatus(bookingId: string, status: AppointmentBooking['status']) {
    this.bookings.update(current => 
      current.map(b => b.id === bookingId ? { ...b, status } : b)
    );
    try {
      localStorage.setItem(this.STORAGE_BOOKINGS_KEY, JSON.stringify(this.bookings()));
    } catch (e) {
      console.warn('Could not save bookings to localStorage', e);
    }
  }

  // Service Management for Admin CMS
  public saveService(service: TreatmentService) {
    this.services.update(current => {
      const index = current.findIndex(s => s.id === service.id);
      if (index >= 0) {
        const copy = [...current];
        copy[index] = service;
        return copy;
      }
      return [...current, service];
    });
    localStorage.setItem(this.STORAGE_SERVICES_KEY, JSON.stringify(this.services()));
  }

  public deleteService(serviceId: string) {
    this.services.update(current => current.filter(s => s.id !== serviceId));
    localStorage.setItem(this.STORAGE_SERVICES_KEY, JSON.stringify(this.services()));
  }

  // Product Management for Admin CMS
  public saveProduct(product: HerbalProduct) {
    this.products.update(current => {
      const index = current.findIndex(p => p.id === product.id);
      if (index >= 0) {
        const copy = [...current];
        copy[index] = product;
        return copy;
      }
      return [...current, product];
    });
    localStorage.setItem(this.STORAGE_PRODUCTS_KEY, JSON.stringify(this.products()));
  }

  public deleteProduct(productId: string) {
    this.products.update(current => current.filter(p => p.id !== productId));
    localStorage.setItem(this.STORAGE_PRODUCTS_KEY, JSON.stringify(this.products()));
  }
}
