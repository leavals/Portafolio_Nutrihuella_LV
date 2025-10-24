// lib/features/payments/webpay_post_web.dart
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;

void postForm(String action, Map<String, String> fields) {
  final form = html.FormElement()
    ..method = 'POST'
    ..action = action
    ..style.display = 'none';

  fields.forEach((k, v) {
    final input = html.InputElement()
      ..type = 'hidden'
      ..name = k
      ..value = v;
    form.children.add(input);
  });

  html.document.body?.children.add(form);
  form.submit();
  form.remove();
}
