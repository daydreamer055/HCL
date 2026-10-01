package com.stocksmart.dto;

import java.math.BigDecimal;

public interface DashboardDateTotalProjection {

    String getDateKey();

    BigDecimal getTotalAmount();
}
