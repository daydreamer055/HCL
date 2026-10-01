import { Component, OnInit, computed, inject } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDateTotal, DashboardSummary } from '../../models/api.models';

interface MetricCard {
  label: string;
  value: string;
  icon: string;
  tone: string;
}

interface DateChartPoint {
  date: string;
  sales: number;
  purchases: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">STOCKSMART / OVERVIEW</p>
        <h1>Dashboard</h1>
        <p class="description">A live overview of your retail operations.</p>
      </div>
      <button class="refresh-button" type="button" (click)="dashboard.load()" [disabled]="dashboard.loading()">
        <span aria-hidden="true">↻</span> {{ dashboard.loading() ? 'Refreshing…' : 'Refresh data' }}
      </button>
    </section>

    @if (dashboard.error(); as errorMessage) {
      <section class="state-panel error-panel" role="alert">
        <div class="state-icon" aria-hidden="true">!</div>
        <div>
          <h2>Dashboard unavailable</h2>
          <p>{{ errorMessage }}</p>
        </div>
        <button class="retry-button" type="button" (click)="dashboard.load()">Try again</button>
      </section>
    } @else if (dashboard.loading() && !dashboard.data()) {
      <section class="state-panel" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <div>
          <h2>Loading your dashboard</h2>
          <p>Fetching the latest inventory and order data.</p>
        </div>
      </section>
    } @else if (dashboard.data(); as data) {
      @if (isEmpty(data.summary)) {
        <section class="empty-banner">
          <span class="empty-banner-icon" aria-hidden="true">i</span>
          <div><strong>No operational data yet</strong><p>Dashboard figures will appear here as products, inventory, and orders are added.</p></div>
        </section>
      }

      <section class="metrics-grid" aria-label="Business summary">
        @for (metric of metrics(); track metric.label) {
          <article class="metric-card">
            <div class="metric-topline">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-icon {{ metric.tone }}" aria-hidden="true">{{ metric.icon }}</span>
            </div>
            <strong class="metric-value">{{ metric.value }}</strong>
          </article>
        }
      </section>

      <section class="charts-grid" aria-label="Inventory and order charts">
        <article class="panel">
          <div class="panel-heading">
            <div><h2>Inventory by category</h2><p>Total units across all locations</p></div>
            <span class="panel-icon green" aria-hidden="true">▥</span>
          </div>
          @if (data.inventoryByCategory.length) {
            <div class="bar-list">
              @for (item of data.inventoryByCategory; track item.categoryId ?? item.categoryName) {
                <div class="bar-row">
                  <div class="bar-label"><span>{{ item.categoryName || 'Uncategorized' }}</span><strong>{{ formatNumber(item.inventoryQuantity) }}</strong></div>
                  <div class="bar-track"><span class="bar-fill green-fill" [style.width.%]="barWidth(item.inventoryQuantity, categoryMax())"></span></div>
                </div>
              }
            </div>
          } @else {
            <div class="chart-empty">No inventory by category to display.</div>
          }
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div><h2>Inventory by location</h2><p>Stock quantity by store or warehouse</p></div>
            <span class="panel-icon blue" aria-hidden="true">⌖</span>
          </div>
          @if (data.inventoryByLocation.length) {
            <div class="bar-list">
              @for (item of data.inventoryByLocation; track item.locationId) {
                <div class="bar-row">
                  <div class="bar-label"><span>{{ item.locationName }} <small>{{ item.locationCode }}</small></span><strong>{{ formatNumber(item.inventoryQuantity) }}</strong></div>
                  <div class="bar-track"><span class="bar-fill blue-fill" [style.width.%]="barWidth(item.inventoryQuantity, locationMax())"></span></div>
                </div>
              }
            </div>
          } @else {
            <div class="chart-empty">No inventory by location to display.</div>
          }
        </article>

        <article class="panel wide-panel">
          <div class="panel-heading">
            <div><h2>Sales and purchase summary</h2><p>Completed sales and received purchases by date</p></div>
            <span class="panel-icon purple" aria-hidden="true">↗</span>
          </div>
          @if (dateChart().length) {
            <div class="legend">
              <span><i class="sales-dot"></i>Sales</span><span><i class="purchase-dot"></i>Purchases</span>
            </div>
            <div class="date-chart" role="img" aria-label="Sales and purchase totals grouped by date">
              @for (point of dateChart(); track point.date) {
                <div class="date-column" [title]="chartTooltip(point)">
                  <div class="column-bars">
                    <span class="date-bar sales-bar" [style.height.%]="barHeight(point.sales, dateMax())"></span>
                    <span class="date-bar purchase-bar" [style.height.%]="barHeight(point.purchases, dateMax())"></span>
                  </div>
                  <span class="date-label">{{ formatDate(point.date) }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="chart-empty">No completed sales or received purchases to display.</div>
          }
        </article>
      </section>

      <section class="details-grid">
        <article class="panel table-panel">
          <div class="panel-heading">
            <div><h2>Recent inventory transactions</h2><p>Latest stock activity</p></div>
            <span class="table-count">{{ data.recentTransactions.totalElements }} total</span>
          </div>
          @if (data.recentTransactions.content.length) {
            <div class="table-scroll">
              <table>
                <thead><tr><th>Product</th><th>Type</th><th>Location</th><th>Quantity</th><th>Date</th></tr></thead>
                <tbody>
                  @for (transaction of data.recentTransactions.content; track transaction.id) {
                    <tr>
                      <td><strong>{{ transaction.productName }}</strong><small>{{ transaction.sku }}</small></td>
                      <td><span class="type-badge" [class]="typeClass(transaction.type)">{{ transaction.type }}</span></td>
                      <td>{{ transaction.locationName }}</td>
                      <td class="quantity-cell">{{ formatNumber(transaction.quantity) }}</td>
                      <td>{{ formatDateTime(transaction.transactionAt) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="table-empty">No inventory transactions have been recorded.</div>
          }
        </article>

        <article class="panel table-panel low-stock-panel">
          <div class="panel-heading">
            <div><h2>Low stock products</h2><p>At or below reorder level</p></div>
            <span class="low-stock-count">{{ data.lowStock.totalElements }}</span>
          </div>
          @if (data.lowStock.content.length) {
            <div class="table-scroll">
              <table>
                <thead><tr><th>Product</th><th>Location</th><th>Available</th><th>Reorder at</th></tr></thead>
                <tbody>
                  @for (item of data.lowStock.content; track item.productId + ':' + item.locationId) {
                    <tr>
                      <td><strong>{{ item.productName }}</strong><small>{{ item.sku }}</small></td>
                      <td>{{ item.locationName }}</td>
                      <td class="low-quantity">{{ formatNumber(item.availableQuantity) }}</td>
                      <td>{{ formatNumber(item.reorderLevel) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="table-empty"><span class="all-clear" aria-hidden="true">✓</span><strong>Stock levels look good</strong><p>No products are currently at or below their reorder level.</p></div>
          }
        </article>
      </section>
    }
  `,
  styles: `
    :host { display:block; color:#17211c; }
    .page-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin:10px 0 26px; }
    .eyebrow { margin:0 0 10px; color:#78857d; font-size:11px; font-weight:700; letter-spacing:.13em; }
    h1 { margin:0; font:800 clamp(28px,3vw,38px)/1.15 'Manrope',sans-serif; letter-spacing:-.04em; }
    .description { margin:9px 0 0; color:#738078; font-size:14px; }
    .refresh-button,.retry-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:0 14px; border:1px solid #dce7df; border-radius:10px; background:white; color:#285d3c; font-family:inherit; font-size:12px; font-weight:650; cursor:pointer; transition:background .15s,border-color .15s; }
    .refresh-button:hover,.retry-button:hover { border-color:#a9c9b2; background:#f4faf5; }
    .refresh-button:disabled { opacity:.55; cursor:wait; }
    .refresh-button span { font-size:20px; line-height:1; }
    .metrics-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
    .metric-card,.panel { border:1px solid #e6ece8; border-radius:15px; background:#fff; box-shadow:0 5px 22px #17392408; }
    .metric-card { min-height:115px; padding:17px 18px; }
    .metric-topline { display:flex; justify-content:space-between; align-items:center; gap:12px; }
    .metric-label { color:#748078; font-size:12px; font-weight:600; }
    .metric-icon,.panel-icon { width:32px; height:32px; display:grid; place-items:center; flex:0 0 auto; border-radius:10px; font-size:16px; font-weight:700; }
    .metric-value { display:block; margin-top:13px; font:800 clamp(22px,2vw,28px)/1 'Manrope',sans-serif; letter-spacing:-.04em; }
    .green { background:#eaf5ed; color:#25814a; } .blue { background:#edf4fc; color:#477bb2; }
    .amber { background:#fff5e7; color:#bd7a20; } .red { background:#fff0ed; color:#c45843; }
    .purple { background:#f3effc; color:#785ac0; } .slate { background:#eff2f1; color:#596a60; }
    .charts-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-bottom:16px; }
    .panel { min-width:0; padding:20px; }
    .panel-heading { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:19px; }
    .panel-heading h2 { margin:0; font:750 15px/1.3 'Manrope',sans-serif; letter-spacing:-.02em; }
    .panel-heading p { margin:5px 0 0; color:#87928b; font-size:11px; }
    .bar-list { max-height:294px; overflow:auto; padding-right:3px; }
    .bar-row + .bar-row { margin-top:16px; }
    .bar-label { display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:7px; color:#45534a; font-size:12px; }
    .bar-label > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bar-label strong { color:#26362c; font-size:11px; font-weight:700; }
    .bar-label small { margin-left:6px; color:#97a29b; font-size:10px; }
    .bar-track { height:7px; overflow:hidden; border-radius:10px; background:#f0f3f1; }
    .bar-fill { display:block; height:100%; min-width:2px; border-radius:10px; transition:width .3s ease; }
    .green-fill { background:#48a66c; } .blue-fill { background:#6497d0; }
    .wide-panel { grid-column:1/-1; }
    .legend { display:flex; justify-content:flex-end; gap:18px; margin-top:-8px; color:#68756d; font-size:11px; }
    .legend span { display:flex; align-items:center; gap:6px; }
    .legend i { width:8px; height:8px; border-radius:50%; }
    .sales-dot,.sales-bar { background:#5a9d71; } .purchase-dot,.purchase-bar { background:#8b73cc; }
    .date-chart { display:flex; align-items:stretch; gap:7px; height:186px; overflow-x:auto; padding:12px 0 0; }
    .date-column { display:flex; min-width:50px; flex:1 0 50px; flex-direction:column; align-items:center; justify-content:flex-end; }
    .column-bars { display:flex; width:100%; height:148px; align-items:flex-end; justify-content:center; gap:4px; border-bottom:1px solid #e8ede9; }
    .date-bar { width:min(30%,16px); min-height:0; border-radius:4px 4px 0 0; transition:height .25s ease; }
    .date-label { margin-top:8px; color:#849088; font-size:10px; white-space:nowrap; }
    .details-grid { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:16px; }
    .table-panel { padding:0; overflow:hidden; }
    .table-panel > .panel-heading { padding:20px 20px 0; }
    .table-count { color:#87928b; font-size:11px; white-space:nowrap; }
    .low-stock-count { display:grid; width:29px; height:29px; place-items:center; border-radius:9px; background:#fff2e7; color:#bd6d2c; font-size:12px; font-weight:750; }
    .table-scroll { overflow:auto; }
    table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }
    th { padding:10px 13px; border-top:1px solid #f0f2f1; border-bottom:1px solid #edf0ee; color:#849088; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    th:first-child,td:first-child { padding-left:20px; }
    th:last-child,td:last-child { padding-right:20px; }
    td { padding:12px 13px; border-bottom:1px solid #f1f3f2; color:#56635a; font-size:11px; }
    tr:last-child td { border-bottom:0; }
    td strong,td small { display:block; }
    td strong { max-width:180px; overflow:hidden; color:#344239; font-size:11px; font-weight:650; text-overflow:ellipsis; }
    td small { margin-top:3px; color:#96a098; font-size:10px; }
    .type-badge { display:inline-block; padding:4px 7px; border-radius:6px; background:#edf4ef; color:#39754b; font-size:9px; font-weight:750; }
    .type-sale { background:#fff0ed; color:#b34d3d; } .type-transfer { background:#edf4fc; color:#4777aa; }
    .type-adjustment { background:#f3effc; color:#765bb0; } .type-return { background:#fff5e7; color:#a66b24; }
    .quantity-cell { font-weight:700; color:#344239; }
    .low-quantity { color:#bf5942; font-weight:750; }
    .chart-empty,.table-empty { display:flex; min-height:120px; align-items:center; justify-content:center; padding:20px; color:#8a958e; font-size:12px; text-align:center; }
    .table-empty { min-height:152px; flex-direction:column; }
    .table-empty p { margin:6px 0 0; color:#87928b; font-size:11px; }
    .table-empty strong { margin-top:8px; color:#435148; font-size:12px; }
    .all-clear { display:grid; width:30px; height:30px; place-items:center; border-radius:50%; background:#eaf5ed; color:#25814a; font-weight:800; }
    .state-panel,.empty-banner { display:flex; align-items:center; gap:15px; padding:20px; border:1px solid #e6ece8; border-radius:14px; background:#fff; }
    .state-panel { min-height:126px; box-shadow:0 5px 22px #17392408; }
    .state-panel h2 { margin:0; font:750 15px 'Manrope',sans-serif; }
    .state-panel p,.empty-banner p { margin:5px 0 0; color:#78857d; font-size:12px; }
    .state-icon,.empty-banner-icon { display:grid; width:36px; height:36px; flex:0 0 auto; place-items:center; border-radius:11px; background:#fff0ed; color:#bb5341; font-weight:800; }
    .error-panel { border-color:#f0d5ce; }
    .retry-button { margin-left:auto; }
    .spinner { width:20px; height:20px; flex:0 0 auto; border:2px solid #dce9df; border-top-color:#238353; border-radius:50%; animation:spin .7s linear infinite; }
    .empty-banner { margin-bottom:16px; border-color:#dcebe0; background:#f6fbf7; }
    .empty-banner-icon { background:#e5f2e8; color:#398251; }
    .empty-banner strong { color:#355840; font-size:12px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    @media (max-width:1200px) { .metrics-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } .details-grid { grid-template-columns:1fr; } }
    @media (max-width:780px) { .charts-grid { grid-template-columns:1fr; } .wide-panel { grid-column:auto; } }
    @media (max-width:560px) {
      .page-heading { align-items:flex-start; flex-direction:column; margin-top:2px; }
      .refresh-button { align-self:stretch; }
      .metrics-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .metric-card { min-height:104px; padding:14px; }
      .metric-label { max-width:92px; font-size:11px; }
      .panel { padding:16px; }
      .table-panel { padding:0; }
      .table-panel > .panel-heading { padding:16px 16px 0; }
      .state-panel { align-items:flex-start; flex-wrap:wrap; }
      .state-panel > div { flex:1; }
      .retry-button { margin-left:50px; }
    }
  `,
})
export class DashboardPageComponent implements OnInit {
  protected readonly dashboard = inject(DashboardService);

  protected readonly metrics = computed(() => {
    const summary = this.dashboard.data()?.summary;
    if (!summary) return [];
    return [
      this.metric('Total Products', summary.totalProducts, '▦', 'green'),
      this.metric('Total Categories', summary.totalCategories, '◫', 'blue'),
      this.metric('Total Suppliers', summary.totalSuppliers, '♧', 'purple'),
      this.metric('Total Locations', summary.totalLocations, '⌖', 'slate'),
      this.metric('Total Inventory', summary.totalInventoryItems, '▤', 'blue'),
      this.metric('Inventory Value', this.formatCurrency(summary.totalInventoryValue), '$', 'green'),
      this.metric('Low Stock Items', summary.lowStockCount, '↓', 'amber'),
      this.metric('Out of Stock Items', summary.outOfStockCount, '!', 'red'),
      this.metric('Pending Purchase Orders', summary.pendingPurchaseOrders, '↗', 'purple'),
      this.metric('Pending Sales Orders', summary.pendingSalesOrders, '↙', 'amber'),
    ];
  });

  protected readonly categoryMax = computed(() =>
    this.maxValue(this.dashboard.data()?.inventoryByCategory.map((item) => item.inventoryQuantity) ?? []),
  );
  protected readonly locationMax = computed(() =>
    this.maxValue(this.dashboard.data()?.inventoryByLocation.map((item) => item.inventoryQuantity) ?? []),
  );
  protected readonly dateChart = computed(() => {
    const data = this.dashboard.data();
    if (!data) return [];
    const totals = new Map<string, DateChartPoint>();
    for (const row of data.salesSummary) {
      totals.set(row.date, { date: row.date, sales: this.toNumber(row.totalAmount), purchases: 0 });
    }
    for (const row of data.purchaseSummary) {
      const point = totals.get(row.date) ?? { date: row.date, sales: 0, purchases: 0 };
      point.purchases = this.toNumber(row.totalAmount);
      totals.set(row.date, point);
    }
    return [...totals.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  });
  protected readonly dateMax = computed(() =>
    this.maxValue(this.dateChart().flatMap((point) => [point.sales, point.purchases])),
  );

  ngOnInit(): void {
    this.dashboard.load();
  }

  protected isEmpty(summary: DashboardSummary): boolean {
    return Object.values(summary).every((value) => this.toNumber(value) === 0);
  }

  protected formatNumber(value: number): string {
    return this.toNumber(value).toLocaleString();
  }

  protected formatCurrency(value: number): string {
    return this.toNumber(value).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  protected formatDate(value: string): string {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  protected formatDateTime(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  protected barWidth(value: number, max: number): number {
    return max > 0 ? Math.max((this.toNumber(value) / max) * 100, value > 0 ? 1 : 0) : 0;
  }

  protected barHeight(value: number, max: number): number {
    return max > 0 ? Math.max((this.toNumber(value) / max) * 100, value > 0 ? 2 : 0) : 0;
  }

  protected chartTooltip(point: DateChartPoint): string {
    return `${this.formatDate(point.date)} · Sales ${this.formatCurrency(point.sales)} · Purchases ${this.formatCurrency(point.purchases)}`;
  }

  protected typeClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }

  private metric(label: string, value: number | string, icon: string, tone: string): MetricCard {
    return { label, value: typeof value === 'number' ? this.formatNumber(value) : value, icon, tone };
  }

  private maxValue(values: number[]): number {
    return Math.max(0, ...values.map((value) => this.toNumber(value)));
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
