import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class ShopPhoneScreen extends StatelessWidget {
  const ShopPhoneScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final phones = [
      {
        'name': 'Itel S23',
        'price': '₦120,000',
        'image': 'assets/images/phone1.png'
      },
      {
        'name': 'Samsung A14',
        'price': '₦180,000',
        'image': 'assets/images/phone2.png'
      },
      {
        'name': 'Infinix Hot 40',
        'price': '₦150,000',
        'image': 'assets/images/phone4.png'
      },
      {
        'name': 'iPhone 11',
        'price': '₦420,000',
        'image': 'assets/images/phone3.png'
      },
      {
        'name': 'Infinix Hot 40',
        'price': '₦150,000',
        'image': 'assets/images/phone4.png'
      },
      {
        'name': 'iPhone 11',
        'price': '₦420,000',
        'image': 'assets/images/phone3.png'
      },
    ];

    final phoneBrands = [
      'assets/images/phone1.png',
      'assets/images/phone2.png',
      'assets/images/phone3.png',
      'assets/images/phone4.png',
      'assets/images/phone1.png',
      'assets/images/phone1.png',
      'assets/images/phone1.png',
      'assets/images/phone2.png',
    ];

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 1,
        surfaceTintColor: Colors.transparent,
        title: const Text('Phones'),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 5),
        child: Column(
          children: [
            // Search Bar
            TextField(
              decoration: InputDecoration(
                hintText: 'Search Phone',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: AppColors.whiteBackground,
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),

            const SizedBox(height: 10),
            // images of products
            SizedBox(
              height: 80,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: phoneBrands.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        return Container(
                          width: 60,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.whiteBackground,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.withOpacity(0.1),
                                blurRadius: 3,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Image.asset(
                              phoneBrands[index],
                              fit: BoxFit.contain,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Product Grid
            Expanded(
              child: GridView.builder(
                itemCount: phones.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 15,
                  crossAxisSpacing: 15,
                  childAspectRatio: 0.85,
                ),
                itemBuilder: (context, index) {
                  final phone = phones[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.1),
                          blurRadius: 5,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Image - Reduced padding
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(
                                8.0), // 👈 Reduced from 12 to 8
                            child: Center(
                              child: Image.asset(
                                phone['image']!,
                                fit: BoxFit.contain,
                                height: 80, // 👈 Reduced from 100 to 80
                              ),
                            ),
                          ),
                        ),

                        // Product Name
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            phone['name']!,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),

                        const SizedBox(height: 6), // 👈 Reduced from 8 to 6

                        // Price and Button Row
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: SizedBox(
                            height: 28, // 👈 Reduced from 32 to 28
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                // Price
                                Flexible(
                                  child: Text(
                                    phone['price']!,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.blueBackground,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),

                                const SizedBox(width: 4),

                                // Buy Button
                                Container(
                                  constraints: const BoxConstraints(
                                    minWidth: 65, // 👈 Reduced from 70
                                    maxWidth: 75, // 👈 Reduced from 80
                                  ),
                                  height: 28, // 👈 Reduced from 32 to 28
                                  decoration: BoxDecoration(
                                    color: AppColors.blueBackground,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      onTap: () {},
                                      borderRadius: BorderRadius.circular(8),
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(
                                            horizontal:
                                                6), // 👈 Reduced padding
                                        child: Center(
                                          child: Text(
                                            'Buy Once',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize:
                                                  10, // 👈 Reduced from 11
                                              fontWeight: FontWeight.w600,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 8), // 👈 Reduced from 12 to 8
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
