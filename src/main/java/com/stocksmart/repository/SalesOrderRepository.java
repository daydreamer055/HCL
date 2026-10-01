package com.stocksmart.repository;

import com.stocksmart.entity.SalesOrder;
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

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>,
        JpaSpecificationExecutor<SalesOrder> {

    boolean existsByOrderNumberIgnoreCase(String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select so from SalesOrder so where so.id = :id")
    Optional<SalesOrder> findByIdForUpdate(@Param("id") Long id);

    Page<SalesOrder> findByLocationId(Long locationId, Pageable pageable);

    long countByStatusIn(java.util.Collection<com.stocksmart.entity.SalesOrderStatus> statuses);

    @Query(value = "select to_char(trunc(so.ORDER_DATE), 'YYYY-MM-DD') as \"dateKey\", "
            + "sum(so.TOTAL_AMOUNT) as \"totalAmount\" "
            + "from SALES_ORDER so "
            + "where so.ORDER_STATUS = 'COMPLETED' "
            + "group by trunc(so.ORDER_DATE) "
            + "order by trunc(so.ORDER_DATE)", nativeQuery = true)
    java.util.List<DashboardDateTotalProjection> summarizeCompletedOrdersByDate();
}
