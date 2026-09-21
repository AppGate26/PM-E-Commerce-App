import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;

  final List<OnboardingPage> _onboardingPages = [
    OnboardingPage(
      image: 'assets/images/onboarding1.png',
      title: 'WELCOME ON BOARD',
      subtitle: 'Get ready for an amazing experience with PM',
    ),
    OnboardingPage(
      image: 'assets/images/onboarding2.png',
      title: 'PURCHASES SAFE AND FASTER',
      subtitle: 'Make your purchase with peace of mind',
    ),
    OnboardingPage(
      image: 'assets/images/onboarding3.png',
      title: 'WE GIVE YOU THE POWER TO CHOOSE',
      subtitle: 'You have the option to pay in installments and full',
    ),
  ];

  void _nextPage() {
    if (_currentPage < _onboardingPages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      // ✅ On last page, go to Home (not Login)
      _goToHome();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  // ✅ NEW: Go to Home (Start Shopping)
  Future<void> _goToHome() async {
    setState(() {
      _isLoading = true;
    });

    // Mark onboarding as seen
    await StorageService.setOnboardingSeen();

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
      // ✅ Navigate to Home screen
      context.go(AppRoutes.home);
    }
  }

  // ✅ KEEP: For Skip button - go to Login
  Future<void> _goToLogin() async {
    setState(() {
      _isLoading = true;
    });

    // Mark onboarding as seen
    await StorageService.setOnboardingSeen();

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
      context.go(AppRoutes.login);
    }
  }

  void _goToSignup() {
    context.go(AppRoutes.register);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: List.generate(
                      _onboardingPages.length,
                      (index) => _buildCircularDot(index),
                    ),
                  ),
                  // ✅ Show "Sign Up" on last page, "Skip" on others
                  _currentPage == _onboardingPages.length - 1
                      ? TextButton(
                          onPressed: _isLoading ? null : _goToSignup,
                          child: const Text(
                            'Sign Up',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.blueBackground,
                            ),
                          ),
                        )
                      : TextButton(
                          onPressed: _isLoading ? null : _goToLogin,
                          child: const Text(
                            'Skip',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.blueBackground,
                            ),
                          ),
                        ),
                ],
              ),
            ),

            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _onboardingPages.length,
                onPageChanged: (int page) {
                  setState(() {
                    _currentPage = page;
                  });
                },
                itemBuilder: (context, index) {
                  return _buildOnboardingPage(_onboardingPages[index]);
                },
              ),
            ),

            // Bottom Navigation Buttons
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: _currentPage == 0
                  ? _buildFirstScreenButtons()
                  : _buildOtherScreensButtons(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircularDot(int index) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: _currentPage == index
            ? AppColors.blueBackground
            : Colors.transparent,
        shape: BoxShape.circle,
        border: Border.all(
          color: _currentPage == index
              ? AppColors.blueBackground
              : Colors.grey.shade400,
          width: 2,
        ),
      ),
    );
  }

  Widget _buildFirstScreenButtons() {
    return Row(
      children: [
        const Spacer(),
        SizedBox(
          width: 120,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _nextPage,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Next',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 16,
                        color: Colors.white,
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildOtherScreensButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _isLoading ? null : _previousPage,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              side: const BorderSide(color: AppColors.blueBackground),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.arrow_back_ios_rounded,
                  size: 16,
                  color: AppColors.blueBackground,
                ),
                SizedBox(width: 8),
                Text(
                  'Back',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.blueBackground,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 16),

        // Next/Start Shopping Button
        Expanded(
          child: ElevatedButton(
            onPressed: _isLoading ? null : _nextPage,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _currentPage == _onboardingPages.length - 1
                            ? 'Start Shopping'
                            : 'Next',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      if (_currentPage < _onboardingPages.length - 1)
                        const SizedBox(width: 8),
                      if (_currentPage < _onboardingPages.length - 1)
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 16,
                          color: Colors.white,
                        ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildOnboardingPage(OnboardingPage page) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Image
          Container(
            height: 300,
            margin: const EdgeInsets.only(bottom: 40),
            child: Image.asset(
              page.image,
              fit: BoxFit.contain,
            ),
          ),

          // Title
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: AppColors.blueBackground,
              height: 1.3,
            ),
          ),

          const SizedBox(height: 16),

          // Subtitle
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              color: AppColors.blueBackground,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingPage {
  final String image;
  final String title;
  final String subtitle;

  OnboardingPage({
    required this.image,
    required this.title,
    required this.subtitle,
  });
}
