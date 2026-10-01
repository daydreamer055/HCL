package com.stocksmart.repository;

import com.stocksmart.entity.PurchaseOrder;
import com.stocksmart.dto.DashboardDateTotalProjection;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long>,
        JpaSpecificationExecutor<PurchaseOrder> {

    boolean existsByOrderNumberIgnoreCase(String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select po from PurchaseOrder po where po.id = :id")
    Optional<PurchaseOrder> findByIdForUpdate(@Param("id") Long id);

    Page<PurchaseOrder> findBySupplierId(Long supplierId, Pageable pageable);

    Page<PurchaseOrder> findByLocationId(Long locationId, Pageable pageable);

    long countByStatusIn(java.util.Collection<com.stocksmart.entity.PurchaseOrderStatus> statuses);

    @Query(value = "select to_char(trunc(po.ORDER_DATE), 'YYYY-MM-DD') as \"dateKey\", "
            + "sum(po.TOTAL_AMOUNT) as \"totalAmount\" "
            + "from PURCHASE_ORDER po "
            + "where po.ORDER_STATUS = 'RECEIVED' "
            + "group by trunc(po.ORDER_DATE) "
            + "order by trunc(po.ORDER_DATE)", nativeQuery = true)
    java.util.List<DashboardDateTotalProjection> summarizeReceivedOrdersByDate();
}
