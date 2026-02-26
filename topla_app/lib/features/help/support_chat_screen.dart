import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/config/api_config.dart';
import '../../core/constants/constants.dart';
import '../../core/services/api_client.dart';

class SupportChatScreen extends StatefulWidget {
  const SupportChatScreen({super.key});

  @override
  State<SupportChatScreen> createState() => _SupportChatScreenState();
}

class _SupportChatScreenState extends State<SupportChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  bool _isUploadingImage = false;
  Timer? _pollTimer;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _initChat();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _initChat() async {
    try {
      // Get or create ticket
      await _api.get('/support/ticket');

      // Load messages
      await _loadMessages();

      // Mark as read
      await _api.put('/support/messages/read');

      // Poll for new messages every 5 seconds
      _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
        _loadMessages(silent: true);
      });
    } catch (e) {
      debugPrint('Support chat init error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMessages({bool silent = false}) async {
    try {
      final res = await _api.get('/support/messages', queryParams: {
        'limit': '100',
      });
      if (res.success && res.data != null) {
        final items =
            (res.data['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        if (mounted) {
          final hadMessages = _messages.length;
          setState(() => _messages = items);
          if (items.length > hadMessages && !silent) {
            _scrollToBottom();
          }
        }
      }
    } catch (e) {
      debugPrint('Load messages error: $e');
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    _messageController.clear();

    // Optimistic: add user message locally
    final tempUserMsg = {
      'id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
      'senderType': 'user',
      'message': text,
      'createdAt': DateTime.now().toIso8601String(),
    };
    setState(() => _messages.add(tempUserMsg));
    _scrollToBottom();

    try {
      final res = await _api.post('/support/messages', body: {
        'message': text,
      });

      if (res.success && res.data != null) {
        // Replace temp message with real one
        final userMsg = res.data['userMessage'] as Map<String, dynamic>?;
        final botMsg = res.data['botMessage'] as Map<String, dynamic>?;

        if (mounted) {
          setState(() {
            // Remove temp
            _messages.removeWhere((m) => m['id'] == tempUserMsg['id']);
            if (userMsg != null) _messages.add(userMsg);
            if (botMsg != null) _messages.add(botMsg);
          });
          _scrollToBottom();
        }
      }
    } catch (e) {
      debugPrint('Send message error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Xabar yuborishda xatolik'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // Quick reply buttons
  void _sendQuickReply(String text) {
    _messageController.text = text;
    _sendMessage();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Iconsax.headphone,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TOPLA Yordam',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                Text(
                  'Onlayn',
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () async {
              final uri = Uri(scheme: 'tel', path: '+998950009416');
              try {
                await launchUrl(uri);
              } catch (_) {}
            },
            icon: Icon(
              Iconsax.call,
              color: AppColors.primary,
              size: 22,
            ),
            tooltip: 'Qo\'ng\'iroq qilish',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 16,
                        ),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isUser = msg['senderType'] == 'user';
                          final isBot = msg['senderType'] == 'bot';
                          final isAdmin = msg['senderType'] == 'admin';

                          // Show date divider
                          Widget? dateDivider;
                          if (index == 0 || _shouldShowDate(index)) {
                            dateDivider = _buildDateDivider(msg['createdAt']);
                          }

                          return Column(
                            children: [
                              if (dateDivider != null) dateDivider,
                              _buildMessageBubble(
                                message: msg['message'] ?? '',
                                isUser: isUser,
                                isBot: isBot,
                                isAdmin: isAdmin,
                                time: msg['createdAt'],
                                imageUrl: msg['imageUrl'],
                              ),
                            ],
                          );
                        },
                      ),
          ),

          // Quick replies (show only if few messages)
          if (_messages.length <= 2) _buildQuickReplies(),

          // Input
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Iconsax.message_question,
                color: AppColors.primary,
                size: 40,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'TOPLA Yordam markazi',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Savolingizni yozing, biz tez javob beramiz!',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble({
    required String message,
    required bool isUser,
    required bool isBot,
    required bool isAdmin,
    String? time,
    String? imageUrl,
  }) {
    final timeStr = _formatTime(time);
    final senderLabel = isAdmin ? 'TOPLA Admin' : (isBot ? 'TOPLA Bot' : null);
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 4,
          bottom: 4,
          left: isUser ? 48 : 0,
          right: isUser ? 0 : 48,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (senderLabel != null)
              Padding(
                padding: const EdgeInsets.only(left: 12, bottom: 2),
                child: Text(
                  senderLabel,
                  style: TextStyle(
                    fontSize: 11,
                    color: isAdmin ? AppColors.primary : Colors.grey.shade500,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: isUser
                    ? AppColors.primary
                    : (isAdmin
                        ? AppColors.primary.withValues(alpha: 0.08)
                        : Colors.white),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                boxShadow: [
                  if (!isUser)
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 5,
                      offset: const Offset(0, 1),
                    ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasImage)
                    GestureDetector(
                      onTap: () => _showFullImage(imageUrl),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          maxWidth: 220,
                          maxHeight: 220,
                        ),
                        child: Image.network(
                          imageUrl.startsWith('http')
                              ? imageUrl
                              : '${ApiConfig.baseUrl}$imageUrl',
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Container(
                              width: 180,
                              height: 120,
                              color: Colors.grey.shade200,
                              child: const Center(
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 180,
                              height: 80,
                              color: Colors.grey.shade200,
                              child: const Center(
                                child: Icon(Iconsax.gallery_slash,
                                    color: Colors.grey),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  if (message.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            message,
                            style: TextStyle(
                              color: isUser ? Colors.white : Colors.black87,
                              fontSize: 14.5,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            timeStr,
                            style: TextStyle(
                              fontSize: 10,
                              color: isUser
                                  ? Colors.white.withValues(alpha: 0.7)
                                  : Colors.grey.shade400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (message.isEmpty)
                    Padding(
                      padding:
                          const EdgeInsets.only(right: 10, bottom: 4, top: 4),
                      child: Text(
                        timeStr,
                        style: TextStyle(
                          fontSize: 10,
                          color: isUser
                              ? Colors.white.withValues(alpha: 0.7)
                              : Colors.grey.shade400,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullImage(String imageUrl) {
    final url = imageUrl.startsWith('http')
        ? imageUrl
        : '${ApiConfig.baseUrl}$imageUrl';
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            InteractiveViewer(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(url, fit: BoxFit.contain),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateDivider(String? dateStr) {
    String label = 'Bugun';
    if (dateStr != null) {
      try {
        final date = DateTime.parse(dateStr);
        final now = DateTime.now();
        final diff = now.difference(date).inDays;
        if (diff == 0) {
          label = 'Bugun';
        } else if (diff == 1) {
          label = 'Kecha';
        } else {
          label =
              '${date.day}.${date.month.toString().padLeft(2, '0')}.${date.year}';
        }
      } catch (_) {}
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickReplies() {
    final quickReplies = [
      'Buyurtma holati',
      'Yetkazib berish',
      'To\'lov masalalari',
      'Qaytarish',
      'Topshirish punkti',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: quickReplies.map((text) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ActionChip(
                label: Text(text, style: const TextStyle(fontSize: 12)),
                backgroundColor: Colors.white,
                side:
                    BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                labelStyle: TextStyle(color: AppColors.primary),
                onPressed: () => _sendQuickReply(text),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Future<void> _pickAndSendImage() async {
    try {
      final source = await showModalBottomSheet<ImageSource>(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        builder: (ctx) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Iconsax.camera, color: AppColors.primary),
                  ),
                  title: const Text('Kamera',
                      style: TextStyle(fontWeight: FontWeight.w500)),
                  subtitle: const Text('Rasm olish'),
                  onTap: () => Navigator.pop(ctx, ImageSource.camera),
                ),
                ListTile(
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Iconsax.gallery, color: Colors.orange),
                  ),
                  title: const Text('Galereya',
                      style: TextStyle(fontWeight: FontWeight.w500)),
                  subtitle: const Text('Rasmlardan tanlash'),
                  onTap: () => Navigator.pop(ctx, ImageSource.gallery),
                ),
              ],
            ),
          ),
        ),
      );

      if (source == null) return;

      final image = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      if (image == null) return;

      setState(() => _isUploadingImage = true);

      // Upload image
      final uploadRes = await _api.upload(
        '/upload/image',
        filePath: image.path,
        fields: {'folder': 'support'},
      );

      if (!uploadRes.success) {
        throw Exception('Upload failed');
      }

      final imageUrl = uploadRes.dataMap['url'] as String;

      // Send message with image
      final text = _messageController.text.trim();
      _messageController.clear();

      // Optimistic local message
      final tempMsg = {
        'id': 'temp_img_${DateTime.now().millisecondsSinceEpoch}',
        'senderType': 'user',
        'message': text,
        'imageUrl': imageUrl,
        'createdAt': DateTime.now().toIso8601String(),
      };
      setState(() => _messages.add(tempMsg));
      _scrollToBottom();

      final res = await _api.post('/support/messages', body: {
        'message': text.isEmpty ? '' : text,
        'imageUrl': imageUrl,
      });

      if (res.success && res.data != null) {
        final userMsg = res.data['userMessage'] as Map<String, dynamic>?;
        final botMsg = res.data['botMessage'] as Map<String, dynamic>?;
        if (mounted) {
          setState(() {
            _messages.removeWhere((m) => m['id'] == tempMsg['id']);
            if (userMsg != null) _messages.add(userMsg);
            if (botMsg != null) _messages.add(botMsg);
          });
          _scrollToBottom();
        }
      }
    } catch (e) {
      debugPrint('Image send error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rasm yuborishda xatolik'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 8,
        bottom: MediaQuery.of(context).viewInsets.bottom > 0
            ? 8
            : MediaQuery.of(context).padding.bottom + 8,
      ),
      color: Colors.transparent,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Attachment button — compact white circle
          GestureDetector(
            onTap: _isUploadingImage ? null : _pickAndSendImage,
            child: Container(
              width: 40,
              height: 40,
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.grey.shade100, width: 1),
              ),
              child: _isUploadingImage
                  ? Center(
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      ),
                    )
                  : const Icon(
                      Icons.attach_file_rounded,
                      color: Colors.black,
                      size: 20,
                    ),
            ),
          ),
          const SizedBox(width: 8),
          // Message input — pill shaped
          Expanded(
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: TextField(
                controller: _messageController,
                maxLines: 1,
                minLines: 1,
                textCapitalization: TextCapitalization.sentences,
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Xabar yozing...',
                  hintStyle:
                      TextStyle(color: Colors.grey.shade400, fontSize: 14),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Send button — compact
          GestureDetector(
            onTap: _isSending ? null : _sendMessage,
            child: Container(
              width: 40,
              height: 40,
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: _isSending
                  ? const Center(
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : const Icon(
                      Iconsax.send_1,
                      color: Colors.white,
                      size: 20,
                    ),
            ),
          ),
        ],
      ),
    );
  }

  bool _shouldShowDate(int index) {
    if (index == 0) return true;
    try {
      final current = DateTime.parse(_messages[index]['createdAt']);
      final previous = DateTime.parse(_messages[index - 1]['createdAt']);
      return current.day != previous.day ||
          current.month != previous.month ||
          current.year != previous.year;
    } catch (_) {
      return false;
    }
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }
}
