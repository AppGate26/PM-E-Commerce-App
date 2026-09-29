import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pm_e_commerce_app/data/models/sales_invoice_model.dart';

// A4 PDF of an invoice/receipt, laid out after the APPGATE_Invoice template:
// centred letterhead, bill-to + meta block, blue-header item table, total bar,
// amount in words, payment details, notes and signatory. The built-in PDF fonts
// have no Naira glyph, so amounts are written as "NGN".
class InvoicePdf {
  static const _blue = PdfColor.fromInt(0xFF1A73E8);
  static const _ink = PdfColor.fromInt(0xFF202124);
  static const _muted = PdfColor.fromInt(0xFF5F6368);
  static const _tint = PdfColor.fromInt(0xFFE8F0FE);
  static const _grey = PdfColor.fromInt(0xFFF1F3F4);
  static const _panel = PdfColor.fromInt(0xFFF8F9FA);
  static const _rule = PdfColor.fromInt(0xFFE0E0E0);

  static final _money = NumberFormat('#,##0.00');
  static final _date = DateFormat('d MMMM yyyy');

  static String money(double value) => 'NGN ${_money.format(value)}';

  static String fileName(SalesInvoice invoice) => '${invoice.label}_${invoice.documentNo}.pdf';

  static Future<Uint8List> build(SalesInvoice invoice) async {
    final doc = pw.Document(title: '${invoice.label} ${invoice.documentNo}', author: invoice.company.name);
    final showDiscount = invoice.items.any((line) => line.discount > 0);

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.fromLTRB(40, 36, 40, 36),
        theme: pw.ThemeData.withFont(
          base: pw.Font.helvetica(),
          bold: pw.Font.helveticaBold(),
          italic: pw.Font.helveticaOblique(),
        ).copyWith(defaultTextStyle: const pw.TextStyle(fontSize: 9.5, color: _ink)),
        build: (context) => [
          _letterhead(invoice),
          pw.SizedBox(height: 16),
          _meta(invoice),
          pw.SizedBox(height: 14),
          _summary(invoice),
          pw.SizedBox(height: 16),
          _title('Items Purchased'),
          _itemsTable(invoice, showDiscount),
          pw.SizedBox(height: 8),
          pw.RichText(
            text: pw.TextSpan(children: [
              pw.TextSpan(text: 'Amount in words: ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: _muted)),
              pw.TextSpan(text: invoice.amountInWords, style: pw.TextStyle(fontStyle: pw.FontStyle.italic)),
            ]),
          ),
          pw.SizedBox(height: 16),
          _title('Payment Details'),
          _paymentBox(invoice),
          if (invoice.payments.isNotEmpty) ...[
            pw.SizedBox(height: 16),
            _title('Payment History'),
            _paymentsTable(invoice),
          ],
          pw.SizedBox(height: 16),
          _title('Notes'),
          ...invoice.notes.map((note) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 3),
                child: pw.Bullet(text: note, style: const pw.TextStyle(color: _muted, fontSize: 9)),
              )),
          pw.SizedBox(height: 18),
          pw.Center(
            child: pw.Text('Thank you for your patronage.', style: pw.TextStyle(fontStyle: pw.FontStyle.italic)),
          ),
          pw.SizedBox(height: 30),
          pw.Align(
            alignment: pw.Alignment.centerRight,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text('For ${invoice.company.name}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 26),
                pw.Text('____________________________'),
                pw.Text('Authorized Signatory', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
    return doc.save();
  }

  static pw.Widget _letterhead(SalesInvoice invoice) => pw.Container(
        width: double.infinity,
        padding: const pw.EdgeInsets.only(bottom: 8),
        decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: _blue, width: 2))),
        child: pw.Column(children: [
          pw.Text(invoice.company.name,
              style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: _blue)),
          if (invoice.company.tagline.isNotEmpty)
            pw.Text(invoice.company.tagline, style: const pw.TextStyle(fontSize: 9, color: _muted)),
        ]),
      );

  static pw.Widget _meta(SalesInvoice invoice) {
    final customer = invoice.customer;
    final metaRows = <List<String>>[
      ['${invoice.label} No.:', invoice.documentNo],
      ['${invoice.label} Date:', invoice.issuedAt != null ? _date.format(invoice.issuedAt!) : '-'],
      if (invoice.saleDate != null) ['Sale Date:', _date.format(invoice.saleDate!)],
      if (!invoice.isReceipt)
        ['Due On:', invoice.nextDueDate != null ? _date.format(invoice.nextDueDate!) : 'Per payment schedule'],
      ['Currency:', 'NGN'],
    ];
    return pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.end,
      children: [
        pw.Expanded(
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(invoice.isReceipt ? 'RECEIPT' : 'INVOICE',
                  style: pw.TextStyle(fontSize: 17, fontWeight: pw.FontWeight.bold, letterSpacing: 1)),
              pw.SizedBox(height: 6),
              pw.Text(invoice.isReceipt ? 'Received From:' : 'Bill To:',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: _muted)),
              pw.Text(customer.name, style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold)),
              for (final line in [customer.accountNumber, customer.phone, customer.email, customer.address])
                if (line != null) pw.Text(line),
            ],
          ),
        ),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            for (final row in metaRows)
              pw.RichText(
                text: pw.TextSpan(children: [
                  pw.TextSpan(text: '${row[0]}  ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: _muted)),
                  pw.TextSpan(text: row[1], style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                ]),
              ),
          ],
        ),
      ],
    );
  }

  static pw.Widget _summary(SalesInvoice invoice) => pw.Container(
        width: double.infinity,
        padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: const pw.BoxDecoration(
          color: _tint,
          border: pw.Border(left: pw.BorderSide(color: _blue, width: 4)),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('SALE', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: _blue, letterSpacing: 1)),
            pw.Text(invoice.items.map((line) => line.description).join(', '),
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            pw.Text('${invoice.saleType} - Order ref ${invoice.orderReferences.join(', ')}',
                style: const pw.TextStyle(color: _muted)),
          ],
        ),
      );

  static pw.Widget _title(String text) => pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 6),
        child: pw.Text(text, style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: _blue)),
      );

  static pw.Widget _cell(String text, {bool header = false, bool right = false, bool bold = false, PdfColor? color}) =>
      pw.Padding(
        padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
        child: pw.Text(
          text,
          textAlign: right ? pw.TextAlign.right : pw.TextAlign.left,
          style: pw.TextStyle(
            color: header ? PdfColors.white : (color ?? _ink),
            fontWeight: header || bold ? pw.FontWeight.bold : pw.FontWeight.normal,
          ),
        ),
      );

  static pw.Widget _itemsTable(SalesInvoice invoice, bool showDiscount) {
    final headers = ['S/N', 'Description', 'Qty', 'Unit Price', if (showDiscount) 'Discount', 'Amount (NGN)'];
    final amountCol = headers.length - 1;
    pw.TableRow footer(String label, double amount, {bool total = false}) => pw.TableRow(
          decoration: total ? const pw.BoxDecoration(color: _grey) : null,
          children: [
            for (var i = 0; i < amountCol; i++)
              i == amountCol - 1 ? _cell(label, right: true, bold: total) : pw.SizedBox(),
            _cell(amount < 0 ? '- ${_money.format(-amount)}' : _money.format(amount),
                right: true, bold: total, color: total ? _blue : null),
          ],
        );

    return pw.Table(
      columnWidths: {
        0: const pw.FixedColumnWidth(28),
        1: const pw.FlexColumnWidth(4),
        2: const pw.FixedColumnWidth(30),
        3: const pw.FlexColumnWidth(1.6),
        if (showDiscount) 4: const pw.FlexColumnWidth(1.4),
        amountCol: const pw.FlexColumnWidth(1.8),
      },
      border: const pw.TableBorder(horizontalInside: pw.BorderSide(color: _rule, width: 0.6)),
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _blue),
          children: [
            for (var i = 0; i < headers.length; i++) _cell(headers[i], header: true, right: i >= 2),
          ],
        ),
        for (var i = 0; i < invoice.items.length; i++)
          pw.TableRow(children: [
            _cell('${i + 1}'),
            _cell(invoice.items[i].description),
            _cell('${invoice.items[i].quantity}', right: true),
            _cell(_money.format(invoice.items[i].unitPrice), right: true),
            if (showDiscount) _cell(_money.format(invoice.items[i].discount), right: true),
            _cell(_money.format(invoice.items[i].amount), right: true),
          ]),
        if (invoice.charges.isNotEmpty) ...[
          footer('Subtotal', invoice.subtotal),
          for (final charge in invoice.charges) footer(charge.label, charge.amount),
        ],
        footer(invoice.isReceipt ? 'TOTAL AMOUNT' : 'TOTAL INVOICE AMOUNT', invoice.total, total: true),
      ],
    );
  }

  static pw.Widget _paymentBox(SalesInvoice invoice) {
    final rows = <List<String>>[
      ['Payment Method:', invoice.paymentMethod],
      ['Payment Status:', invoice.paymentStatus],
      ['Amount Paid:', money(invoice.amountPaid)],
      ['Balance Due:', money(invoice.balance)],
      if (invoice.balance > 0) ...[
        ['Bank Name:', invoice.company.bankName],
        ['Account Name:', invoice.company.accountName],
        ['Account Number:', invoice.company.accountNumber],
      ],
    ];
    return pw.Container(
      width: double.infinity,
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(color: _panel, border: pw.Border.all(color: _rule)),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          for (final row in rows)
            pw.Padding(
              padding: const pw.EdgeInsets.only(bottom: 2),
              child: pw.RichText(
                text: pw.TextSpan(children: [
                  pw.TextSpan(text: '${row[0]}  ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: _muted)),
                  pw.TextSpan(text: row[1], style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                ]),
              ),
            ),
        ],
      ),
    );
  }

  static pw.Widget _paymentsTable(SalesInvoice invoice) => pw.Table(
        border: const pw.TableBorder(horizontalInside: pw.BorderSide(color: _rule, width: 0.6)),
        columnWidths: const {
          0: pw.FixedColumnWidth(24),
          1: pw.FlexColumnWidth(1.6),
          2: pw.FlexColumnWidth(2.4),
          3: pw.FlexColumnWidth(1.2),
          4: pw.FlexColumnWidth(1.6),
        },
        children: [
          pw.TableRow(
            decoration: const pw.BoxDecoration(color: _blue),
            children: [
              _cell('#', header: true),
              _cell('Date', header: true),
              _cell('Reference', header: true),
              _cell('Status', header: true),
              _cell('Amount (NGN)', header: true, right: true),
            ],
          ),
          for (final payment in invoice.payments)
            pw.TableRow(children: [
              _cell('${payment.number}'),
              _cell(payment.date != null ? _date.format(payment.date!) : '-'),
              _cell(payment.reference ?? '-'),
              _cell(payment.status),
              _cell(_money.format(payment.amount), right: true),
            ]),
        ],
      );
}
