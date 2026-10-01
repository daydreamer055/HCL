package com.stocksmart.repository;

import com.stocksmart.entity.RfidTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface RfidTagRepository extends JpaRepository<RfidTag, Long>, JpaSpecificationExecutor<RfidTag> {

    Optional<RfidTag> findByTagCodeIgnoreCase(String tagCode);

    boolean existsByTagCodeIgnoreCase(String tagCode);
}
