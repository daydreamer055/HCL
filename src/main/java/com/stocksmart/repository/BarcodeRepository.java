package com.stocksmart.repository;

import com.stocksmart.entity.Barcode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface BarcodeRepository extends JpaRepository<Barcode, Long>, JpaSpecificationExecutor<Barcode> {

    Optional<Barcode> findByProductId(Long productId);

    Optional<Barcode> findByBarcodeNumberIgnoreCase(String barcodeNumber);

    boolean existsByBarcodeNumberIgnoreCase(String barcodeNumber);

    boolean existsByBarcodeNumberIgnoreCaseAndIdNot(String barcodeNumber, Long id);

    boolean existsByProductId(Long productId);
}
