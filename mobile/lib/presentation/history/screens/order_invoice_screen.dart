import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/sales_invoice_model.dart';
import 'package:pm_e_commerce_app/presentation/history/utils/invoice_pdf.dart';
import 'package:printing/printing.dart';

// Shows an approved order's invoice/receipt as the same A4 PDF the customer can
// share or print (Save as PDF) from the preview toolbar.
class OrderInvoiceScreen extends StatelessWidget {
  final SalesInvoice invoice;

  const OrderInvoiceScreen({super.key, required this.invoice});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          '${invoice.label} ${invoice.documentNo}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      body: PdfPreview(
        build: (_) => InvoicePdf.build(invoice),
        pdfFileName: InvoicePdf.fileName(invoice),
        canChangePageFormat: false,
        canChangeOrientation: false,
        canDebug: false,
        allowPrinting: true,
        allowSharing: true,
      ),
    );
  }
}
