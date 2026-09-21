import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/wallet_models.dart';

class WalletRepository {
  final ApiClient _apiClient = ApiClient();

  Future<WalletBalance> getBalance(int userId) async {
    final url = ApiConstants.normalizeUrl(ApiConstants.walletBalance(userId));
    final response = await _apiClient.dio.get(url);
    _log('GET BALANCE', url, response.data);
    
    // Check if wallet not found (API returns 200 with status 404 in body)
    final responseData = response.data;
    final statusCode = responseData is Map<String, dynamic> 
        ? responseData['status'] 
        : null;
    final message = responseData is Map<String, dynamic>
        ? responseData['message']?.toString().toLowerCase()
        : null;
    
    // If wallet not found, create it and retry
    if (statusCode == 404 || (message != null && message.contains('wallet not found'))) {
      _log('WALLET NOT FOUND', 'Creating wallet for user $userId', null);
      await createWallet(userId);
      // Retry getting balance after creating wallet
      final retryResponse = await _apiClient.dio.get(url);
      _log('GET BALANCE (RETRY)', url, retryResponse.data);
      _validateResponse(retryResponse);
      return WalletBalance.fromJson(retryResponse.data);
    }
    
    _validateResponse(response);
    return WalletBalance.fromJson(response.data);
  }

  Future<List<WalletTransaction>> getTransactions(int userId, {int page = 0}) async {
    final url = ApiConstants.normalizeUrl(ApiConstants.walletTransactions(userId, page: page));
    final response = await _apiClient.dio.get(url);
    _log('GET TRANSACTIONS', url, response.data);
    _validateResponse(response);

    final payload = response.data['data'] ?? response.data['response'] ?? {};
    final content = (payload['content'] ?? []) as List<dynamic>;
    return content.map((json) => WalletTransaction.fromJson(json)).toList();
  }

  Future<void> createWallet(int userId) async {
    final url = ApiConstants.normalizeUrl(ApiConstants.createWallet(userId));
    final response = await _apiClient.dio.post(url);
    _log('CREATE WALLET', url, response.data);
    _validateResponse(response);
  }

  Future<void> addMoney({required int userId, required double amount, required String paymentMethod}) async {
    final url = ApiConstants.normalizeUrl(ApiConstants.addMoney);
    final response = await _apiClient.dio.post(url, data: {
      'userId': userId,
      'amount': amount,
      'paymentMethod': paymentMethod,
    });
    _log('ADD MONEY', url, response.data);
    _validateResponse(response);
  }

  Future<void> transferFunds(WalletTransferRequest request) async {
    final url = ApiConstants.normalizeUrl(ApiConstants.transferFunds);
    final response = await _apiClient.dio.post(url, data: request.toJson());
    _log('TRANSFER FUNDS', url, response.data);
    _validateResponse(response);
  }

  Future<void> verifyFunding(String paymentReference) async {
    final url = ApiConstants.normalizeUrl(ApiConstants.verifyFunding(paymentReference));
    final response = await _apiClient.dio.get(url);
    _log('VERIFY FUNDING', url, response.data);
    _validateResponse(response);
  }

  void _validateResponse(Response response) {
    if (response.statusCode != 200) {
      throw response.data['message'] ?? 'Wallet request failed';
    }
  }

  void _log(String label, String url, dynamic data) {
    // ignore: avoid_print
    print('💼 [$label] $url\n📥 $data');
  }
}
