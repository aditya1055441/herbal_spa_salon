import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { TreatmentService } from '../../models/spa.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Services Header Hero -->
    <section class="services-hero">
      <div class="container text-center">
        <span class="section-tag">Pure Plant Pharmacopoeia</span>
        <h1 class="services-hero-title">Treatment Rituals & Holistic Therapies</h1>
        <p class="services-hero-desc">
          Every session begins with whole medicinal leaves, roots, and flowers decocted fresh for your appointment. 
          Zero artificial preservatives, zero silicone coatings, zero synthetic ammonia or bleach.
        </p>

        <!-- Category Filters -->
        <div class="category-filter-nav">
          <button 
            [class.active]="selectedCategory() === 'all'" 
            (click)="setCategory('all')"
          >
            All Rituals ({{ spaService.services().length }})
          </button>
          <button 
            [class.active]="selectedCategory() === 'hair'" 
            (click)="setCategory('hair')"
          >
            🌿 Hair & Scalp Trichology
          </button>
          <button 
            [class.active]="selectedCategory() === 'skin'" 
            (click)="setCategory('skin')"
          >
            🌸 Facial Alchemy
          </button>
          <button 
            [class.active]="selectedCategory() === 'body'" 
            (click)="setCategory('body')"
          >
            🍃 Bodywork & Warm Poultice
          </button>
          <button 
            [class.active]="selectedCategory() === 'ritual'" 
            (click)="setCategory('ritual')"
          >
            ⚜️ Sacred Full Immersion
          </button>
        </div>
      </div>
    </section>

    <!-- Services Detailed List -->
    <section class="section-padding services-list-section">
      <div class="container">
        <!-- Helpful Questionnaire Prompt -->
        <div class="services-quiz-reminder">
          <div class="reminder-text">
            <strong>Uncertain which ritual aligns with your current hair or skin state?</strong>
            <span>Our 2-minute diagnostic assessment helps identify root causes before you book.</span>
          </div>
          <a routerLink="/diagnostic" class="btn btn-secondary btn-sm">
            Take Diagnostic Quiz →
          </a>
        </div>

        <div class="services-stack">
          <div 
            *ngFor="let s of filteredServices()" 
            [id]="s.id"
            class="luxury-card service-detail-card"
          >
            <div class="service-main-info">
              <div class="service-category-tag">
                {{ s.category | uppercase }} RITUAL • CERTIFIED CHEMICAL-FREE
              </div>
              <h2 class="service-title">{{ s.name }}</h2>
              <p class="service-subtitle">{{ s.subtitle }}</p>

              <div class="service-specs-strip">
                <span class="spec-item">⏱️ <strong>{{ s.durationMinutes }} minutes</strong></span>
                <span class="spec-divider">•</span>
                <span class="spec-item">💵 <strong>$\{{ s.price }} USD</strong></span>
                <span class="spec-divider">•</span>
                <span class="spec-item">🌿 <strong>100% Whole Herb Infused</strong></span>
              </div>

              <p class="service-narrative">{{ s.description }}</p>

              <!-- Herbal Ingredients Highlight -->
              <div class="ingredients-box">
                <h4>Decocted Medicinal Botanicals</h4>
                <div class="ingredients-list">
                  <span *ngFor="let ing of s.herbalIngredients" class="herb-tag">
                    🌱 {{ ing }}
                  </span>
                </div>
              </div>

              <!-- Ritual Steps Accordion/Journey -->
              <div class="ritual-journey-box">
                <h4>The Treatment Journey</h4>
                <ol class="steps-list">
                  <li *ngFor="let step of s.ritualSteps; let i = index">
                    <span class="step-num">{{ i + 1 }}</span>
                    <span class="step-desc">{{ step }}</span>
                  </li>
                </ol>
              </div>

              <!-- Suitable For & Expected Benefits -->
              <div class="benefits-grid">
                <div class="benefits-col">
                  <h4>Intended For</h4>
                  <ul class="bullet-list">
                    <li *ngFor="let forWho of s.suitableFor">✓ {{ forWho }}</li>
                  </ul>
                </div>
                <div class="benefits-col">
                  <h4>Holistic Benefits</h4>
                  <ul class="bullet-list">
                    <li *ngFor="let ben of s.benefits">✦ {{ ben }}</li>
                  </ul>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="service-action-bar">
                <div class="guarantee-note">
                  🔒 Booked via Square POS. Complimentary herbal infusion included.
                </div>
                <button class="btn btn-primary btn-lg" (click)="bookThisService(s)">
                  Book This Ritual • $\{{ s.price }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  public spaService = inject(SpaDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public selectedCategory = signal<string>('all');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['cat']) {
        this.selectedCategory.set(params['cat']);
      }
    });

    // Handle anchor scroll
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const el = document.getElementById(fragment);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    });
  }

  public setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  public filteredServices() {
    const cat = this.selectedCategory();
    const all = this.spaService.services();
    if (cat === 'all') return all;
    return all.filter(s => s.category === cat);
  }

  public bookThisService(service: TreatmentService) {
    this.spaService.activeBookingService.set(service);
    this.router.navigate(['/booking']);
  }
}
