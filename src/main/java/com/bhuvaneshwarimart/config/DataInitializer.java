package com.bhuvaneshwarimart.config;

import com.bhuvaneshwarimart.model.Product;
import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import com.bhuvaneshwarimart.repository.ProductRepository;
import com.bhuvaneshwarimart.repository.UserRepository;
import com.bhuvaneshwarimart.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Runs once at startup.
 * - Creates default Admin, Seller and Buyer accounts (if they do not exist)
 * - Adds 60 products (30 fruits + 30 vegetables) when the products table is empty
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository users;
    private final ProductRepository products;
    private final AuthService auth;

    public DataInitializer(UserRepository users, ProductRepository products, AuthService auth) {
        this.users = users;
        this.products = products;
        this.auth = auth;
    }

    @Override
    public void run(String... args) {
        createUser("Admin", "admin@mart.com", "admin123", "9000000001", Role.ADMIN);
        User seller = createUser("Bhuvaneshwari Mart", "seller@mart.com", "seller123", "9000000002", Role.SELLER);
        createUser("Demo Buyer", "buyer@mart.com", "buyer123", "9000000003", Role.BUYER);

        if (products.count() == 0) {
            seedProducts(seller);
        }
    }

    private User createUser(String name, String email, String password, String phone, Role role) {
        return users.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setName(name);
            u.setEmail(email);
            u.setPassword(auth.hash(password));
            u.setPhone(phone);
            u.setRole(role);
            return users.save(u);
        });
    }

    private void add(User seller, String name, String tamil, String category, double price, String unit,
                     int stock, String emoji, String description) {
        Product p = new Product();
        p.setName(name);
        p.setTamilName(tamil);
        p.setCategory(category);
        p.setPrice(price);
        p.setUnit(unit);
        p.setStock(stock);
        p.setEmoji(emoji);
        p.setDescription(description);
        p.setSellerId(seller.getId());
        p.setSellerName(seller.getName());
        products.save(p);
    }

    private void seedProducts(User s) {
        String F = "Fruits";
        String V = "Vegetables";

        // ---------------- 30 FRUITS ----------------
        add(s, "Apple", "ஆப்பிள்", F, 180, "kg", 120, "🍎", "Fresh red apples, crisp and sweet");
        add(s, "Green Apple", "பச்சை ஆப்பிள்", F, 220, "kg", 80, "🍏", "Tangy green apples rich in fibre");
        add(s, "Banana", "வாழைப்பழம்", F, 60, "dozen", 200, "🍌", "Ripe yellow bananas");
        add(s, "Orange", "ஆரஞ்சு", F, 90, "kg", 150, "🍊", "Juicy oranges full of vitamin C");
        add(s, "Mango", "மாம்பழம்", F, 120, "kg", 100, "🥭", "Sweet seasonal mangoes");
        add(s, "Black Grapes", "கருப்பு திராட்சை", F, 110, "kg", 90, "🍇", "Seedless black grapes");
        add(s, "Green Grapes", "பச்சை திராட்சை", F, 100, "kg", 90, "🍇", "Sweet seedless green grapes");
        add(s, "Watermelon", "தர்பூசணி", F, 35, "kg", 250, "🍉", "Cool and refreshing watermelon");
        add(s, "Pineapple", "அன்னாசி", F, 55, "piece", 70, "🍍", "Fresh sweet pineapple");
        add(s, "Papaya", "பப்பாளி", F, 40, "kg", 110, "🍈", "Ripe papaya, good for digestion");
        add(s, "Pomegranate", "மாதுளை", F, 160, "kg", 80, "🍎", "Ruby red pomegranate");
        add(s, "Guava", "கொய்யாப்பழம்", F, 70, "kg", 100, "🍐", "Fresh country guava");
        add(s, "Sapota (Chikoo)", "சப்போட்டா", F, 80, "kg", 90, "🍈", "Sweet and soft sapota");
        add(s, "Muskmelon", "முலாம்பழம்", F, 45, "kg", 120, "🍈", "Sweet fragrant muskmelon");
        add(s, "Lemon", "எலுமிச்சை", F, 100, "kg", 130, "🍋", "Fresh sour lemons");
        add(s, "Sweet Lime (Mosambi)", "சாத்துக்குடி", F, 80, "kg", 110, "🍋", "Juicy mosambi for fresh juice");
        add(s, "Strawberry", "ஸ்ட்ராபெர்ரி", F, 120, "box", 60, "🍓", "Fresh strawberries (250 g box)");
        add(s, "Blueberry", "புளூபெர்ரி", F, 250, "box", 40, "🫐", "Antioxidant rich blueberries (125 g box)");
        add(s, "Kiwi", "கிவி", F, 120, "pack", 60, "🥝", "Kiwi fruit, pack of 3");
        add(s, "Pear", "பேரிக்காய்", F, 150, "kg", 70, "🍐", "Crunchy sweet pears");
        add(s, "Peach", "பீச்", F, 200, "kg", 50, "🍑", "Soft juicy peaches");
        add(s, "Plum", "பிளம்ஸ்", F, 180, "kg", 50, "🍑", "Sweet and sour plums");
        add(s, "Cherry", "செர்ரி", F, 600, "kg", 30, "🍒", "Premium red cherries");
        add(s, "Coconut", "தேங்காய்", F, 30, "piece", 300, "🥥", "Fresh whole coconut");
        add(s, "Custard Apple", "சீதாப்பழம்", F, 120, "kg", 60, "🍏", "Creamy sweet custard apple");
        add(s, "Jackfruit", "பலாப்பழம்", F, 60, "kg", 60, "🍈", "Sweet ripe jackfruit");
        add(s, "Fresh Dates", "பேரீச்சம்பழம்", F, 300, "kg", 50, "🌴", "Soft sweet fresh dates");
        add(s, "Fig (Athi)", "அத்திப்பழம்", F, 400, "kg", 40, "🟣", "Fresh figs rich in minerals");
        add(s, "Dragon Fruit", "டிராகன் பழம்", F, 90, "piece", 60, "🐉", "Exotic pink dragon fruit");
        add(s, "Avocado", "அவகாடோ", F, 90, "piece", 50, "🥑", "Creamy ripe avocado");

        // ---------------- 30 VEGETABLES ----------------
        add(s, "Tomato", "தக்காளி", V, 30, "kg", 250, "🍅", "Fresh red tomatoes");
        add(s, "Onion", "வெங்காயம்", V, 40, "kg", 300, "🧅", "Big onions");
        add(s, "Small Onion (Shallots)", "சின்ன வெங்காயம்", V, 90, "kg", 150, "🧅", "Aromatic small onions");
        add(s, "Potato", "உருளைக்கிழங்கு", V, 35, "kg", 300, "🥔", "Fresh potatoes");
        add(s, "Carrot", "கேரட்", V, 55, "kg", 180, "🥕", "Sweet orange carrots");
        add(s, "Brinjal (Eggplant)", "கத்தரிக்காய்", V, 45, "kg", 150, "🍆", "Fresh purple brinjal");
        add(s, "Green Chilli", "பச்சை மிளகாய்", V, 60, "kg", 100, "🌶️", "Spicy green chillies");
        add(s, "Capsicum", "குடை மிளகாய்", V, 70, "kg", 100, "🫑", "Crunchy green capsicum");
        add(s, "Cabbage", "முட்டைக்கோஸ்", V, 30, "kg", 150, "🥬", "Fresh green cabbage");
        add(s, "Cauliflower", "காலிஃபிளவர்", V, 35, "piece", 100, "🥦", "Fresh white cauliflower");
        add(s, "Broccoli", "ப்ரோக்கோலி", V, 70, "piece", 70, "🥦", "Healthy green broccoli");
        add(s, "Beans", "பீன்ஸ்", V, 70, "kg", 120, "🫘", "Tender green beans");
        add(s, "Cucumber", "வெள்ளரிக்காய்", V, 35, "kg", 150, "🥒", "Cool fresh cucumber");
        add(s, "Ladies Finger (Okra)", "வெண்டைக்காய்", V, 50, "kg", 120, "🌿", "Tender ladies finger");
        add(s, "Drumstick", "முருங்கைக்காய்", V, 80, "kg", 100, "🌿", "Fresh long drumsticks");
        add(s, "Beetroot", "பீட்ரூட்", V, 45, "kg", 120, "🟣", "Fresh beetroot");
        add(s, "Radish", "முள்ளங்கி", V, 35, "kg", 100, "🌱", "Crisp white radish");
        add(s, "Pumpkin", "பூசணிக்காய்", V, 25, "kg", 120, "🎃", "Yellow pumpkin");
        add(s, "Bottle Gourd", "சுரைக்காய்", V, 30, "kg", 100, "🥒", "Tender bottle gourd");
        add(s, "Ridge Gourd", "பீர்க்கங்காய்", V, 55, "kg", 90, "🥒", "Fresh ridge gourd");
        add(s, "Bitter Gourd", "பாகற்காய்", V, 60, "kg", 90, "🥒", "Fresh bitter gourd");
        add(s, "Snake Gourd", "புடலங்காய்", V, 45, "kg", 90, "🥒", "Tender snake gourd");
        add(s, "Spinach (Keerai)", "பசலைக்கீரை", V, 15, "bunch", 200, "🥬", "Fresh green spinach");
        add(s, "Coriander Leaves", "கொத்தமல்லி", V, 12, "bunch", 200, "🌿", "Aromatic coriander leaves");
        add(s, "Curry Leaves", "கறிவேப்பிலை", V, 10, "bunch", 200, "🌿", "Fresh curry leaves");
        add(s, "Mint Leaves", "புதினா", V, 12, "bunch", 150, "🌿", "Fresh mint leaves");
        add(s, "Garlic", "பூண்டு", V, 220, "kg", 100, "🧄", "Strong flavoured garlic");
        add(s, "Ginger", "இஞ்சி", V, 160, "kg", 100, "🌱", "Fresh ginger");
        add(s, "Sweet Potato", "சர்க்கரைவள்ளிக்கிழங்கு", V, 60, "kg", 100, "🍠", "Sweet and healthy sweet potato");
        add(s, "Sweet Corn", "சோளம்", V, 20, "piece", 150, "🌽", "Fresh sweet corn cob");

        System.out.println(">>> Seeded " + products.count() + " products (30 fruits + 30 vegetables)");
    }
}
