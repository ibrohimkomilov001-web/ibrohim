import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/localization/app_localizations.dart';

/// Shtrix-kod skaneri
/// Natijani qaytaradi: Navigator.pop(context, barcodeValue)
class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _hasScanned = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    final code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() => _hasScanned = true);
    Navigator.of(context).pop(code);
  }

  @override
  Widget build(BuildContext context) {
    final isUzbek = context.l10n.locale.languageCode == 'uz';

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        title: Text(
          isUzbek ? 'Shtrix-kod skaneri' : 'Сканер штрих-кода',
          style: const TextStyle(fontSize: 18),
        ),
        actions: [
          // Torch toggle
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, state, child) {
              return IconButton(
                icon: Icon(
                  state.torchState == TorchState.on
                      ? Icons.flash_on
                      : Icons.flash_off,
                  color: Colors.white,
                ),
                onPressed: () => _controller.toggleTorch(),
              );
            },
          ),
          // Camera switch
          IconButton(
            icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera preview
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // Overlay with scanning area
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border:
                    Border.all(color: Colors.white.withValues(alpha: 0.8), width: 2),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),

          // Bottom instruction
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Text(
              isUzbek
                  ? 'Shtrix-kodni ramka ichiga joylashtiring'
                  : 'Поместите штрих-код в рамку',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
