import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

let modalCount = 0;
let idSeed = 0;

/**
 * Acessibilidade para os modais (div.modal > div.modal-content):
 * - role="dialog", aria-modal e aria-labelledby (primeiro <h2>)
 * - foco inicial dentro do modal e retorno do foco ao fechar
 * - focus trap com Tab / Shift+Tab
 * - ESC fecha (clicando no botão Cancelar / [data-modal-close]); se o usuário já digitou
 *   algo, o ESC é ignorado para não perder dados sem querer
 * - trava o scroll da página enquanto aberto
 * Não altera nenhuma regra de negócio: o fechamento reutiliza o handler do botão existente.
 */
@Directive({ selector: '[appModal]', standalone: true })
export class ModalDirective implements AfterViewInit, OnDestroy {
  private previouslyFocused: HTMLElement | null = null;
  private dirty = false;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;

    const dialog = this.dialogEl();
    const title = dialog.querySelector('h2');

    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    if (title) {
      if (!title.id) title.id = `modal-title-${++idSeed}`;
      dialog.setAttribute('aria-labelledby', title.id);
    }

    if (modalCount++ === 0) document.body.classList.add('modal-open');

    setTimeout(() => {
      const first = dialog.querySelector<HTMLElement>('input, mat-select, textarea, select');
      (first || this.focusables()[0] || dialog).focus?.();
    });
  }

  ngOnDestroy(): void {
    if (--modalCount <= 0) {
      modalCount = 0;
      document.body.classList.remove('modal-open');
    }

    this.previouslyFocused?.focus?.();
  }

  @HostListener('input')
  @HostListener('selectionchange')
  markDirty(): void {
    this.dirty = true;
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // ESC dentro de um mat-select/painel aberto não deve fechar o modal
      if ((event.target as HTMLElement).closest('.mat-mdc-select-panel, .cdk-overlay-pane')) return;
      if (this.dirty) return;

      const close = this.host.nativeElement.querySelector<HTMLElement>('button.cancel, [data-modal-close]');

      if (close) {
        event.stopPropagation();
        close.click();
      }
      return;
    }

    if (event.key !== 'Tab') return;

    const items = this.focusables();

    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private dialogEl(): HTMLElement {
    return this.host.nativeElement.querySelector<HTMLElement>('.modal-content') || this.host.nativeElement;
  }

  private focusables(): HTMLElement[] {
    return Array.from(
      this.dialogEl().querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), mat-select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
  }
}
