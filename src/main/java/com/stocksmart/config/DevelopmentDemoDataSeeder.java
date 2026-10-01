package com.stocksmart.config;

import com.stocksmart.entity.Category;
import com.stocksmart.entity.Inventory;
import com.stocksmart.entity.Location;
import com.stocksmart.entity.LocationStatus;
import com.stocksmart.entity.LocationType;
import com.stocksmart.entity.Product;
import com.stocksmart.entity.ProductStatus;
import com.stocksmart.entity.Supplier;
import com.stocksmart.entity.SupplierStatus;
import com.stocksmart.repository.CategoryRepository;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.SupplierRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@Profile("dev")
@Order(2)
public class DevelopmentDemoDataSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public DevelopmentDemoDataSeeder(
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Category beverages = category("Beverages", "Coffee, tea, and other drinks.");
        Category pantry = category("Pantry", "Shelf-stable grocery essentials.");

        Supplier northstar = supplier("DEMO-SUP-01", "Northstar Wholesale", "orders@northstar.example.test");
        Supplier greenfield = supplier("DEMO-SUP-02", "Greenfield Goods", "sales@greenfield.example.test");

        Location store = location("DEMO-STORE-01", "Downtown Store", LocationType.STORE, "Springfield");
        Location warehouse = location(
                "DEMO-WH-01", "Central Warehouse", LocationType.WAREHOUSE, "Springfield");

        Product coffee = product(
                "DEMO-COF-001", "House Blend Coffee", "Medium-roast whole bean coffee, 1 kg.",
                "14.99", "8.50", "8", beverages, northstar);
        Product tea = product(
                "DEMO-TEA-001", "Jasmine Green Tea", "Loose-leaf green tea, 200 g.",
                "9.49", "4.25", "10", beverages, northstar);
        Product pasta = product(
                "DEMO-PAN-001", "Durum Wheat Pasta", "Traditional pasta, 500 g.",
                "3.49", "1.40", "12", pantry, greenfield);
        Product oliveOil = product(
                "DEMO-PAN-002", "Extra Virgin Olive Oil", "Cold-pressed olive oil, 750 ml.",
                "12.99", "7.10", "6", pantry, greenfield);
        Product granola = product(
                "DEMO-PAN-003", "Honey Almond Granola", "Crunchy granola, 400 g.",
                "6.99", "3.20", "5", pantry, northstar);

        inventory(coffee, store, "4");
        inventory(coffee, warehouse, "24");
        inventory(tea, store, "0");
        inventory(tea, warehouse, "8");
        inventory(pasta, store, "9");
        inventory(pasta, warehouse, "35");
        inventory(oliveOil, store, "1");
        inventory(oliveOil, warehouse, "3");
        inventory(granola, store, "0");
        inventory(granola, warehouse, "0");
    }

    private Category category(String name, String description) {
        return categoryRepository.findAll().stream()
                .filter(existing -> existing.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(name);
                    category.setDescription(description);
                    return categoryRepository.save(category);
                });
    }

    private Supplier supplier(String code, String name, String email) {
        return supplierRepository.findAll().stream()
                .filter(existing -> existing.getSupplierCode().equalsIgnoreCase(code))
                .findFirst()
                .orElseGet(() -> {
                    Supplier supplier = new Supplier();
                    supplier.setSupplierCode(code);
                    supplier.setCompanyName(name);
                    supplier.setContactName("Demo Contact");
                    supplier.setEmail(email);
                    supplier.setPhone("+1 555 010 0100");
                    supplier.setAddress("100 Market Street");
                    supplier.setCity("Springfield");
                    supplier.setState("CA");
                    supplier.setCountry("US");
                    supplier.setStatus(SupplierStatus.ACTIVE);
                    return supplierRepository.save(supplier);
                });
    }

    private Location location(String code, String name, LocationType type, String city) {
        return locationRepository.findAll().stream()
                .filter(existing -> existing.getCode().equalsIgnoreCase(code))
                .findFirst()
                .orElseGet(() -> {
                    Location location = new Location();
                    location.setCode(code);
                    location.setName(name);
                    location.setLocationType(type);
                    location.setAddress(type == LocationType.STORE
                            ? "25 Main Street"
                            : "800 Distribution Way");
                    location.setCity(city);
                    location.setState("CA");
                    location.setCountry("US");
                    location.setPhone("+1 555 010 0101");
                    location.setManagerName("Demo Manager");
                    location.setStatus(LocationStatus.ACTIVE);
                    return locationRepository.save(location);
                });
    }

    private Product product(
            String sku,
            String name,
            String description,
            String price,
            String cost,
            String reorderLevel,
            Category category,
            Supplier supplier
    ) {
        return productRepository.findAll().stream()
                .filter(existing -> existing.getSku().equalsIgnoreCase(sku))
                .findFirst()
                .orElseGet(() -> {
                    Product product = new Product();
                    product.setSku(sku);
                    product.setName(name);
                    product.setDescription(description);
                    product.setUnitPrice(new BigDecimal(price));
                    product.setCostPrice(new BigDecimal(cost));
                    product.setReorderLevel(new BigDecimal(reorderLevel));
                    product.setCategory(category);
                    product.setSupplier(supplier);
                    product.setStatus(ProductStatus.ACTIVE);
                    return productRepository.save(product);
                });
    }

    private void inventory(Product product, Location location, String quantity) {
        if (inventoryRepository.findByProductIdAndLocationId(product.getId(), location.getId()).isPresent()) {
            return;
        }
        Inventory inventory = new Inventory();
        inventory.setProduct(product);
        inventory.setLocation(location);
        inventory.setQuantityOnHand(new BigDecimal(quantity));
        inventory.setReservedQuantity(BigDecimal.ZERO);
        inventory.setReorderLevel(product.getReorderLevel());
        inventoryRepository.save(inventory);
    }
}
