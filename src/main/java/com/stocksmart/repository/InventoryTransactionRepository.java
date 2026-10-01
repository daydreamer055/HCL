package com.stocksmart.repository;

import com.stocksmart.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long>,
        JpaSpecificationExecutor<InventoryTransaction> {

    Page<InventoryTransaction> findByProductId(Long productId, Pageable pageable);

    Page<InventoryTransaction> findByLocationId(Long locationId, Pageable pageable);
}
