class CategoryImages {
  /// Unique real product images for each category
  static String getImage(String categoryName) {
    final name = categoryName.toLowerCase().trim();

    // ====================== MAIN CATEGORIES ======================
    if (name.contains('gadget')) {
      // Gadgets / tech accessories
      return 'assets/images/phones/phone1.png';
    }

    if (name.contains('electronic')) {
      // Electronics (TV / devices)
      return 'assets/images/laptops/accessories4.png';
    }

    if (name.contains('vehicle') ||
        name.contains('cycle') ||
        name.contains('car') ||
        name.contains('motor')) {
      // Vehicles
      return 'assets/images/laptops/accessories6.png';
    }

    if (name.contains('fashion') ||
        name.contains('cloth') ||
        name.contains('Home Appliances')) {
      // Fashion
      return 'assets/images/laptops/accessories6.png';
    }

    if (name.contains('home') ||
        name.contains('furniture') ||
        name.contains('living')) {
      // Home & Furniture
      return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop';
    }

    if (name.contains('beauty') ||
        name.contains('cosmetic') ||
        name.contains('health')) {
      // Beauty & Cosmetics
      return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop';
    }

    if (name.contains('sport') || name.contains('fitness')) {
      // Sports & Fitness
      return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=500&fit=crop';
    }

    if (name.contains('book') || name.contains('stationery')) {
      // Books
      return 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&h=500&fit=crop';
    }

    if (name.contains('toy') || name.contains('game')) {
      // Toys & Games
      return 'https://images.unsplash.com/photo-1558060370-d644839cb27f?w=500&h=500&fit=crop';
    }

    if (name.contains('food') ||
        name.contains('grocery') ||
        name.contains('kitchen')) {
      // Food & Grocery
      return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=500&fit=crop';
    }

    // ====================== SUB / COMMON ======================
    if (name.contains('phone') ||
        name.contains('mobile') ||
        name.contains('smartphone')) {
      // Smartphone
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop';
    }

    if (name.contains('laptop') ||
        name.contains('computer') ||
        name.contains('notebook')) {
      // Laptop
      return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop';
    }

    if (name.contains('watch') ||
        name.contains('smartwatch') ||
        name.contains('wearable')) {
      // Smartwatch (different image)
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
    }

    if (name.contains('camera')) {
      // Camera
      return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop';
    }

    if (name.contains('headphone') ||
        name.contains('earbud') ||
        name.contains('audio') ||
        name.contains('speaker')) {
      // Headphones
      return 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop';
    }

    if (name.contains('powerbank') || name.contains('power bank')) {
      // Powerbank
      return 'https://images.unsplash.com/photo-1609091836351-7fbb3b4a5b1b?w=500&h=500&fit=crop';
    }

    if (name.contains('tablet')) {
      // Tablet
      return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop';
    }

    if (name.contains('charger') || name.contains('cable')) {
      // Chargers & Cables
      return 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop';
    }

    if (name.contains('speaker') || name.contains('bluetooth')) {
      // Bluetooth Speakers
      return 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop';
    }

    // Default (clean phone image - different from others)
    return 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&h=500&fit=crop';
  }
}
