// Invoice / receipt for an approved order, served by GET /api/orders/{id}/invoice
// (backend SalesInvoiceService). documentType is RECEIPT once nothing is owed,
// INVOICE while a balance remains.
class SalesInvoice {
  final String documentType;
  final String documentNo;
  final DateTime? issuedAt;
  final DateTime? saleDate;
  final DateTime? nextDueDate;
  final String saleType;
  final String paymentStatus;
  final String paymentMethod;
  final List<String> orderReferences;
  final InvoiceCompany company;
  final InvoiceCustomer customer;
  final List<InvoiceLine> items;
  final List<InvoiceCharge> charges;
  final double subtotal;
  final double total;
  final double amountPaid;
  final double balance;
  final String amountInWords;
  final List<InvoicePayment> payments;
  final List<String> notes;

  const SalesInvoice({
    required this.documentType,
    required this.documentNo,
    this.issuedAt,
    this.saleDate,
    this.nextDueDate,
    required this.saleType,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.orderReferences,
    required this.company,
    required this.customer,
    required this.items,
    required this.charges,
    required this.subtotal,
    required this.total,
    required this.amountPaid,
    required this.balance,
    required this.amountInWords,
    required this.payments,
    required this.notes,
  });

  bool get isReceipt => documentType == 'RECEIPT';
  String get label => isReceipt ? 'Receipt' : 'Invoice';

  factory SalesInvoice.fromJson(Map<String, dynamic> json) {
    return SalesInvoice(
      documentType: json['documentType']?.toString() ?? 'INVOICE',
      documentNo: json['documentNo']?.toString() ?? '',
      issuedAt: _date(json['issuedAt']),
      saleDate: _date(json['saleDate']),
      nextDueDate: _date(json['nextDueDate']),
      saleType: json['saleType']?.toString() ?? 'Sale',
      paymentStatus: json['paymentStatus']?.toString() ?? '',
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      orderReferences: _list(json['orderReferences']).map((e) => e.toString()).toList(),
      company: InvoiceCompany.fromJson(_map(json['company'])),
      customer: InvoiceCustomer.fromJson(_map(json['customer'])),
      items: _list(json['items']).map((e) => InvoiceLine.fromJson(_map(e))).toList(),
      charges: _list(json['charges']).map((e) => InvoiceCharge.fromJson(_map(e))).toList(),
      subtotal: _num(json['subtotal']),
      total: _num(json['total']),
      amountPaid: _num(json['amountPaid']),
      balance: _num(json['balance']),
      amountInWords: json['amountInWords']?.toString() ?? '',
      payments: _list(json['payments']).map((e) => InvoicePayment.fromJson(_map(e))).toList(),
      notes: _list(json['notes']).map((e) => e.toString()).toList(),
    );
  }
}

class InvoiceCompany {
  final String name;
  final String tagline;
  final String bankName;
  final String accountName;
  final String accountNumber;

  const InvoiceCompany({
    required this.name,
    required this.tagline,
    required this.bankName,
    required this.accountName,
    required this.accountNumber,
  });

  factory InvoiceCompany.fromJson(Map<String, dynamic> json) => InvoiceCompany(
        name: json['name']?.toString() ?? 'APPGATE NIG LIMITED',
        tagline: json['tagline']?.toString() ?? '',
        bankName: json['bankName']?.toString() ?? '',
        accountName: json['accountName']?.toString() ?? '',
        accountNumber: json['accountNumber']?.toString() ?? '',
      );
}

class InvoiceCustomer {
  final String name;
  final String? accountNumber;
  final String? phone;
  final String? email;
  final String? address;

  const InvoiceCustomer({
    required this.name,
    this.accountNumber,
    this.phone,
    this.email,
    this.address,
  });

  factory InvoiceCustomer.fromJson(Map<String, dynamic> json) => InvoiceCustomer(
        name: json['name']?.toString() ?? 'Customer',
        accountNumber: _text(json['accountNumber']),
        phone: _text(json['phone']),
        email: _text(json['email']),
        address: _text(json['address']),
      );
}

class InvoiceLine {
  final String description;
  final int quantity;
  final double unitPrice;
  final double discount;
  final double amount;

  const InvoiceLine({
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.discount,
    required this.amount,
  });

  factory InvoiceLine.fromJson(Map<String, dynamic> json) => InvoiceLine(
        description: json['description']?.toString() ?? 'Item',
        quantity: _num(json['quantity']).toInt(),
        unitPrice: _num(json['unitPrice']),
        discount: _num(json['discount']),
        amount: _num(json['amount']),
      );
}

class InvoiceCharge {
  final String label;
  final double amount;

  const InvoiceCharge({required this.label, required this.amount});

  factory InvoiceCharge.fromJson(Map<String, dynamic> json) => InvoiceCharge(
        label: json['label']?.toString() ?? '',
        amount: _num(json['amount']),
      );
}

class InvoicePayment {
  final int number;
  final DateTime? date;
  final String? reference;
  final String status;
  final double amount;

  const InvoicePayment({
    required this.number,
    this.date,
    this.reference,
    required this.status,
    required this.amount,
  });

  factory InvoicePayment.fromJson(Map<String, dynamic> json) => InvoicePayment(
        number: _num(json['entryNumber']).toInt(),
        date: _date(json['paidDate'] ?? json['date'] ?? json['dueDate']),
        reference: _text(json['reference']),
        status: json['status']?.toString() ?? '',
        amount: _num(json['amount'] ?? json['amountPaid'] ?? json['amountDue']),
      );
}

double _num(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0.0;
}

DateTime? _date(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}

String? _text(dynamic value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

List<dynamic> _list(dynamic value) => value is List ? value : const [];

Map<String, dynamic> _map(dynamic value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
