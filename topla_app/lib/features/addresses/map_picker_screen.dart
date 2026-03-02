import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';
import '../../core/services/nominatim_service.dart';

class MapPickerScreen extends StatefulWidget {
  final double? initialLatitude;
  final double? initialLongitude;

  const MapPickerScreen({
    super.key,
    this.initialLatitude,
    this.initialLongitude,
  });

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  late MapController _mapController;
  LatLng? _selectedPoint;
  String _address = 'Joylashuvni tanlang...';
  bool _isLoading = false;

  // Toshkent markazi (default)
  static const LatLng _tashkentCenter = LatLng(41.2995, 69.2401);

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _selectedPoint =
        widget.initialLatitude != null && widget.initialLongitude != null
            ? LatLng(widget.initialLatitude!, widget.initialLongitude!)
            : _tashkentCenter;

    // Boshlang'ich manzilni olish
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_selectedPoint != null) {
        _getAddressFromPoint(_selectedPoint!);
      }
    });
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoading = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Lokatsiya ruxsati berilmadi');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Lokatsiya ruxsati doimiy rad etilgan');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.high),
      );

      final point = LatLng(position.latitude, position.longitude);

      _mapController.move(point, 17);

      setState(() {
        _selectedPoint = point;
      });

      await _getAddressFromPoint(point);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _getAddressFromPoint(LatLng point) async {
    setState(() => _isLoading = true);
    try {
      final result = await NominatimService.reverseGeocode(
        latitude: point.latitude,
        longitude: point.longitude,
      );

      setState(() {
        _address = result.structuredAddress.isNotEmpty
            ? result.structuredAddress
            : '${point.latitude.toStringAsFixed(6)}, ${point.longitude.toStringAsFixed(6)}';
      });
    } catch (e) {
      debugPrint('Nominatim geocoding xato: $e');
      setState(() {
        _address =
            '${point.latitude.toStringAsFixed(6)}, ${point.longitude.toStringAsFixed(6)}';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _onPositionChanged(MapCamera camera, bool hasGesture) {
    if (hasGesture) {
      setState(() {
        _selectedPoint = camera.center;
      });
    }
  }

  void _onMapMoveEnd(MapCamera camera) async {
    setState(() {
      _selectedPoint = camera.center;
    });
    await _getAddressFromPoint(camera.center);
  }

  void _confirmSelection() {
    if (_selectedPoint != null) {
      Navigator.pop(context, {
        'latitude': _selectedPoint!.latitude,
        'longitude': _selectedPoint!.longitude,
        'address': _address,
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Xarita
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedPoint ?? _tashkentCenter,
              initialZoom: 15,
              onPositionChanged: _onPositionChanged,
              onMapEvent: (event) {
                if (event is MapEventMoveEnd) {
                  _onMapMoveEnd(_mapController.camera);
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=uz_UZ',
                userAgentPackageName: 'com.topla.topla_app',
              ),
            ],
          ),

          // Markaziy pin (har doim ekran markazida)
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 50),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 10,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Iconsax.location,
                      size: 28,
                      color: Colors.white,
                    ),
                  ),
                  Container(
                    width: 3,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Orqaga tugmasi
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Iconsax.arrow_left),
              ),
            ),
          ),

          // Joriy joylashuv tugmasi
          Positioned(
            right: 16,
            bottom: 200,
            child: FloatingActionButton(
              heroTag: 'location_btn',
              backgroundColor: Colors.white,
              onPressed: _isLoading ? null : _getCurrentLocation,
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Iconsax.gps, color: AppColors.primary),
            ),
          ),

          // Pastki panel - tanlangan manzil
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).padding.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Iconsax.location,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Tanlangan manzil',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 4),
                            _isLoading
                                ? const Text(
                                    'Yuklanmoqda...',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.grey,
                                    ),
                                  )
                                : Text(
                                    _address,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _selectedPoint != null && !_isLoading
                          ? _confirmSelection
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        disabledBackgroundColor: Colors.grey.shade300,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Tasdiqlash',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
