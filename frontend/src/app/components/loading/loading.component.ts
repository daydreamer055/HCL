import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="loading-indicator" role="status" aria-live="polite">
        <span class="spinner"></span><span>Loading</span>
      </div>
    }
  `,
  styles: `
    .loading-indicator { position:fixed; z-index:1000; top:18px; right:22px; display:flex; align-items:center; gap:9px; padding:10px 14px; border:1px solid #e5ebe7; border-radius:12px; background:#fff; color:#45544b; font-size:12px; box-shadow:0 8px 24px #183c2816; }
    .spinner { width:15px; height:15px; border:2px solid #dce9df; border-top-color:#238353; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `,
})
export class LoadingComponent {
  protected readonly loading = inject(LoadingService);
}
