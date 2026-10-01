package com.stocksmart.repository;

import com.stocksmart.dto.InventoryReportResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationReportResponse;
import com.stocksmart.dto.PurchaseReportResponse;
import com.stocksmart.dto.SalesReportResponse;
import com.stocksmart.dto.SupplierReportResponse;
import com.stocksmart.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReportRepository extends Repository<Inventory, Long> {

    @Query(value = """
            select new com.stocksmart.dto.InventoryReportResponse(
                i.id, p.id, p.sku, p.name, c.id, c.name,
                s.id, s.companyName, l.id, l.name,
                i.quantityOnHand, i.reservedQuantity,
                (i.quantityOnHand - i.reservedQuantity), i.reorderLevel,
                p.costPrice, (i.quantityOnHand * p.costPrice))
            from Inventory i
            join i.product p
            join p.category c
            left join p.supplier s
            join i.location l
            where (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId)
            """,
            countQuery = """
            select count(i)
            from Inventory i join i.product p join p.category c
            left join p.supplier s join i.location l
            where (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId)
            """)
    Page<InventoryReportResponse> inventoryReport(
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("locationId") Long locationId,
            Pageable pageable
    );

    @Query(value = """
            select new com.stocksmart.dto.InventoryReportResponse(
                i.id, p.id, p.sku, p.name, c.id, c.name,
                s.id, s.companyName, l.id, l.name,
                i.quantityOnHand, i.reservedQuantity,
                (i.quantityOnHand - i.reservedQuantity), i.reorderLevel,
                p.costPrice, (i.quantityOnHand * p.costPrice))
            from Inventory i
            join i.product p
            join p.category c
            left join p.supplier s
            join i.location l
            where (i.quantityOnHand - i.reservedQuantity) > 0
              and (i.quantityOnHand - i.reservedQuantity) <= i.reorderLevel
              and (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId)
            """,
            countQuery = """
            select count(i)
            from Inventory i join i.product p join p.category c
            left join p.supplier s join i.location l
            where (i.quantityOnHand - i.reservedQuantity) > 0
              and (i.quantityOnHand - i.reservedQuantity) <= i.reorderLevel
              and (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId)
            """)
    Page<InventoryReportResponse> lowStockReport(
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("locationId") Long locationId,
            Pageable pageable
    );

    @Query(value = """
            select new com.stocksmart.dto.InventoryReportResponse(
                i.id, p.id, p.sku, p.name, c.id, c.name,
                s.id, s.companyName, l.id, l.name,
                i.quantityOnHand, i.reservedQuantity,
                (i.quantityOnHand - i.reservedQuantity), i.reorderLevel,
                p.costPrice, (i.quantityOnHand * p.costPrice))
            from Inventory i
            join i.product p
            join p.category c
            left join p.supplier s
            join i.location l
            where (i.quantityOnHand - i.reservedQuantity) <= 0
              and (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId)
            """,
            countQuery = """
            select count(i)
            from Inventory i join i.product p join p.category c
            left join p.supplier s join i.location l
            where (i.quantityOnHand - i.reservedQuantity) <= 0
              and (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId)
            """)
    Page<InventoryReportResponse> outOfStockReport(
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("locationId") Long locationId,
            Pageable pageable
    );

    @Query(value = """
            select new com.stocksmart.dto.InventoryValuationReportResponse(
                p.id, p.sku, p.name, c.id, c.name, l.id, l.name,
                i.quantityOnHand, p.costPrice, (i.quantityOnHand * p.costPrice))
            from Inventory i
            join i.product p
            join p.category c
            join i.location l
            where (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:locationId is null or l.id = :locationId)
            """,
            countQuery = """
            select count(i)
            from Inventory i join i.product p join p.category c join i.location l
            where (:productId is null or p.id = :productId)
              and (:categoryId is null or c.id = :categoryId)
              and (:locationId is null or l.id = :locationId)
            """)
    Page<InventoryValuationReportResponse> inventoryValuationReport(
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("locationId") Long locationId,
            Pageable pageable
    );

    @Query(value = """
            select new com.stocksmart.dto.InventoryTransactionResponse(
                t.id, p.id, p.sku, p.name, l.id, l.name, dl.id, dl.name,
                t.transactionType, t.quantity, t.transactionAt, t.notes)
            from InventoryTransaction t
            join t.product p
            join t.location l
            left join t.destinationLocation dl
            left join p.supplier s
            where (:startDate is null or t.transactionAt >= :startDate)
              and (:endDate is null or t.transactionAt < :endDateExclusive)
              and (:productId is null or p.id = :productId)
              and (:categoryId is null or p.category.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId or dl.id = :locationId)
            """,
            countQuery = """
            select count(t)
            from InventoryTransaction t join t.product p join t.location l
            left join t.destinationLocation dl left join p.supplier s
            where (:startDate is null or t.transactionAt >= :startDate)
              and (:endDate is null or t.transactionAt < :endDateExclusive)
              and (:productId is null or p.id = :productId)
              and (:categoryId is null or p.category.id = :categoryId)
              and (:supplierId is null or s.id = :supplierId)
              and (:locationId is null or l.id = :locationId or dl.id = :locationId)
            """)
    Page<InventoryTransactionResponse> stockMovementReport(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("endDateExclusive") LocalDate endDateExclusive,
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("locationId") Long locationId,
            Pageable pageable
    );

    @Query(value = """
            select to_char(trunc(o.ORDER_DATE), 'YYYY-MM-DD') as "reportDate",
                   count(distinct o.ID) as "orderCount",
                   sum(i.QUANTITY) as "itemQuantity",
                   sum(i.SUBTOTAL) as "totalAmount"
            from SALES_ORDER o
            join SALES_ORDER_ITEM i on i.SALES_ORDER_ID = o.ID
            join PRODUCT p on p.ID = i.PRODUCT_ID
            where o.ORDER_STATUS = 'COMPLETED'
              and (:startDate is null or o.ORDER_DATE >= :startDate)
              and (:endDate is null or o.ORDER_DATE < :endDateExclusive)
              and (:productId is null or p.ID = :productId)
              and (:categoryId is null or p.CATEGORY_ID = :categoryId)
              and (:supplierId is null or p.SUPPLIER_ID = :supplierId)
              and (:locationId is null or o.LOCATION_ID = :locationId)
            group by trunc(o.ORDER_DATE)
            order by trunc(o.ORDER_DATE)
            """, nativeQuery = true)
    List<SalesReportProjection> salesReport(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("endDateExclusive") LocalDate endDateExclusive,
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("locationId") Long locationId
    );

    @Query(value = """
            select to_char(trunc(o.ORDER_DATE), 'YYYY-MM-DD') as "reportDate",
                   count(distinct o.ID) as "orderCount",
                   sum(i.QUANTITY) as "itemQuantity",
                   sum(i.SUBTOTAL) as "totalAmount"
            from PURCHASE_ORDER o
            join PURCHASE_ORDER_ITEM i on i.PURCHASE_ORDER_ID = o.ID
            join PRODUCT p on p.ID = i.PRODUCT_ID
            where o.ORDER_STATUS = 'RECEIVED'
              and (:startDate is null or o.ORDER_DATE >= :startDate)
              and (:endDate is null or o.ORDER_DATE < :endDateExclusive)
              and (:productId is null or p.ID = :productId)
              and (:categoryId is null or p.CATEGORY_ID = :categoryId)
              and (:supplierId is null or o.SUPPLIER_ID = :supplierId)
              and (:locationId is null or o.LOCATION_ID = :locationId)
            group by trunc(o.ORDER_DATE)
            order by trunc(o.ORDER_DATE)
            """, nativeQuery = true)
    List<PurchaseReportProjection> purchaseReport(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("endDateExclusive") LocalDate endDateExclusive,
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("locationId") Long locationId
    );

    @Query(value = """
            select s.ID as "supplierId",
                   s.SUPPLIER_CODE as "supplierCode",
                   s.COMPANY_NAME as "supplierName",
                   s.EMAIL as "email",
                   s.PHONE as "phone",
                   count(distinct o.ID) as "purchaseOrderCount",
                   coalesce(sum(i.SUBTOTAL), 0) as "purchaseAmount"
            from SUPPLIER s
            left join PURCHASE_ORDER o
              on o.SUPPLIER_ID = s.ID
             and o.ORDER_STATUS = 'RECEIVED'
             and (:startDate is null or o.ORDER_DATE >= :startDate)
             and (:endDate is null or o.ORDER_DATE < :endDateExclusive)
             and (:locationId is null or o.LOCATION_ID = :locationId)
            left join PURCHASE_ORDER_ITEM i on i.PURCHASE_ORDER_ID = o.ID
            left join PRODUCT p on p.ID = i.PRODUCT_ID
            where (:supplierId is null or s.ID = :supplierId)
              and (:productId is null or p.ID = :productId)
              and (:categoryId is null or p.CATEGORY_ID = :categoryId)
            group by s.ID, s.SUPPLIER_CODE, s.COMPANY_NAME, s.EMAIL, s.PHONE
            order by s.COMPANY_NAME
            """, nativeQuery = true)
    List<SupplierReportProjection> supplierReport(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("endDateExclusive") LocalDate endDateExclusive,
            @Param("supplierId") Long supplierId,
            @Param("productId") Long productId,
            @Param("categoryId") Long categoryId,
            @Param("locationId") Long locationId
    );

    interface SalesReportProjection {
        String getReportDate();
        Long getOrderCount();
        java.math.BigDecimal getItemQuantity();
        java.math.BigDecimal getTotalAmount();
    }

    interface PurchaseReportProjection {
        String getReportDate();
        Long getOrderCount();
        java.math.BigDecimal getItemQuantity();
        java.math.BigDecimal getTotalAmount();
    }

    interface SupplierReportProjection {
        Long getSupplierId();
        String getSupplierCode();
        String getSupplierName();
        String getEmail();
        String getPhone();
        Long getPurchaseOrderCount();
        java.math.BigDecimal getPurchaseAmount();
    }
}
