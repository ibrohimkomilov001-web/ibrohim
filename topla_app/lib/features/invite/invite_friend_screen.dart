import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/api_client.dart';
import '../../widgets/glass_back_button.dart';

class InviteFriendScreen extends StatefulWidget {
  const InviteFriendScreen({super.key});

  @override
  State<InviteFriendScreen> createState() => _InviteFriendScreenState();
}

class _InviteFriendScreenState extends State<InviteFriendScreen> {
  final ApiClient _api = ApiClient();

  // Referral data
  String _referralCode = '';
  int _points = 0;
  int _totalInvited = 0;
  int _registrationPoints = 10;
  int _purchasePoints = 5;
  int _minPurchaseAmount = 100000;
  List<Map<String, dynamic>> _referrals = [];
  List<Map<String, dynamic>> _pointLogs = [];

  // Rewards
  List<Map<String, dynamic>> _rewards = [];

  bool _isLoading = true;
  String? _error;

  // Apply code
  final TextEditingController _applyCodeController = TextEditingController();
  bool _isApplying = false;

  // Claiming reward
  String? _claimingRewardId;

  // Concurrent load guard
  bool _isLoadingInProgress = false;

  @override
  void initState() {
    super.initState();
    debugPrint('📨 InviteFriend: initState called');
    _loadAllData();
  }

  @override
  void dispose() {
    _applyCodeController.dispose();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    // Prevent concurrent loads
    if (_isLoadingInProgress) return;
    _isLoadingInProgress = true;

    if (!mounted) {
      _isLoadingInProgress = false;
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });

    int successCount = 0;
    String? lastError;

    // 1) Load referral code
    try {
      final codeResponse =
          await _api.get('/referral/code').timeout(const Duration(seconds: 15));
      if (!mounted) {
        _isLoadingInProgress = false;
        return;
      }
      final codeData = codeResponse.dataMap;
      _referralCode = (codeData['code'] ?? '').toString();
      successCount++;
    } catch (e) {
      lastError = e.toString();
    }

    // 2) Load stats (independent — doesn't affect rewards)
    try {
      final statsResponse = await _api
          .get('/referral/stats')
          .timeout(const Duration(seconds: 15));
      if (!mounted) {
        _isLoadingInProgress = false;
        return;
      }
      final statsData = statsResponse.dataMap;
      _points = _toInt(statsData['points']);
      _totalInvited = _toInt(statsData['totalInvited']);
      _registrationPoints =
          _toInt(statsData['registrationPoints'], fallback: 10);
      _purchasePoints = _toInt(statsData['purchasePoints'], fallback: 5);
      _minPurchaseAmount =
          _toInt(statsData['minPurchaseAmount'], fallback: 100000);
      _referrals = _toMapList(statsData['referrals']);
      _pointLogs = _toMapList(statsData['pointLogs']);
      successCount++;
    } catch (e) {
      lastError = e.toString();
    }

    // 3) Load rewards (independent — doesn't affect stats)
    try {
      final rewardsResponse = await _api
          .get('/referral/rewards')
          .timeout(const Duration(seconds: 15));
      if (!mounted) {
        _isLoadingInProgress = false;
        return;
      }
      final rewardsRaw = rewardsResponse.data;
      if (rewardsRaw is List) {
        _rewards = _toMapList(rewardsRaw);
      } else {
        _rewards = _toMapList(rewardsResponse.dataMap);
      }
      successCount++;
    } catch (e) {
      lastError = e.toString();
    }

    if (!mounted) {
      _isLoadingInProgress = false;
      return;
    }

    // If ALL 3 calls failed — show error
    if (successCount == 0) {
      setState(() {
        _isLoading = false;
        _error = lastError ?? 'Xatolik yuz berdi';
      });
    } else {
      setState(() => _isLoading = false);
    }

