import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { HerbalProduct } from '../../models/spa.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="shop-hero-section">
      <div class="container text-center">
        <span class="section-tag">Secondary Botanical Line</span>
        <h1 class="shop-title">The Take-Home Apothecary</h1>
        <p class="shop-desc">
          Formulated to sustain your scalp and dermal results between salon rituals. 
          Every elixir and balm is slow-extracted in amber glass without water fillers or synthetic preservatives.
        </p>

        <!-- Informational banner emphasizing services first -->
        <div class="service-first-callout">
          <span>🌿 Visiting for the first time? We recommend an in-house herbal consultation before purchasing products.</span>
          <a routerLink="/services" class="callout-link">Browse Treatment Rituals →</a>
        </div>
      </div>
    </section>

    <section class="section-padding shop-grid-section">
      <div class="container">
        
        <!-- Category Filter -->
        <div class="shop-filters">
          <button 
            [class.active]="selectedCategory() === 'all'" 
            (click)="setCategory('all')"
          >
            All Remedies
          </button>
          <button 
            [class.active]="selectedCategory() === 'scalp_oil'" 
            (click)="setCategory('scalp_oil')"
          >
            Follicle & Scalp Oils
          </button>
          <button 
            [class.active]="selectedCategory() === 'elixir'" 
            (click)="setCategory('elixir')"
          >
            Dermal Barrier Elixirs
          </button>
          <button 
            [class.active]="selectedCategory() === 'botanical_mist'" 
            (click)="setCategory('botanical_mist')"
          >
            Pure Hydrosols
          </button>
          <button 
            [class.active]="selectedCategory() === 'herbal_balm'" 
            (click)="setCategory('herbal_balm')"
          >
            Muscle Relief Balms
          </button>
          <button 
            [class.active]="selectedCategory() === 'bath_soak'" 
            (click)="setCategory('bath_soak')"
          >
            Earth Soaks
          </button>
        </div>

        <!-- Products Grid -->
        <div class="grid-3 products-grid">
          <div *ngFor="let p of filteredProducts()" class="luxury-card shop-product-card">
            <div class="product-visual-area">
              <span class="product-botanical-art">🌿</span>
              <span class="stock-badge" *ngIf="p.inStock">Small Batch In Stock</span>
              <span class="size-pill">{{ p.size }}</span>
            </div>

            <div class="product-details-area">
              <div class="cat-pill">{{ p.botanicalCategory | uppercase }}</div>
              <h3 class="product-name">{{ p.name }}</h3>
              <p class="product-description">{{ p.description }}</p>

              <div class="product-herbs-box">
                <span class="box-label">Whole Key Herbs:</span>
                <div class="herb-tags">
                  <span *ngFor="let h of p.keyHerbs" class="badge badge-sage">{{ h }}</span>
                </div>
              </div>

              <div class="directions-note">
                <strong>Directions:</strong> {{ p.directions }}
              </div>

              <div class="product-card-footer">
                <div class="price-box">
                  <span class="price-amount">$\{{ p.price }}</span>
                  <span class="currency">USD</span>
                </div>

                <button class="btn btn-primary btn-sm" (click)="addToBag(p)">
                  Add to Bag
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  `,
  styleUrls: ['./shop.component.css']
})
export class ShopComponent {
  public spaService = inject(SpaDataService);
  public selectedCategory = signal<string>('all');

  public setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  public filteredProducts(): HerbalProduct[] {
    const cat = this.selectedCategory();
    const all = this.spaService.products();
    if (cat === 'all') return all;
    return all.filter(p => p.botanicalCategory === cat);
  }

  public addToBag(product: HerbalProduct) {
    this.spaService.addToCart(product, 1);
    const event = new CustomEvent('toggle-apothecary-cart');
    window.dispatchEvent(event);
  }
}
