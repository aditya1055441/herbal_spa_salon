import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { DiagnosticResult, TreatmentService, HerbalProduct } from '../../models/spa.model';

@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="diagnostic-page-section">
      <div class="container">
        
        <!-- Quiz In Progress View -->
        <div *ngIf="!diagnosticResult()" class="quiz-container luxury-card">
          <!-- Header & Progress Tracker -->
          <div class="quiz-header">
            <span class="section-tag">Holistic Self-Assessment</span>
            <h2>Herbal Diagnostic Consultation</h2>
            <p class="quiz-intro">
              Help us understand your biological rhythms, environmental stressors, and wellness desires. 
              We formulate each session around your exact needs.
            </p>

            <div class="progress-bar-wrapper">
              <div class="progress-labels">
                <span>Step {{ currentStepIndex() + 1 }} of {{ totalSteps }}</span>
                <span>{{ progressPercentage() }}% Completed</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
              </div>
            </div>
          </div>

          <!-- Question Body -->
          <div class="question-body" *ngIf="currentQuestion">
            <h3 class="question-title">{{ currentQuestion.title }}</h3>
            <p class="question-subtitle">{{ currentQuestion.subtitle }}</p>

            <div class="choices-grid">
              <button 
                *ngFor="let choice of currentQuestion.choices" 
                class="choice-card"
                [class.selected]="selectedAnswers[currentQuestion.id] === choice.tag"
                (click)="selectChoice(currentQuestion.id, choice.tag)"
              >
                <div class="choice-selection-indicator">
                  <span class="check-circle" *ngIf="selectedAnswers[currentQuestion.id] === choice.tag">✓</span>
                </div>
                <div class="choice-content">
                  <strong class="choice-text">{{ choice.text }}</strong>
                  <p *ngIf="choice.description" class="choice-desc">{{ choice.description }}</p>
                </div>
              </button>
            </div>

            <!-- Navigation Controls -->
            <div class="quiz-nav-row">
              <button 
                class="btn btn-outline btn-sm" 
                [disabled]="currentStepIndex() === 0" 
                (click)="prevStep()"
              >
                ← Previous Step
              </button>

              <button 
                class="btn btn-primary" 
                [disabled]="!selectedAnswers[currentQuestion.id]" 
                (click)="nextStep()"
              >
                <span *ngIf="currentStepIndex() < totalSteps - 1">Continue →</span>
                <span *ngIf="currentStepIndex() === totalSteps - 1">Generate Botanical Prescription ✨</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Diagnostic Result View -->
        <div *ngIf="diagnosticResult()" class="result-container">
          <div class="result-header text-center">
            <span class="badge badge-gold">Certified Biological Recommendation</span>
            <h1 class="result-title">Your Tailored Botanical Prescription</h1>
            <p class="result-subtitle">
              Based on your unique constitution and stressors, here is the curated treatment ritual and take-home care designed for you.
            </p>
            <div class="botanical-divider">🌿</div>
          </div>

          <!-- Botanical Notes -->
          <div class="luxury-card prescription-notes-card">
            <h3>Diagnostic Clinical Insights</h3>
            <div class="prescription-notes-list">
              <div *ngFor="let note of diagnosticResult()!.botanicalPrescriptionNotes" class="prescription-note-item">
                <span class="note-leaf">🍃</span>
                <p>{{ note }}</p>
              </div>
            </div>
          </div>

          <!-- Recommended Services Section -->
          <div class="recommended-services-block">
            <div class="sub-header">
              <span class="section-tag">Primary In-House Rituals</span>
              <h3>Recommended Spa & Salon Treatments</h3>
              <p>These rituals will directly target the root imbalance you specified.</p>
            </div>

            <div class="grid-2">
              <div *ngFor="let s of diagnosticResult()!.recommendedServices" class="luxury-card recommended-service-card">
                <div class="card-badge">Top Match for You</div>
                <h4>{{ s.name }}</h4>
                <p class="service-sub">{{ s.subtitle }}</p>

                <div class="meta-row">
                  <span>⏱️ {{ s.durationMinutes }} mins</span>
                  <span class="price">$\{{ s.price }} USD</span>
                </div>

                <div class="ingredients-preview">
                  <span class="ing-label">Key Bio-Active Herbs:</span>
                  <div class="herbs-chips">
                    <span *ngFor="let h of s.herbalIngredients.slice(0, 3)" class="badge badge-sage">
                      {{ h }}
                    </span>
                  </div>
                </div>

                <button class="btn btn-primary w-100 mt-auto" (click)="bookPrescribedService(s)">
                  Book This Prescribed Ritual →
                </button>
              </div>
            </div>
          </div>

          <!-- Recommended Take-Home Apothecary Products -->
          <div class="recommended-products-block" *ngIf="diagnosticResult()!.recommendedProducts.length > 0">
            <div class="sub-header">
              <span class="section-tag">Secondary Home Maintenance</span>
              <h3>Complementary Botanical Remedies</h3>
              <p>Formulated to sustain your barrier and scalp balance between visits.</p>
            </div>

            <div class="grid-3">
              <div *ngFor="let p of diagnosticResult()!.recommendedProducts" class="luxury-card product-rec-card">
                <div class="product-icon">🏺</div>
                <h4>{{ p.name }}</h4>
                <span class="product-size">{{ p.size }}</span>
                <p class="product-desc">{{ p.description }}</p>
                <div class="product-price-row">
                  <span class="price">$\{{ p.price }}</span>
                  <button class="btn btn-outline btn-sm" (click)="addToBag(p)">
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Retake Quiz CTA -->
          <div class="retake-row text-center">
            <button class="btn btn-outline" (click)="retakeQuiz()">
              ↺ Re-take Diagnostic Questionnaire
            </button>
          </div>
        </div>

      </div>
    </section>
  `,
  styleUrls: ['./diagnostic.component.css']
})
export class DiagnosticComponent {
  public spaService = inject(SpaDataService);
  private router = inject(Router);

  public currentStepIndex = signal<number>(0);
  public selectedAnswers: Record<string, string> = {};
  public diagnosticResult = signal<DiagnosticResult | null>(null);

  public get totalSteps(): number {
    return this.spaService.diagnosticQuestions.length;
  }

  public get currentQuestion() {
    return this.spaService.diagnosticQuestions[this.currentStepIndex()];
  }

  public progressPercentage(): number {
    return Math.round(((this.currentStepIndex() + 1) / this.totalSteps) * 100);
  }

  public selectChoice(questionId: string, tag: string) {
    this.selectedAnswers[questionId] = tag;
  }

  public nextStep() {
    if (this.currentStepIndex() < this.totalSteps - 1) {
      this.currentStepIndex.update(idx => idx + 1);
    } else {
      // Evaluate results
      const result = this.spaService.evaluateDiagnostic(this.selectedAnswers);
      this.diagnosticResult.set(result);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  public prevStep() {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update(idx => idx - 1);
    }
  }

  public bookPrescribedService(service: TreatmentService) {
    this.spaService.activeBookingService.set(service);
    this.router.navigate(['/booking']);
  }

  public addToBag(product: HerbalProduct) {
    this.spaService.addToCart(product, 1);
    const event = new CustomEvent('toggle-apothecary-cart');
    window.dispatchEvent(event);
  }

  public retakeQuiz() {
    this.selectedAnswers = {};
    this.currentStepIndex.set(0);
    this.diagnosticResult.set(null);
  }
}
