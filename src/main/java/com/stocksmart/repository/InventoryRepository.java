package com.stocksmart.repository;

import com.stocksmart.dto.InventoryByCategoryResponse;
import com.stocksmart.dto.InventoryByLocationResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.LowStockProductResponse;
import com.stocksmart.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long>, JpaSpecificationExecutor<Inventory> {

    Optional<Inventory> findByProductIdAndLocationId(Long productId, Long locationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventory i where i.product.id = :productId and i.location.id = :locationId")
    Optional<Inventory> findByProductAndLocationForUpdate(
            @Param("productId") Long productId,
            @Param("locationId") Long locationId
    );

    @Query("select i from Inventory i where i.product.id = :productId and i.location.id = :locationId")
    Optional<Inventory> findByProductAndLocation(
            @Param("productId") Long productId,
            @Param("locationId") Long locationId
    );

    @Query("select coalesce(sum(i.quantityOnHand * i.product.costPrice), 0) from Inventory i "
            + "where (:locationId is null or i.location.id = :locationId) "
            + "and (:productId is null or i.product.id = :productId)")
    BigDecimal calculateValuation(
            @Param("locationId") Long locationId,
            @Param("productId") Long productId
    );

    Page<Inventory> findByProductId(Long productId, Pageable pageable);

    Page<Inventory> findByLocationId(Long locationId, Pageable pageable);

    @Query("select count(i) from Inventory i where "
            + "(i.quantityOnHand - i.reservedQuantity) <= i.reorderLevel")
    long countLowStockItems();

    @Query("select count(i) from Inventory i where "
            + "(i.quantityOnHand - i.reservedQuantity) = 0")
    long countOutOfStockItems();

    @Query("select new com.stocksmart.dto.InventoryByCategoryResponse("
            + "c.id, c.name, sum(i.quantityOnHand)) "
            + "from Inventory i join i.product p join p.category c "
            + "group by c.id, c.name order by c.name")
    java.util.List<InventoryByCategoryResponse> summarizeQuantityByCategory();

    @Query("select new com.stocksmart.dto.InventoryByLocationResponse("
            + "l.id, l.code, l.name, sum(i.quantityOnHand)) "
            + "from Inventory i join i.location l "
            + "group by l.id, l.code, l.name order by l.name")
    java.util.List<InventoryByLocationResponse> summarizeQuantityByLocation();

    @Query("select new com.stocksmart.dto.LowStockProductResponse("
            + "p.id, p.sku, p.name, l.id, l.name, i.quantityOnHand, i.reservedQuantity, "
            + "(i.quantityOnHand - i.reservedQuantity), i.reorderLevel) "
            + "from Inventory i join i.product p join i.location l "
            + "where (i.quantityOnHand - i.reservedQuantity) <= i.reorderLevel "
            + "order by p.name, l.name")
    Page<LowStockProductResponse> findLowStockProducts(Pageable pageable);

    @Query("select new com.stocksmart.dto.InventoryTransactionResponse("
            + "t.id, p.id, p.sku, p.name, l.id, l.name, dl.id, dl.name, "
            + "t.transactionType, t.quantity, t.transactionAt, t.notes) "
            + "from InventoryTransaction t join t.product p join t.location l "
            + "left join t.destinationLocation dl")
    Page<InventoryTransactionResponse> findRecentTransactions(Pageable pageable);
}
