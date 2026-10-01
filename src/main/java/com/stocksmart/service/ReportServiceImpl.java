package com.stocksmart.service;

import com.stocksmart.dto.InventoryReportResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationReportResponse;
import com.stocksmart.dto.PurchaseReportResponse;
import com.stocksmart.dto.SalesReportResponse;
import com.stocksmart.dto.SupplierReportResponse;
import com.stocksmart.exception.InvalidInventoryOperationException;
import com.stocksmart.repository.ReportRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(Transactional.TxType.SUPPORTS)
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;

    public ReportServiceImpl(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Override
    public Page<InventoryReportResponse> inventory(
            Long productId, Long categoryId, Long supplierId, Long locationId, Pageable pageable
    ) {
        return reportRepository.inventoryReport(productId, categoryId, supplierId, locationId, pageable);
    }

    @Override
    public Page<InventoryReportResponse> lowStock(
            Long productId, Long categoryId, Long supplierId, Long locationId, Pageable pageable
    ) {
        return reportRepository.lowStockReport(productId, categoryId, supplierId, locationId, pageable);
    }

    @Override
    public Page<InventoryReportResponse> outOfStock(
            Long productId, Long categoryId, Long supplierId, Long locationId, Pageable pageable
    ) {
        return reportRepository.outOfStockReport(productId, categoryId, supplierId, locationId, pageable);
    }

    @Override
    public List<SalesReportResponse> sales(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId
    ) {
        validateDates(startDate, endDate);
        LocalDate endDateExclusive = endDate == null ? null : endDate.plusDays(1);
        return reportRepository.salesReport(startDate, endDate, endDateExclusive,
                        productId, categoryId, supplierId, locationId)
                .stream()
                .map(row -> new SalesReportResponse(
                        row.getReportDate(), row.getOrderCount(), row.getItemQuantity(), row.getTotalAmount()))
                .toList();
    }

    @Override
    public List<PurchaseReportResponse> purchases(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId
    ) {
        validateDates(startDate, endDate);
        LocalDate endDateExclusive = endDate == null ? null : endDate.plusDays(1);
        return reportRepository.purchaseReport(startDate, endDate, endDateExclusive,
                        productId, categoryId, supplierId, locationId)
                .stream()
                .map(row -> new PurchaseReportResponse(
                        row.getReportDate(), row.getOrderCount(), row.getItemQuantity(), row.getTotalAmount()))
                .toList();
    }

    @Override
    public List<SupplierReportResponse> suppliers(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId
    ) {
        validateDates(startDate, endDate);
        LocalDate endDateExclusive = endDate == null ? null : endDate.plusDays(1);
        return reportRepository.supplierReport(startDate, endDate, endDateExclusive,
                        supplierId, productId, categoryId, locationId)
                .stream()
                .map(row -> new SupplierReportResponse(
                        row.getSupplierId(), row.getSupplierCode(), row.getSupplierName(),
                        row.getEmail(), row.getPhone(), row.getPurchaseOrderCount(), row.getPurchaseAmount()))
                .toList();
    }

    @Override
    public Page<InventoryTransactionResponse> stockMovements(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId, Pageable pageable
    ) {
        validateDates(startDate, endDate);
        LocalDate endDateExclusive = endDate == null ? null : endDate.plusDays(1);
        return reportRepository.stockMovementReport(startDate, endDate, endDateExclusive,
                productId, categoryId, supplierId, locationId, pageable);
    }

    @Override
    public Page<InventoryValuationReportResponse> inventoryValuation(
            Long productId, Long categoryId, Long locationId, Pageable pageable
    ) {
        return reportRepository.inventoryValuationReport(productId, categoryId, locationId, pageable);
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new InvalidInventoryOperationException("endDate must be on or after startDate.");
        }
    }
}
