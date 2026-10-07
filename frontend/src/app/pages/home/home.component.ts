import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { TreatmentService } from '../../models/spa.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-backdrop"></div>
      <div class="container hero-content">
        <span class="hero-tag">Purely Chemical-Free • Botanical Sanctuary</span>
        <h1 class="hero-title">
          Where Ancient Herbs Awaken Hair, Skin & Soul.
        </h1>
        <p class="hero-subtitle">
          Step into a serene world free of synthetic perfumes, sulfates, ammonia, and harsh chemicals. 
          Every treatment is custom-decocted with organic roots, medicinal leaves, and fresh botanical essences.
        </p>
        
        <div class="hero-cta-group">
          <a routerLink="/services" class="btn btn-primary btn-lg">
            Explore Treatment Rituals
          </a>
          <a routerLink="/diagnostic" class="btn btn-outline btn-lg diagnostic-cta-btn">
            <span>✨ Take Diagnostic Assessment</span>
          </a>
        </div>

        <div class="hero-badges">
          <div class="hero-badge-item">
            <span class="badge-dot"></span> 100% Certified Organic Botanicals
          </div>
          <div class="hero-badge-item">
            <span class="badge-dot"></span> Trichologist-Led Scalp Restorations
          </div>
          <div class="hero-badge-item">
            <span class="badge-dot"></span> Square POS Friction-Free Appointments
          </div>
        </div>
      </div>
    </section>

    <!-- Botanical Philosophy Section -->
    <section class="section-padding philosophy-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Our Foundational Truth</span>
          <h2 class="section-title">The Purity Standard</h2>
          <p class="section-subtitle">
            Most modern salons trade temporary cosmetic illusion for long-term barrier damage. 
            We do the exact opposite.
          </p>
          <div class="botanical-divider">🌿</div>
        </div>

        <div class="grid-3 pillars-grid">
          <div class="luxury-card pillar-card">
            <div class="pillar-icon">🌱</div>
            <h3>Whole Plant Decoctions</h3>
            <p>
              We don't buy synthetic isolates or water-diluted extracts. Whole chamomile, wild arnica, bhringraj, and frankincense are slow-infused in cold-pressed virgin seed oils.
            </p>
          </div>

          <div class="luxury-card pillar-card">
            <div class="pillar-icon">🫧</div>
            <h3>Zero Synthetic Chemistry</h3>
            <p>
              Every formula that touches your hair or skin is strictly free from PPD, resorcinol, ammonia, artificial fragrance, dimethicone, parabens, and endocrine disruptors.
            </p>
          </div>

          <div class="luxury-card pillar-card">
            <div class="pillar-icon">🏺</div>
            <h3>Bespoke Diagnosis First</h3>
            <p>
              No two scalps or skin barriers are identical. Before your hands touch our treatment chair, our practitioners analyze your hormonal rhythms, seasonal exposure, and stress load.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Services / Rituals -->
    <section class="section-padding rituals-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Curated Holistic Care</span>
          <h2 class="section-title">Signature Herbal Rituals</h2>
          <p class="section-subtitle">
            Immersive experiences designed to detoxify, repair, and replenish.
          </p>
          <div class="botanical-divider">⚜️</div>
        </div>

        <div class="grid-3 rituals-grid">
          <div *ngFor="let s of featuredServices" class="luxury-card ritual-card">
            <div class="ritual-category-badge">
              {{ s.category | uppercase }}
            </div>
            <h3 class="ritual-title">{{ s.name }}</h3>
            <p class="ritual-subtitle">{{ s.subtitle }}</p>

            <div class="ritual-meta">
              <span>⏱️ {{ s.durationMinutes }} mins</span>
              <span class="price-tag">$\{{ s.price }}</span>
            </div>

            <p class="ritual-desc">{{ s.description }}</p>

            <div class="herbs-used">
              <span class="herbs-label">Active Botanicals:</span>
              <div class="herbs-chips">
                <span *ngFor="let herb of s.herbalIngredients.slice(0, 3)" class="badge badge-sage">
                  {{ herb }}
                </span>
              </div>
            </div>

            <div class="card-action-row">
              <a [routerLink]="['/services']" [fragment]="s.id" class="btn btn-outline btn-sm">
                View Full Ritual
              </a>
              <button class="btn btn-primary btn-sm" (click)="quickBook(s)">
                Book Now
              </button>
            </div>
          </div>
        </div>

        <div class="view-all-services">
          <a routerLink="/services" class="btn btn-secondary btn-lg">
            View All Rituals & Treatments →
          </a>
        </div>
      </div>
    </section>

    <!-- Interactive Diagnostic Banner -->
    <section class="diagnostic-banner-section">
      <div class="container">
        <div class="diagnostic-box">
          <div class="diagnostic-content">
            <span class="section-tag">Interactive Consultation</span>
            <h2>Not Sure Which Herbal Ritual Your Body Needs?</h2>
            <p>
              Take our friendly, 2-minute diagnostic questionnaire. Tell us about your scalp balance, 
              skin reactions, or muscular stress, and our herbal algorithm will recommend a personalized 
              botanical prescription before you even arrive.
            </p>
            <div class="diagnostic-features">
              <div>✓ Analyzes hair, scalp, facial barrier & nervous tension</div>
              <div>✓ Recommends targeted whole-plant therapies</div>
              <div>✓ Seamless 1-click booking synchronization with Square POS</div>
            </div>
            <a routerLink="/diagnostic" class="btn btn-secondary btn-lg">
              Begin Your Diagnostic Assessment →
            </a>
          </div>
          <div class="diagnostic-visual">
            <div class="herbal-compass">
              <div class="compass-circle">
                <span class="compass-item top">🌿 Scalp & Hair</span>
                <span class="compass-item right">🌸 Skin Barrier</span>
                <span class="compass-item bottom">🍃 Nervous Reset</span>
                <span class="compass-item left">☀️ Whole Herbs</span>
                <div class="center-heart">AURA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Real Customer Testimonials -->
    <section class="section-padding testimonials-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Guest Experiences</span>
          <h2 class="section-title">Words From Our Sanctuary</h2>
          <p class="section-subtitle">
            Authentic reflections from guests who chose pure botanicals over chemical shortcuts.
          </p>
          <div class="botanical-divider">🌿</div>
        </div>

        <div class="grid-2 testimonials-grid">
          <div *ngFor="let t of spaService.testimonials" class="luxury-card testimonial-card">
            <div class="stars">
              <span *ngFor="let star of [1,2,3,4,5]">★</span>
            </div>
            <blockquote class="quote-text">
              “{{ t.quote }}”
            </blockquote>
            <p class="detailed-review">
              {{ t.detailedReview }}
            </p>
            <div class="guest-info">
              <div class="guest-avatar">
                {{ t.guestName.substring(0, 1) }}
              </div>
              <div>
                <strong>{{ t.guestName }}</strong>
                <span class="guest-meta">{{ t.location }} • {{ t.treatmentName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Secondary Take-Home Apothecary Showcase -->
    <section class="section-padding apothecary-teaser-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Take Sanctuary Home</span>
          <h2 class="section-title">Certified Organic Apothecary</h2>
          <p class="section-subtitle">
            Formulated in micro-batches to support your salon results between visits. 
            Secondary to our rituals, pure to the drop.
          </p>
          <div class="botanical-divider">🍃</div>
        </div>

        <div class="grid-3 apothecary-grid">
          <div *ngFor="let p of featuredProducts" class="luxury-card product-card">
            <div class="product-visual-box">
              <span class="product-icon">🏺</span>
              <span class="product-size-chip">{{ p.size }}</span>
            </div>
            <div class="product-body">
              <h4 class="product-title">{{ p.name }}</h4>
              <p class="product-desc">{{ p.description }}</p>
              <div class="product-footer">
                <span class="product-price">$\{{ p.price }}</span>
                <button class="btn btn-outline btn-sm" (click)="addToBag(p)">
                  Add to Bag
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="apothecary-cta-row">
          <a routerLink="/shop" class="btn btn-outline">
            Browse Full Herbal Apothecary Line →
          </a>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  public spaService = inject(SpaDataService);

  public featuredServices: TreatmentService[] = this.spaService.services().filter(s => s.featured).slice(0, 3);
  public featuredProducts = this.spaService.products().slice(0, 3);

  public quickBook(service: TreatmentService) {
    this.spaService.activeBookingService.set(service);
    window.location.href = '/booking';
  }

  public addToBag(product: any) {
    this.spaService.addToCart(product, 1);
    const event = new CustomEvent('toggle-apothecary-cart');
    window.dispatchEvent(event);
  }
}
