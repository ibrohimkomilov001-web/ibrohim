import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/loyalty_model.dart';
import '../../providers/loyalty_provider.dart';

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LoyaltyProvider>().loadAccount();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: Consumer<LoyaltyProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.account == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null && provider.account == null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    l10n.translate('loyalty_error'),
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => provider.loadAccount(),
                    child: Text(l10n.retry),
                  ),
                ],
              ),
            );
          }

          final account = provider.account;
          if (account == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadAccount(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  _buildHeader(account, provider),
                  const SizedBox(height: 16),
                  _buildTierProgress(account),
                  const SizedBox(height: 16),
                  _buildDailyLogin(provider),
                  const SizedBox(height: 16),
                  _buildBenefits(account),
                  const SizedBox(height: 16),
                  _buildPointHistory(account),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ===== Header =====
  Widget _buildHeader(LoyaltyAccount account, LoyaltyProvider provider) {
    final tier = account.tier;
    final isUz = context.l10n.locale.languageCode == 'uz';
    final tierName = isUz ? tier.nameUz : tier.nameRu;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: _tierGradient(tier),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            children: [
              // App bar
              Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.chevron_left_rounded,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      context.l10n.translate('loyalty_title'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 19,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),

              const SizedBox(height: 20),

              // Tier badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_tierIcon(tier), color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      tierName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Points
              Text(
                account.availablePoints.toStringAsFixed(0),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 42,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                context.l10n.translate('loyalty_available_points'),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 14,
                ),
              ),

              const SizedBox(height: 16),

              // Stats row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatItem(
                    context.l10n.translate('loyalty_total'),
                    account.totalPoints.toStringAsFixed(0),
                  ),
                  Container(
                    width: 1,
                    height: 30,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                  _buildStatItem(
                    context.l10n.translate('loyalty_lifetime'),
                    account.lifetimePoints.toStringAsFixed(0),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.7),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  // ===== Tier Progress =====
  Widget _buildTierProgress(LoyaltyAccount account) {
    final progress = account.tierProgress;
    if (progress == null) return const SizedBox.shrink();

    final isUz = context.l10n.locale.languageCode == 'uz';
    final nextTierName = progress.nextTier != null
        ? (isUz
            ? LoyaltyTier.fromString(progress.nextTier!).nameUz
            : LoyaltyTier.fromString(progress.nextTier!).nameRu)
        : null;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.translate('loyalty_tier_progress'),
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              if (nextTierName != null)
                Text(
                  '${progress.progress}%',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress.progress / 100,
              minHeight: 10,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(
                _tierPrimaryColor(account.tier),
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (nextTierName != null && progress.nextThreshold != null)
            Text(
              '${context.l10n.translate('loyalty_next_tier')}: $nextTierName (${_formatNumber(progress.nextThreshold!)} ${context.l10n.translate('loyalty_points')})',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            )
          else
            Text(
              context.l10n.translate('loyalty_max_tier'),
              style: TextStyle(
                color: _tierPrimaryColor(account.tier),
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
        ],
      ),
    );
  }

  // ===== Daily Login =====
  Widget _buildDailyLogin(LoyaltyProvider provider) {
    final claimed = provider.dailyClaimed;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: claimed
              ? null
              : () async {
                  HapticFeedback.mediumImpact();
                  final points = await provider.claimDailyLogin();
                  if (points != null && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          '+$points ${context.l10n.translate('loyalty_points')}! 🎉',
                        ),
                        backgroundColor: AppColors.success,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  } else if (provider.error != null && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(context.l10n.translate('loyalty_already_claimed')),
                        backgroundColor: Colors.orange,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: claimed
                        ? Colors.grey[100]
                        : AppColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    claimed ? Icons.check_circle : Iconsax.gift,
                    color: claimed ? Colors.grey[400] : AppColors.success,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.l10n.translate('loyalty_daily_bonus'),
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        claimed
                            ? context.l10n.translate('loyalty_already_claimed')
                            : context.l10n.translate('loyalty_claim_now'),
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!claimed)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '+10',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  )
                else
                  Icon(Icons.check, color: Colors.grey[400]),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ===== Benefits =====
  Widget _buildBenefits(LoyaltyAccount account) {
    final benefits = account.tierBenefits;
    if (benefits == null || benefits.isEmpty) return const SizedBox.shrink();

    final currentBenefits = benefits[account.tier.name] ?? [];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
            context.l10n.translate('loyalty_your_benefits'),
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 12),
          if (currentBenefits.isEmpty)
            Text(
              context.l10n.translate('loyalty_no_benefits'),
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
            )
          else
            ...currentBenefits.map(
              (benefit) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: _tierPrimaryColor(account.tier),
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        benefit,
                        style: const TextStyle(fontSize: 14),
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

  // ===== Point History =====
  Widget _buildPointHistory(LoyaltyAccount account) {
    final logs = account.pointLogs;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
            context.l10n.translate('loyalty_history'),
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 12),
          if (logs.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  context.l10n.translate('loyalty_no_history'),
                  style: TextStyle(color: Colors.grey[500], fontSize: 13),
                ),
              ),
            )
          else
            ...logs.map((log) => _buildLogItem(log)),
        ],
      ),
    );
  }

  Widget _buildLogItem(LoyaltyPointLog log) {
    final isUz = context.l10n.locale.languageCode == 'uz';
    final actionName = isUz ? log.action.nameUz : log.action.nameRu;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: log.isEarned
                  ? AppColors.success.withValues(alpha: 0.1)
                  : AppColors.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              log.isEarned ? Icons.add : Icons.remove,
              color: log.isEarned ? AppColors.success : AppColors.error,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log.description ?? actionName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _formatDate(log.createdAt),
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${log.isEarned ? '+' : ''}${log.points}',
            style: TextStyle(
              color: log.isEarned ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  // ===== Helpers =====
  List<Color> _tierGradient(LoyaltyTier tier) {
    switch (tier) {
      case LoyaltyTier.bronze:
        return [const Color(0xFFCD7F32), const Color(0xFFB8860B)];
      case LoyaltyTier.silver:
        return [const Color(0xFF9E9E9E), const Color(0xFF757575)];
      case LoyaltyTier.gold:
        return [const Color(0xFFFFD700), const Color(0xFFFFA000)];
      case LoyaltyTier.platinum:
        return [const Color(0xFF7C4DFF), const Color(0xFF536DFE)];
    }
  }

  Color _tierPrimaryColor(LoyaltyTier tier) {
    switch (tier) {
      case LoyaltyTier.bronze:
        return const Color(0xFFCD7F32);
      case LoyaltyTier.silver:
        return const Color(0xFF757575);
      case LoyaltyTier.gold:
        return const Color(0xFFFFA000);
      case LoyaltyTier.platinum:
        return const Color(0xFF7C4DFF);
    }
  }

  IconData _tierIcon(LoyaltyTier tier) {
    switch (tier) {
      case LoyaltyTier.bronze:
        return Iconsax.medal;
      case LoyaltyTier.silver:
        return Iconsax.medal_star;
      case LoyaltyTier.gold:
        return Iconsax.crown;
      case LoyaltyTier.platinum:
        return Iconsax.crown_1;
    }
  }

  String _formatNumber(int n) {
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(n % 1000 == 0 ? 0 : 1)}k';
    }
    return n.toString();
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}
