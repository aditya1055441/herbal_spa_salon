import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <footer class="spa-footer">
      <!-- Botanical Promise Badges Banner -->
      <div class="botanical-seals-section">
        <div class="container">
          <div class="seals-grid">
            <div class="seal-item">
              <span class="seal-icon">🌿</span>
              <div class="seal-text">
                <strong>100% Pure Plant Formulations</strong>
                <p>Never synthetic silicones, sulfates, parabens, ammonia, or PPD.</p>
              </div>
            </div>
            <div class="seal-item">
              <span class="seal-icon">☀️</span>
              <div class="seal-text">
                <strong>Certified Biodynamic Herbs</strong>
                <p>Whole flowers, roots, and leaves decocted slowly in small batches.</p>
              </div>
            </div>
            <div class="seal-item">
              <span class="seal-icon">🕊️</span>
              <div class="seal-text">
                <strong>Cruelty-Free & Ethical</strong>
                <p>Wildcrafted, ethically harvested from regenerative botanical farms.</p>
              </div>
            </div>
            <div class="seal-item">
              <span class="seal-icon">💳</span>
              <div class="seal-text">
                <strong>Square POS Integrated</strong>
                <p>End-to-end encrypted appointments and contactless transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Footer Columns -->
      <div class="main-footer">
        <div class="container">
          <div class="footer-grid">
            <!-- Brand & Philosophy Summary -->
            <div class="footer-col brand-col">
              <h3 class="footer-brand">AURA BOTANICA</h3>
              <p class="footer-tagline">Chemical-Free Herbal Sanctuary & Trichology Salon</p>
              <p class="footer-desc">
                Dedicated to restoring the innate harmony of hair, skin, and nervous system through ancient botanical wisdom and whole medicinal plants.
              </p>
              <div class="social-links">
                <a href="#instagram" aria-label="Instagram">Instagram</a>
                <span>•</span>
                <a href="#journal" aria-label="Botanical Journal">Journal</a>
                <span>•</span>
                <a href="#press" aria-label="Press & Accolades">Press</a>
              </div>
            </div>

            <!-- Sanctuary Services -->
            <div class="footer-col">
              <h4 class="col-title">Herbal Rituals</h4>
              <ul class="footer-links">
                <li><a routerLink="/services" [queryParams]="{cat: 'hair'}">Ayurvedic Scalp Therapy</a></li>
                <li><a routerLink="/services" [queryParams]="{cat: 'hair'}">Botanical Henna & Gloss</a></li>
                <li><a routerLink="/services" [queryParams]="{cat: 'skin'}">Calendula Cellular Facial</a></li>
                <li><a routerLink="/services" [queryParams]="{cat: 'skin'}">Rose Otto Radiance Facial</a></li>
                <li><a routerLink="/services" [queryParams]="{cat: 'body'}">Warm Poultice Herbal Massage</a></li>
                <li><a routerLink="/services" [queryParams]="{cat: 'ritual'}">The Sacred Sanctuary Reset</a></li>
              </ul>
            </div>

            <!-- Sanctuary Location & Hours -->
            <div class="footer-col">
              <h4 class="col-title">Sanctuary Hours</h4>
              <div class="hours-block">
                <p><strong>Tuesday – Friday:</strong> 9:30 AM – 7:00 PM</p>
                <p><strong>Saturday:</strong> 9:00 AM – 6:30 PM</p>
                <p><strong>Sunday:</strong> 10:00 AM – 5:00 PM</p>
                <p class="closed-notice"><em>Closed Mondays for herbal harvesting & decoction</em></p>
              </div>
              <div class="location-block">
                <p>📍 482 Botanical Grove Way, Presidio District</p>
                <p>San Francisco, CA 94129</p>
                <p>📞 (415) 890-AURA</p>
              </div>
            </div>

            <!-- Newsletter & Holistic Diagnostic CTA -->
            <div class="footer-col newsletter-col">
              <h4 class="col-title">Botanical Dispatches</h4>
              <p>Receive seasonal harvest updates, ritual guidance, and private appointment releases.</p>
              <form class="newsletter-form" (submit)="subscribe($event)">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  [(ngModel)]="emailInput" 
                  name="email"
                  required 
                  class="newsletter-input"
                />
                <button type="submit" class="btn btn-secondary btn-sm">Join</button>
              </form>
              <p *ngIf="isSubscribed()" class="subscribe-success">
                🌿 Welcome to the sanctuary circle. Check your inbox for our seasonal guide.
              </p>
              <div class="footer-quiz-callout">
                <a routerLink="/diagnostic" class="quiz-link">
                  <span>Unsure where to begin?</span>
                  <strong>Take the 2-Minute Diagnostic Quiz →</strong>
                </a>
              </div>
            </div>
          </div>

          <!-- Bottom Bar -->
          <div class="footer-bottom-bar">
            <p>© 2026 Aura Botanica Sanctuary LLC. All botanical formulations certified 100% chemical-free.</p>
            <div class="bottom-links">
              <a routerLink="/admin">Practitioner CMS</a>
              <span>•</span>
              <a href="#privacy">Privacy Policy</a>
              <span>•</span>
              <a href="#terms">Terms & Cancellation Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  public emailInput = '';
  public isSubscribed = signal<boolean>(false);

  public subscribe(e: Event) {
    e.preventDefault();
    if (this.emailInput.trim()) {
      this.isSubscribed.set(true);
      this.emailInput = '';
    }
  }
}
