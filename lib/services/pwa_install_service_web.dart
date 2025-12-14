import 'dart:async';
import 'dart:html' as html;
import 'dart:js_util' as js_util;

dynamic _deferredPrompt;
StreamSubscription<html.Event>? _listener;

bool _isStandalone() {
  final media = html.window.matchMedia('(display-mode: standalone)');
  final iosStandalone = js_util.getProperty(html.window.navigator, 'standalone') == true;
  return media.matches || iosStandalone;
}

bool _isIos() {
  final ua = html.window.navigator.userAgent.toLowerCase();
  return ua.contains('iphone') || ua.contains('ipad') || ua.contains('ipod');
}

void initPwaInstallPrompt() {
  // Capture the `beforeinstallprompt` event so we can trigger it later.
  _listener?.cancel();
  _listener = html.EventStreamProvider<html.Event>('beforeinstallprompt')
      .forTarget(html.window)
      .listen((event) {
    event.preventDefault();
    _deferredPrompt = event;
  });
}

bool canShowPwaInstallPrompt() => _deferredPrompt != null && !_isStandalone();

/// Returns a user-friendly reason when the prompt cannot be shown; null when available.
String? getPwaInstallBlocker() {
  if (_isStandalone()) return 'The app is already installed.';
  if (_isIos()) return 'On iOS, tap the Share button and choose "Add to Home Screen".';
  if (_deferredPrompt == null) {
    return 'Install prompt isn\'t ready yet—try a refresh and make sure you\'re on Chrome/Edge or Android.';
  }
  return null;
}

Future<bool> showPwaInstallPrompt() async {
  if (_deferredPrompt == null) return false;

  await js_util.callMethod(_deferredPrompt!, 'prompt', []);
  final choice = await js_util.promiseToFuture(
    js_util.getProperty(_deferredPrompt!, 'userChoice'),
  );

  final outcome = js_util.getProperty(choice, 'outcome');
  _deferredPrompt = null;
  return outcome == 'accepted';
}