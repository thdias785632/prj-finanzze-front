import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BELT_CARDS,
  BeltCard,
  BeltPhase,
  PHASE_DURATION,
  PHASE_ORDER
} from './bloom-belt.data';

@Component({
  selector: 'app-bloom-belt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bloom-belt.component.html',
  styleUrls: ['./bloom-belt.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BloomBeltComponent implements OnInit, OnDestroy {
  @Input() pauseOnHover = true;

  readonly cards: BeltCard[] = BELT_CARDS;

  phase: BeltPhase = 'circle';
  activeIndex = 0;
  private phaseTimer?: ReturnType<typeof setTimeout>;
  private paused = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.scheduleNextPhase();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  /** Índice do card que vai ao centro na fase de destaque. */
  get focusIndex(): number {
    return this.activeIndex;
  }

  ringAngle(index: number): number {
    return (index / this.cards.length) * 360 - 90;
  }

  /** Deslocamento diagonal na fase diagonal. */
  diagonalOffset(index: number): { x: number; y: number } {
    const step = 62;
    const start = -((this.cards.length - 1) * step) / 2;
    const pos = start + index * step;

    return { x: pos, y: pos };
  }

  /** Deslocamento horizontal na fase belt. */
  beltOffset(index: number): number {
    const total = this.cards.length;
    let diff = index - this.activeIndex;

    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    return diff;
  }

  private scheduleNextPhase(): void {
    const duration = PHASE_DURATION[this.phase];

    this.phaseTimer = setTimeout(() => {
      if (this.paused) {
        this.scheduleNextPhase();
        return;
      }

      this.advancePhase();
    }, duration);
  }

  private advancePhase(): void {
    const currentIndex = PHASE_ORDER.indexOf(this.phase);
    const nextIndex = (currentIndex + 1) % PHASE_ORDER.length;

    this.phase = PHASE_ORDER[nextIndex];

    // ao entrar na fase belt, avança o card ativo
    if (this.phase === 'belt') {
      this.activeIndex = (this.activeIndex + 1) % this.cards.length;
    }

    // setTimeout está fora do ciclo do Angular e o componente é OnPush:
    // sem isso, a nova fase nunca chega ao template
    this.cdr.markForCheck();

    this.scheduleNextPhase();
  }

  private clearTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = undefined;
    }
  }

  onEnter(): void {
    if (this.pauseOnHover) this.paused = true;
  }

  onLeave(): void {
    this.paused = false;
  }
}