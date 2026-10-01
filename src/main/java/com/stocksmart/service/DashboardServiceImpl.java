package com.stocksmart.service;

import com.stocksmart.dto.DashboardDateTotalProjection;
import com.stocksmart.dto.DashboardDateTotalResponse;
import com.stocksmart.dto.DashboardSummaryResponse;
import com.stocksmart.dto.InventoryByCategoryResponse;
import com.stocksmart.dto.InventoryByLocationResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.LowStockProductResponse;
import com.stocksmart.entity.PurchaseOrderStatus;
import com.stocksmart.entity.SalesOrderStatus;
import com.stocksmart.repository.CategoryRepository;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.PurchaseOrderRepository;
import com.stocksmart.repository.SalesOrderRepository;
import com.stocksmart.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(Transactional.TxType.SUPPORTS)
public class DashboardServiceImpl implements DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;

    public DashboardServiceImpl(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            InventoryRepository inventoryRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            SalesOrderRepository salesOrderRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @Override
    public DashboardSummaryResponse getSummary() {
        return new DashboardSummaryResponse(
                productRepository.count(),
                categoryRepository.count(),
                supplierRepository.count(),
                locationRepository.count(),
                inventoryRepository.count(),
                inventoryRepository.calculateValuation(null, null),
                inventoryRepository.countLowStockItems(),
                inventoryRepository.countOutOfStockItems(),
                purchaseOrderRepository.countByStatusIn(
                        List.of(PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PLACED)),
                salesOrderRepository.countByStatusIn(
                        List.of(SalesOrderStatus.PENDING, SalesOrderStatus.CONFIRMED))
        );
    }

    @Override
    public List<InventoryByCategoryResponse> getInventoryByCategory() {
        return inventoryRepository.summarizeQuantityByCategory();
    }

    @Override
    public List<InventoryByLocationResponse> getInventoryByLocation() {
        return inventoryRepository.summarizeQuantityByLocation();
    }

    @Override
    public Page<LowStockProductResponse> getLowStock(Pageable pageable) {
        return inventoryRepository.findLowStockProducts(pageable);
    }

    @Override
    public Page<InventoryTransactionResponse> getRecentTransactions(Pageable pageable) {
        return inventoryRepository.findRecentTransactions(pageable);
    }

    @Override
    public List<DashboardDateTotalResponse> getSalesSummary() {
        return toDateTotals(salesOrderRepository.summarizeCompletedOrdersByDate());
    }

    @Override
    public List<DashboardDateTotalResponse> getPurchaseSummary() {
        return toDateTotals(purchaseOrderRepository.summarizeReceivedOrdersByDate());
    }

    private List<DashboardDateTotalResponse> toDateTotals(List<DashboardDateTotalProjection> rows) {
        return rows.stream()
                .map(row -> new DashboardDateTotalResponse(row.getDateKey(), row.getTotalAmount()))
                .toList();
    }
}
