import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/services/api_client.dart';
import '../../providers/providers.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _devices = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _api.get('/auth/devices');
      final data = response.dataList;
      setState(() {
        _devices = data.cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _removeDevice(String id) async {
    try {
      await _api.delete('/auth/devices/$id');
      if (mounted) Navigator.pop(context);
      setState(() {
        _devices.removeWhere((d) => d['id'] == id);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sessiya yakunlandi'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _terminateAllOtherSessions() async {
    if (_devices.length <= 1) return;

    final currentDeviceId = _devices.first['id'] as String?;

    final confirmed = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(
          'Boshqa barcha seanslarni tugatmoqchimisiz?',
          style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade700),
        ),
        actions: [
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Boshqa seanslarni tugatish',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(
            'Bekor qilish',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade800,
            ),
          ),
        ),
      ),
    );

    if (confirmed != true) return;

    try {
      await _api.post('/auth/devices/terminate-others', body: {
        'currentDeviceId': currentDeviceId,
      });
      setState(() {
        if (_devices.isNotEmpty) {
          _devices = [_devices.first];
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Boshqa barcha seanslar yakunlandi'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'onlayn';
      if (diff.inMinutes < 60) return '${diff.inMinutes} daqiqa oldin';
      if (diff.inHours < 24) return '${diff.inHours} soat oldin';
      if (diff.inDays < 7) return '${diff.inDays} kun oldin';

      return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
    } catch (_) {
      return '';
    }
  }

  bool _isOnline(String? dateStr) {
    if (dateStr == null) return false;
    try {
      final date = DateTime.parse(dateStr);
      return DateTime.now().difference(date).inMinutes < 5;
    } catch (_) {
      return false;
    }
  }

  String _getDeviceApp(Map<String, dynamic> device) {
    final browser = device['browser'] as String?;
    final platform = device['platform'] as String?;
    if (browser != null && browser.isNotEmpty) {
      return browser;
    }
    if (platform == 'android') return 'TOPLA Android';
    if (platform == 'ios') return 'TOPLA iOS';
    return 'TOPLA Web';
  }

  void _showDeviceDetail(Map<String, dynamic> device,
      {bool isCurrentDevice = false}) {
    final platform = device['platform'] as String?;
    final deviceName = device['deviceName'] as String? ?? 'Noma\'lum qurilma';
    final ipAddress = device['ipAddress'] as String?;
    final lastActiveAt = device['lastActiveAt'] as String?;
    final id = device['id'] as String;
    final isOnline = _isOnline(lastActiveAt);
    final appName = _getDeviceApp(device);
    final location = device['location'] as String?;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DeviceDetailSheet(
        deviceName: deviceName,
        platform: platform,
        appName: appName,
        ipAddress: ipAddress,
        location: location,
        isOnline: isOnline,
        timeAgo: _formatDate(lastActiveAt),
        isCurrentDevice: isCurrentDevice,
        onTerminate: () {
          if (isCurrentDevice) {
            _logoutCurrentDevice();
          } else {
            _removeDevice(id);
          }
        },
      ),
    );
  }

  Future<void> _logoutCurrentDevice() async {
    Navigator.pop(context); // close bottom sheet
    final confirmed = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(
          'Hisobingizdan chiqmoqchimisiz?',
          style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade700),
        ),
        actions: [
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Hisobdan chiqish',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(
            'Bekor qilish',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade800,
            ),
          ),
        ),
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<AuthProvider>().signOut();
      if (mounted) Navigator.pop(context); // close devices screen
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Qurilmalar',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _devices.isEmpty
                  ? _buildEmpty()
                  : _buildDevicesList(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Iconsax.warning_2, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'Qurilmalarni yuklab bo\'lmadi',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadDevices,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Qayta yuklash'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.mobile_copy, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Hech qanday qurilma topilmadi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDevicesList() {
    final currentDevice = _devices.isNotEmpty ? _devices.first : null;
    final otherDevices =
        _devices.length > 1 ? _devices.sublist(1) : <Map<String, dynamic>>[];

    return RefreshIndicator(
      onRefresh: _loadDevices,
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          // === BU QURILMA ===
          if (currentDevice != null) ...[
            _buildSectionHeader('BU QURILMA'),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  _buildDeviceTile(currentDevice, isCurrentDevice: true),
                  if (otherDevices.isNotEmpty) ...[
                    Divider(
                        height: 1,
                        indent: 16,
                        endIndent: 16,
                        color: Colors.grey.shade200),
                    // Boshqa barcha seanslarni yakunlash
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _terminateAllOtherSessions,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          child: Row(
                            children: [
                              Icon(Iconsax.logout_copy,
                                  color: Colors.red.shade400, size: 20),
                              const SizedBox(width: 12),
                              const Text(
                                'Boshqa barcha seanslarni yakunlash',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (otherDevices.isNotEmpty) ...[
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Bu qurilmadan tashqari barcha qurilmalardan chiqib ketiladi.',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                ),
              ),
            ],
          ],

          // === FAOL SEANSLAR ===
          if (otherDevices.isNotEmpty) ...[
            const SizedBox(height: 20),
            _buildSectionHeader('FAOL SEANSLAR'),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  for (int i = 0; i < otherDevices.length; i++) ...[
                    _buildDeviceTile(otherDevices[i]),
                    if (i < otherDevices.length - 1)
                      Divider(
                        height: 1,
                        indent: 68,
                        color: Colors.grey.shade200,
                      ),
                  ],
                ],
              ),
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: Colors.grey.shade500,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _buildDeviceTile(Map<String, dynamic> device,
      {bool isCurrentDevice = false}) {
    final platform = device['platform'] as String?;
    final deviceName = device['deviceName'] as String? ?? 'Noma\'lum qurilma';
    final lastActiveAt = device['lastActiveAt'] as String?;
    final isOnline = _isOnline(lastActiveAt);
    final appName = _getDeviceApp(device);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () =>
            _showDeviceDetail(device, isCurrentDevice: isCurrentDevice),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              _DeviceIcon(platform: platform, size: 40),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      deviceName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$appName • ${isOnline ? 'onlayn' : _formatDate(lastActiveAt)}',
                      style: TextStyle(
                        color: isOnline
                            ? const Color(0xFF4FC3F7)
                            : Colors.grey.shade500,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================
// Device Detail Bottom Sheet (Light theme)
// ============================================
class _DeviceDetailSheet extends StatelessWidget {
  final String deviceName;
  final String? platform;
  final String appName;
  final String? ipAddress;
  final String? location;
  final bool isOnline;
  final String timeAgo;
  final bool isCurrentDevice;
  final VoidCallback onTerminate;

  const _DeviceDetailSheet({
    required this.deviceName,
    required this.platform,
    required this.appName,
    required this.ipAddress,
    this.location,
    required this.isOnline,
    required this.timeAgo,
    this.isCurrentDevice = false,
    required this.onTerminate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              const SizedBox(height: 18),

              // Device icon + name + status in a row
              Row(
                children: [
                  _DeviceIcon(platform: platform, size: 44),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          deviceName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1A1A2E),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isOnline ? 'onlayn' : timeAgo,
                          style: TextStyle(
                            color: isOnline
                                ? const Color(0xFF4CAF50)
                                : Colors.grey.shade500,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Icon(Icons.close,
                        size: 20, color: Colors.grey.shade400),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Info rows
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    _infoRow('Ilova', appName,
                        showDivider: ipAddress != null || location != null),
                    if (ipAddress != null)
                      _infoRow('IP manzil', ipAddress!,
                          showDivider: location != null),
                    if (location != null)
                      _infoRow('Joylashuv', location!, showDivider: false),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Terminate button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: onTerminate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE53935),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: const StadiumBorder(),
                  ),
                  child: Text(
                    isCurrentDevice ? 'Hisobdan chiqish' : 'Seansni tugatish',
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool showDivider = true}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(color: Colors.black54, fontSize: 13)),
              Text(value,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            ],
          ),
        ),
        if (showDivider)
          Divider(
              height: 1,
              indent: 14,
              endIndent: 14,
              color: Colors.grey.shade200),
      ],
    );
  }
}

// ============================================
// Static Device Icon (for list tiles)
// ============================================
class _DeviceIcon extends StatelessWidget {
  final String? platform;
  final double size;

  const _DeviceIcon({required this.platform, required this.size});

  @override
  Widget build(BuildContext context) {
    final isAndroid = platform?.toLowerCase() == 'android';
    final isIos = platform?.toLowerCase() == 'ios';

    final Color bgColor;
    final IconData icon;

    if (isAndroid) {
      bgColor = const Color(0xFF4CAF50);
      icon = Icons.android;
    } else if (isIos) {
      bgColor = const Color(0xFF2196F3);
      icon = Icons.phone_iphone;
    } else {
      bgColor = const Color(0xFF9C27B0);
      icon = Icons.desktop_windows_rounded;
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(size * 0.25),
      ),
      child: Icon(icon, color: Colors.white, size: size * 0.55),
    );
  }
}

// ============================================
// Animated Device Icon (for bottom sheet detail)
// ============================================
class _AnimatedDeviceIcon extends StatefulWidget {
  final String? platform;
  final double size;

  const _AnimatedDeviceIcon({required this.platform, required this.size});

  @override
  State<_AnimatedDeviceIcon> createState() => _AnimatedDeviceIconState();
}

class _AnimatedDeviceIconState extends State<_AnimatedDeviceIcon>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _bounceController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();

    // Pulse glow animation
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Bounce-in animation
    _bounceController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _bounceAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.elasticOut),
    );

    _bounceController.forward();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _bounceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isAndroid = widget.platform?.toLowerCase() == 'android';
    final isIos = widget.platform?.toLowerCase() == 'ios';

    final Color bgColor;
    final IconData icon;

    if (isAndroid) {
      bgColor = const Color(0xFF4CAF50);
      icon = Icons.android;
    } else if (isIos) {
      bgColor = const Color(0xFF2196F3);
      icon = Icons.phone_iphone;
    } else {
      bgColor = const Color(0xFF9C27B0);
      icon = Icons.desktop_windows_rounded;
    }

    return AnimatedBuilder(
      animation: Listenable.merge([_pulseController, _bounceController]),
      builder: (context, child) {
        final scale = _bounceAnimation.value;
        final glowOpacity = 0.15 + (_pulseAnimation.value * 0.15);

        return Transform.scale(
          scale: scale,
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(widget.size * 0.25),
              boxShadow: [
                BoxShadow(
                  color: bgColor.withValues(alpha: glowOpacity),
                  blurRadius: 20 + (_pulseAnimation.value * 10),
                  spreadRadius: 2 + (_pulseAnimation.value * 4),
                ),
              ],
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: widget.size * 0.55,
            ),
          ),
        );
      },
    );
  }
}