    _isLoadingInProgress = false;
  }

  int _toInt(dynamic value, {int fallback = 0}) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  List<Map<String, dynamic>> _toMapList(dynamic value) {
    if (value is! List) return [];
    try {
      return value
          .map((e) =>
              e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _applyCode() async {
    final code = _applyCodeController.text.trim();
    if (code.isEmpty) return;

    setState(() => _isApplying = true);
    try {
      await _api.post('/referral/apply', body: {'code': code});
      if (mounted) {
        _applyCodeController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('code_applied')),
            backgroundColor: AppColors.success,
          ),
        );
        _loadAllData();
      }
    } catch (e) {
      debugPrint('📨 InviteFriend: Apply code error: $e');
    }
    if (mounted) setState(() => _isApplying = false);
  }

  Future<void> _claimReward(Map<String, dynamic> reward) async {
    final id = (reward['id'] ?? '').toString();
    final pointsCost = _toInt(reward['pointsCost']);

    if (_points < pointsCost) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('not_enough_points')),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _claimingRewardId = id);
    try {
      await _api.post('/referral/rewards/$id/claim', body: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('reward_claimed')),
            backgroundColor: AppColors.success,
          ),
        );
        _loadAllData();
      }
    } catch (e) {
      debugPrint('📨 InviteFriend: Claim reward error: $e');
    }
    if (mounted) setState(() => _claimingRewardId = null);
  }

  String get _referralLink => 'https://topla.uz/invite/$_referralCode';

  void _shareLink() {
    try {
      final l10n = context.l10n;
      final text =
          '${l10n.translate('share_text')}: $_referralCode $_referralLink';
      Share.share(text);
    } catch (e) {
      // Fallback if share fails on some devices
      if (mounted) {
        Clipboard.setData(ClipboardData(text: _referralLink));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Link nusxalandi')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        leading: const GlassBackButton(),
        title: Text(
          l10n.translate('invite_friends'),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: _safeBody(l10n),
    );
  }

  Widget _safeBody(AppLocalizations l10n) {
    try {
      return _buildBody(l10n);
    } catch (e, stack) {
      debugPrint('📨 InviteFriend: BUILD ERROR: $e\n$stack');
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              const Text('Sahifani yuklashda xatolik',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadAllData,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Qayta yuklash'),
              ),
            ],
          ),
        ),
      );
    }
  }

  Widget _buildBody(AppLocalizations l10n) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      debugPrint('📨 InviteFriend: Error state: $_error');
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text('Ma\'lumotlarni yuklab bo\'lmadi',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade700)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadAllData,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Qayta yuklash'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAllData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            _safeBuild('PointsCard', () => _buildPointsCard(l10n)),
            const SizedBox(height: 16),
            _safeBuild('ReferralCode', () => _buildReferralCodeCard(l10n)),
            const SizedBox(height: 16),
            _safeBuild('HowItWorks', () => _buildHowItWorks(l10n)),
            if (_rewards.isNotEmpty) ...[
              const SizedBox(height: 20),
              _safeBuild('Rewards', () => _buildRewardsSection(l10n)),
            ],
            const SizedBox(height: 20),
            _safeBuild('ApplyCode', () => _buildApplyCodeCard(l10n)),
            if (_referrals.isNotEmpty) ...[
              const SizedBox(height: 20),
              _safeBuild('Friends', () => _buildFriendsList(l10n)),
            ],
            if (_pointLogs.isNotEmpty) ...[
              const SizedBox(height: 20),
              _safeBuild('PointsHistory', () => _buildPointsHistory(l10n)),
            ],
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _safeBuild(String name, Widget Function() builder) {
    try {
      return builder();
    } catch (e, stack) {
      debugPrint('📨 InviteFriend: _safeBuild($name) ERROR: $e\n$stack');
      return const SizedBox.shrink();
    }
  }

  // ==========================================
  // Points Balance Card
  // ==========================================
  Widget _buildPointsCard(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child:
                    const Icon(Iconsax.star_1, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.translate('my_points'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$_points ${l10n.translate('points_short')}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              // Invited count badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      '$_totalInvited',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      l10n.translate('friends_count'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Share button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _shareLink,
              icon: const Icon(Iconsax.share, size: 18),
              label: Text(l10n.translate('share')),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // Referral Code Card (compact)
  // ==========================================
  Widget _buildReferralCodeCard(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.translate('your_code'),
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  _referralCode,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ),
          // Copy code button
          Material(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                Clipboard.setData(ClipboardData(text: _referralCode));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(l10n.translate('code_copied')),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Iconsax.copy, color: AppColors.primary, size: 20),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Copy link button
          Material(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                Clipboard.setData(ClipboardData(text: _referralLink));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(l10n.translate('link_copied')),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Iconsax.link, color: AppColors.primary, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // How It Works — compact info pills
  // ==========================================
  Widget _buildHowItWorks(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.translate('how_it_works'),
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 14),
          _buildInfoRow(
            icon: Iconsax.user_add,
            color: AppColors.primary,
            label: l10n.translate('reg_bonus_info'),
            value: '+$_registrationPoints ${l10n.translate('points_short')}',
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Iconsax.shopping_cart,
            color: AppColors.success,
            label: l10n.translate('purchase_bonus_info'),
            value: '+$_purchasePoints ${l10n.translate('points_short')}',
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Iconsax.money_recive,
            color: Colors.orange,
            label: l10n.translate('min_purchase_info'),
            value: '${_formatPrice(_minPurchaseAmount)} so\'m',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  // ==========================================
  // Rewards Catalog
  // ==========================================
  Widget _buildRewardsSection(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 12),
          child: Text(
            l10n.translate('rewards_catalog'),
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
          ),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.70,
          ),
          itemCount: _rewards.length,
          itemBuilder: (context, index) =>
              _buildRewardCard(_rewards[index], l10n),
        ),
      ],
    );
  }

  Widget _buildRewardCard(Map<String, dynamic> reward, AppLocalizations l10n) {
    final name = (reward['nameUz'] ?? reward['nameRu'] ?? '').toString();
    final description = (reward['description'] ?? '').toString();
    final pointsCost = _toInt(reward['pointsCost']);
    final type = (reward['type'] ?? '').toString();
    final stock = reward['stock'];
    final isOutOfStock = stock != null && _toInt(stock) <= 0;
    final canAfford = _points >= pointsCost;
    final rewardId = (reward['id'] ?? '').toString();
    final isClaiming = _claimingRewardId == rewardId;

    // Icon based on type
    IconData rewardIcon;
    Color iconColor;
    switch (type) {
      case 'promo_fixed':
      case 'promo_percent':
        rewardIcon = Iconsax.ticket_discount;
        iconColor = AppColors.primary;
        break;
      case 'free_delivery':
        rewardIcon = Iconsax.truck_fast;
        iconColor = AppColors.success;
        break;
      case 'physical_gift':
        rewardIcon = Iconsax.gift;
        iconColor = Colors.orange;
        break;
      default:
        rewardIcon = Iconsax.gift;
        iconColor = AppColors.primary;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(rewardIcon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 10),
          // Name
          Text(
            name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              description,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
            ),
          ],
          const Spacer(),
          // Cost
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: canAfford
                  ? AppColors.primary.withValues(alpha: 0.08)
                  : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Iconsax.star_1,
                  size: 14,
                  color: canAfford ? AppColors.primary : Colors.grey,
                ),
                const SizedBox(width: 4),
                Text(
                  '$pointsCost',
                  style: TextStyle(
                    color: canAfford ? AppColors.primary : Colors.grey,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          // Claim button
          SizedBox(
            width: double.infinity,
            height: 32,
            child: isOutOfStock
                ? Center(
                    child: Text(
                      l10n.translate('out_of_stock'),
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  )
                : ElevatedButton(
                    onPressed: (canAfford && !isClaiming)
                        ? () => _claimReward(reward)
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade200,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      textStyle: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    child: isClaiming
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(l10n.translate('claim_reward')),
                  ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // Apply Code Card (compact)
  // ==========================================
  Widget _buildApplyCodeCard(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.translate('have_friend_code'),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _applyCodeController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: l10n.translate('enter_code_hint'),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 46,
                child: ElevatedButton(
                  onPressed: _isApplying ? null : _applyCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isApplying
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(l10n.translate('apply')),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // Friends List
  // ==========================================
  Widget _buildFriendsList(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.people, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                l10n.translate('friends_count'),
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Text(
                '$_totalInvited',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._referrals.take(10).map((ref) {
            final name = (ref['friendName'] ?? 'Foydalanuvchi').toString();
            final createdAt =
                DateTime.tryParse((ref['createdAt'] ?? '').toString());
            final regBonus = ref['registrationBonusGiven'] == true;
            final purchaseBonus = ref['purchaseBonusGiven'] == true;

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13)),
                        if (createdAt != null)
                          Text(
                            '${createdAt.day}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}',
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey.shade500),
                          ),
                      ],
                    ),
                  ),
                  // Status badges
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildMiniStatus(
                        icon: Iconsax.user_tick,
                        isActive: regBonus,
                        tooltip: l10n.translate('friend_registered'),
                      ),
                      const SizedBox(width: 4),
                      _buildMiniStatus(
                        icon: Iconsax.shopping_bag,
                        isActive: purchaseBonus,
                        tooltip: l10n.translate('friend_purchased'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildMiniStatus({
    required IconData icon,
    required bool isActive,
    required String tooltip,
  }) {
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.success.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 14,
          color: isActive ? AppColors.success : Colors.grey.shade400,
        ),
      ),
    );
  }

  // ==========================================
  // Points History
  // ==========================================
  Widget _buildPointsHistory(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.clock, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                l10n.translate('points_history'),
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._pointLogs.take(15).map((log) {
            final amount = _toInt(log['amount']);
            final type = (log['type'] ?? '').toString();
            final description = (log['description'] ?? '').toString();
            final createdAt =
                DateTime.tryParse((log['createdAt'] ?? '').toString());
            final isPositive = amount > 0;

            // Icon & color per type
            IconData logIcon;
            Color logColor;
            switch (type) {
              case 'friend_registered':
                logIcon = Iconsax.user_add;
                logColor = AppColors.primary;
                break;
              case 'friend_purchased':
                logIcon = Iconsax.shopping_cart;
                logColor = AppColors.success;
                break;
              case 'reward_claimed':
                logIcon = Iconsax.gift;
                logColor = Colors.orange;
                break;
              case 'admin_adjustment':
                logIcon = Iconsax.setting_2;
                logColor = Colors.purple;
                break;
              default:
                logIcon = Iconsax.star_1;
                logColor = AppColors.primary;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: logColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(logIcon, color: logColor, size: 16),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          description,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        if (createdAt != null)
                          Text(
                            '${createdAt.day}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}',
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey.shade500),
                          ),
                      ],
                    ),
                  ),
                  Text(
                    '${isPositive ? '+' : ''}$amount',
                    style: TextStyle(
                      color: isPositive ? AppColors.success : Colors.red,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ==========================================
  // Utils
  // ==========================================
  String _formatPrice(int price) {
    final str = price.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) buffer.write(' ');
    }
    return buffer.toString().split('').reversed.join();
  }
}
