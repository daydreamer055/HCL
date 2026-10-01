import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnChanges, OnInit, SimpleChanges, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { InventoryTransactionResponse } from '../../models/api.models';

@Component({
  selector: 'app-inventory-transactions',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <section class="history-panel">
      <header class="history-header">
        <div><h2>Stock movement history</h2><p>Purchases, sales, adjustments, returns and transfers.</p></div>
        <button class="refresh-button" type="button" (click)="load()" [disabled]="loading()">Refresh</button>
      </header>
      @if (loading() && !hasLoaded()) {
        <div class="history-state" role="status"><i class="spinner"></i><strong>Loading transactions…</strong></div>
      } @else if (!transactions().length) {
        <div class="history-state"><strong>No stock movements yet</strong><span>Inventory transactions will appear here.</span></div>
      } @else {
        <div class="history-scroll">
          <table>
            <thead><tr><th>Time</th><th>Product</th><th>Location</th><th>Movement</th><th>Quantity</th><th>Notes</th></tr></thead>
            <tbody>
              @for (transaction of transactions(); track transaction.id) {
                <tr>
                  <td>{{ transaction.transactionAt | date:'medium' }}</td>
                  <td><strong>{{ transaction.productName }}</strong><small>{{ transaction.sku }}</small></td>
                  <td>{{ transaction.locationName }}@if(transaction.destinationLocationName){<small>→ {{ transaction.destinationLocationName }}</small>}</td>
                  <td><span class="movement" [class]="'movement-' + transaction.type.toLowerCase()">{{ transaction.type }}</span></td>
                  <td>{{ transaction.quantity | number:'1.0-3' }}</td>
                  <td class="notes">{{ transaction.notes || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <footer class="history-pagination">
          <span>{{ firstItem() }}–{{ lastItem() }} of {{ totalElements() }}</span>
          <div>
            <button type="button" (click)="changePage(page() - 1)" [disabled]="page() === 0">Previous</button>
            <span>Page {{ page() + 1 }} of {{ totalPages() || 1 }}</span>
            <button type="button" (click)="changePage(page() + 1)" [disabled]="page() + 1 >= totalPages()">Next</button>
          </div>
        </footer>
      }
    </section>
  `,
  styles: `
    :host { display:block; }
    .history-panel { overflow:hidden; border:1px solid #e6ece8; border-radius:15px; background:#fff; box-shadow:0 5px 22px #17392408; }
    .history-header { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:20px 21px 16px; }
    h2 { margin:0; font:750 15px 'Manrope',sans-serif; }
    .history-header p { margin:5px 0 0; color:#87928b; font-size:11px; }
    .refresh-button,.history-pagination button { min-height:32px; padding:0 10px; border:1px solid #dfe7e1; border-radius:7px; background:#fff; color:#536158; font:600 10px 'DM Sans',sans-serif; cursor:pointer; }
    .refresh-button:disabled,.history-pagination button:disabled { opacity:.55; cursor:default; }
    .history-scroll { overflow:auto; }
    table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }
    thead { background:#f8faf8; }
    th { height:38px; padding:0 13px; border-block:1px solid #edf0ee; color:#87928b; font-size:9px; font-weight:750; text-transform:uppercase; letter-spacing:.06em; }
    td { padding:12px 13px; border-bottom:1px solid #f0f3f1; color:#657168; font-size:10px; }
    td strong,td small { display:block; } td small { margin-top:4px; color:#98a29b; font-size:9px; }
    .notes { max-width:190px; overflow:hidden; text-overflow:ellipsis; }
    .movement { padding:4px 7px; border-radius:99px; background:#eef2ef; color:#59685e; font-size:9px; font-weight:700; }
    .movement-purchase,.movement-return { background:#eaf5ed; color:#34794b; }
    .movement-sale { background:#fff3e8; color:#a86c30; }
    .movement-adjustment { background:#edf2ff; color:#4d65a3; }
    .movement-transfer { background:#f2efff; color:#6652a0; }
    .history-pagination { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 18px; color:#859088; font-size:10px; }
    .history-pagination > div { display:flex; align-items:center; gap:10px; }
    .history-state { display:flex; min-height:140px; flex-direction:column; align-items:center; justify-content:center; gap:7px; color:#536158; font-size:11px; }
    .history-state span { color:#87928b; }
    .spinner { width:18px; height:18px; border:2px solid #dce9df; border-top-color:#238353; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    @media (max-width:560px) { .history-header { padding:16px 14px; } .history-pagination { align-items:flex-start; flex-direction:column; } .history-pagination > div { width:100%; justify-content:space-between; } }
  `,
})
export class InventoryTransactionsComponent implements OnInit, OnChanges {
  readonly refreshKey = input(0);
  private readonly inventoryService = inject(InventoryService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly transactions = signal<InventoryTransactionResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasLoaded = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  private readonly pageSize = 10;

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshKey'] && !changes['refreshKey'].firstChange) this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.inventoryService.findTransactions({
      page: this.page(),
      size: this.pageSize,
      direction: 'desc',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.transactions.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.hasLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.hasLoaded.set(true);
        this.notifications.show(this.errorMessage(error), 'error');
      },
    });
  }

  protected changePage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.load();
  }

  protected firstItem(): number {
    return this.totalElements() ? this.page() * this.pageSize + 1 : 0;
  }

  protected lastItem(): number {
    return Math.min((this.page() + 1) * this.pageSize, this.totalElements());
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 0) return 'Could not reach the StockSmart API. Check your connection and try again.';
      return `Could not load stock history (HTTP ${error.status}).`;
    }
    return 'Could not load stock history.';
  }
}
