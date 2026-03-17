import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/models/order_model.dart';
import 'package:topla_app/models/shop_model.dart';
import 'package:topla_app/models/address_model.dart';
import 'package:topla_app/models/product_model.dart';
import 'package:topla_app/models/user_profile.dart';
import 'package:topla_app/models/user_role.dart';
import 'package:topla_app/models/category_model.dart';
import 'package:topla_app/models/cart_item_model.dart';

void main() {
  // ==================== OrderModel ====================
  group('OrderModel.fromJson', () {
    test('snake_case keys bilan to\'g\'ri parse', () {
      final json = {
        'id': 'ord-1',
        'order_number': 'T-0001',
        'user_id': 'usr-1',
        'address_id': 'addr-1',
        'status': 'processing',
        'subtotal': 50000,
        'delivery_fee': 10000,
        'discount': 5000,
        'cashback_used': 2000,
        'total': 53000,
        'payment_method': 'cash',
        'payment_status': 'paid',
        'delivery_date': '2024-06-15T10:00:00.000Z',
        'delivery_time_slot': '10:00-12:00',
        'notes': 'Test note',
        'recipient_name': 'Ali',
        'recipient_phone': '+998901234567',
        'delivery_method': 'delivery',
        'created_at': '2024-06-01T08:00:00.000Z',
        'pickup_point_id': 'pp-1',
        'pickup_code': 'ABC123',
        'pickup_token': 'tok-123',
        'items': [
          {
            'id': 'item-1',
            'order_id': 'ord-1',
            'product_id': 'prod-1',
            'shop_id': 'shop-1',
            'product_name': 'Olma',
            'product_image': 'https://img.com/olma.jpg',
            'price': 15000,
            'quantity': 2,
            'total': 30000,
          },
        ],
      };

      final order = OrderModel.fromJson(json);
      expect(order.id, 'ord-1');
      expect(order.orderNumber, 'T-0001');
      expect(order.userId, 'usr-1');
      expect(order.addressId, 'addr-1');
      expect(order.status, OrderStatus.processing);
      expect(order.subtotal, 50000);
      expect(order.deliveryFee, 10000);
      expect(order.discount, 5000);
      expect(order.cashbackUsed, 2000);
      expect(order.total, 53000);
      expect(order.paymentMethod, 'cash');
      expect(order.paymentStatus, PaymentStatus.paid);
      expect(order.deliveryDate, isNotNull);
      expect(order.deliveryTimeSlot, '10:00-12:00');
      expect(order.notes, 'Test note');
      expect(order.recipientName, 'Ali');
      expect(order.recipientPhone, '+998901234567');
      expect(order.deliveryMethod, 'delivery');
      expect(order.createdAt.year, 2024);
      expect(order.pickupPointId, 'pp-1');
      expect(order.pickupCode, 'ABC123');
      expect(order.pickupToken, 'tok-123');
      expect(order.items.length, 1);
      expect(order.items.first.productName, 'Olma');
    });

    test('camelCase keys bilan to\'g\'ri parse', () {
      final json = {
        'id': 'ord-2',
        'orderNumber': 'T-0002',
        'userId': 'usr-2',
        'addressId': 'addr-2',
        'status': 'delivered',
        'subtotal': 100000,
        'deliveryFee': 15000,
        'cashbackUsed': 0,
        'total': 115000,
        'paymentStatus': 'pending',
        'createdAt': '2024-07-01T12:00:00.000Z',
      };

      final order = OrderModel.fromJson(json);
      expect(order.orderNumber, 'T-0002');
      expect(order.userId, 'usr-2');
      expect(order.status, OrderStatus.delivered);
      expect(order.deliveryFee, 15000);
      expect(order.items, isEmpty);
    });

    test('Decimal string qiymatlarni to\'g\'ri parse qiladi', () {
      final json = {
        'id': 'ord-3',
        'order_number': 'T-0003',
        'subtotal': '99999.50',
        'delivery_fee': '5000',
        'discount': '1000.75',
        'total': '103998.75',
        'created_at': '2024-01-01T00:00:00.000Z',
      };

      final order = OrderModel.fromJson(json);
      expect(order.subtotal, 99999.5);
      expect(order.deliveryFee, 5000);
      expect(order.discount, 1000.75);
      expect(order.total, 103998.75);
    });

    test('bo\'sh/null qiymatlar uchun defaults', () {
      final json = {
        'id': 'ord-4',
        'order_number': 'T-0004',
        'subtotal': null,
        'total': null,
        'created_at': null,
      };

      final order = OrderModel.fromJson(json);
      expect(order.subtotal, 0);
      expect(order.total, 0);
      expect(order.deliveryFee, 0);
      expect(order.discount, 0);
      expect(order.cashbackUsed, 0);
      expect(order.status, OrderStatus.pending);
      expect(order.paymentStatus, PaymentStatus.pending);
      expect(order.items, isEmpty);
      // createdAt defaults to DateTime.now() if null
      expect(order.createdAt.year, DateTime.now().year);
    });

    test('order_items legacy key bilan ham ishlaydi', () {
      final json = {
        'id': 'ord-5',
        'order_number': 'T-0005',
        'subtotal': 20000,
        'total': 20000,
        'created_at': '2024-01-01T00:00:00.000Z',
        'order_items': [
          {
            'id': 'oi-1',
            'order_id': 'ord-5',
            'product_name': 'Banan',
            'price': 10000,
            'quantity': 2,
            'total': 20000,
          },
        ],
      };

      final order = OrderModel.fromJson(json);
      expect(order.items.length, 1);
      expect(order.items.first.productName, 'Banan');
    });

    test('pickupPoint nested parse', () {
      final json = {
        'id': 'ord-6',
        'order_number': 'T-0006',
        'subtotal': 0,
        'total': 0,
        'created_at': '2024-01-01T00:00:00.000Z',
        'pickupPoint': {
          'id': 'pp-1',
          'name': 'Chilonzor punkti',
          'address': 'Chilonzor 9',
          'latitude': 41.2856,
          'longitude': 69.2044,
          'phone': '+998901234567',
          'workingHours': {'mon': '09:00-18:00'},
        },
      };

      final order = OrderModel.fromJson(json);
      expect(order.pickupPoint, isNotNull);
      expect(order.pickupPoint!.name, 'Chilonzor punkti');
      expect(order.pickupPoint!.latitude, 41.2856);
      expect(order.pickupPoint!.phone, '+998901234567');
      expect(order.pickupPoint!.workingHours?['mon'], '09:00-18:00');
    });
  });

  // ==================== OrderItemModel ====================
  group('OrderItemModel.fromJson', () {
    test('to\'liq parse', () {
      final json = {
        'id': 'item-1',
        'order_id': 'ord-1',
        'product_id': 'prod-1',
        'shop_id': 'shop-1',
        'product_name': 'Olma',
        'product_image': 'https://img.com/olma.jpg',
        'price': 15000,
        'quantity': 3,
        'total': 45000,
      };

      final item = OrderItemModel.fromJson(json);
      expect(item.id, 'item-1');
      expect(item.orderId, 'ord-1');
      expect(item.productId, 'prod-1');
      expect(item.shopId, 'shop-1');
      expect(item.productName, 'Olma');
      expect(item.productImage, 'https://img.com/olma.jpg');
      expect(item.price, 15000);
      expect(item.quantity, 3);
      expect(item.total, 45000);
    });

    test('total bo\'lmasa price * quantity hisoblaydi', () {
      final json = {
        'id': 'item-2',
        'order_id': 'ord-1',
        'name': 'Nok',
        'price': 8000,
        'quantity': 5,
      };

      final item = OrderItemModel.fromJson(json);
      expect(item.productName, 'Nok');
      expect(item.total, 40000);
    });

    test('quantity string bo\'lsa parse qiladi', () {
      final json = {
        'id': 'item-3',
        'order_id': 'ord-1',
        'name': 'Uzum',
        'price': '12000',
        'quantity': '4',
        'total': '48000',
      };

      final item = OrderItemModel.fromJson(json);
      expect(item.quantity, 4);
      expect(item.price, 12000);
      expect(item.total, 48000);
    });
  });

  // ==================== OrderStatus ====================
  group('OrderStatus.fromString', () {
    test('barcha statuslar to\'g\'ri map bo\'ladi', () {
      expect(OrderStatus.fromString('pending'), OrderStatus.pending);
      expect(OrderStatus.fromString('processing'), OrderStatus.processing);
      expect(
          OrderStatus.fromString('ready_for_pickup'), OrderStatus.readyForPickup);
      expect(OrderStatus.fromString('courier_assigned'),
          OrderStatus.courierAssigned);
      expect(OrderStatus.fromString('courier_picked_up'),
          OrderStatus.courierPickedUp);
      expect(OrderStatus.fromString('shipping'), OrderStatus.shipping);
      expect(OrderStatus.fromString('at_pickup_point'),
          OrderStatus.atPickupPoint);
      expect(OrderStatus.fromString('delivered'), OrderStatus.delivered);
      expect(OrderStatus.fromString('cancelled'), OrderStatus.cancelled);
    });

    test('noma\'lum status → pending', () {
      expect(OrderStatus.fromString('bogus'), OrderStatus.pending);
      expect(OrderStatus.fromString(''), OrderStatus.pending);
    });

    test('nameUz getter to\'g\'ri', () {
      expect(OrderStatus.pending.nameUz, 'Kutilmoqda');
      expect(OrderStatus.delivered.nameUz, 'Yetkazildi');
      expect(OrderStatus.cancelled.nameUz, 'Bekor qilindi');
    });

    test('nameRu getter to\'g\'ri', () {
      expect(OrderStatus.pending.nameRu, 'Ожидает');
      expect(OrderStatus.delivered.nameRu, 'Доставлен');
    });
  });

  // ==================== PaymentStatus ====================
  group('PaymentStatus.fromString', () {
    test('barcha qiymatlar', () {
      expect(PaymentStatus.fromString('pending'), PaymentStatus.pending);
      expect(PaymentStatus.fromString('paid'), PaymentStatus.paid);
      expect(PaymentStatus.fromString('failed'), PaymentStatus.failed);
    });

    test('noma\'lum → pending', () {
      expect(PaymentStatus.fromString('unknown'), PaymentStatus.pending);
    });
  });

  // ==================== ShopModel ====================
  group('ShopModel', () {
    final now = DateTime(2024, 6, 1);

    test('fromJson snake_case', () {
      final json = {
        'id': 'shop-1',
        'owner_id': 'usr-1',
        'name': 'Mega Shop',
        'slug': 'mega-shop',
        'description': 'Best shop',
        'logo_url': 'https://logo.com/1.png',
        'banner_url': 'https://banner.com/1.png',
        'phone': '+998901234567',
        'email': 'shop@test.com',
        'address': 'Tashkent city',
        'city': 'Tashkent',
        'is_verified': true,
        'is_active': true,
        'commission_rate': 8.5,
        'balance': 500000,
        'total_sales': 1000000,
        'total_orders': 150,
        'rating': 4.7,
        'review_count': 89,
        'followers_count': 250,
        'created_at': '2024-06-01T00:00:00.000Z',
        'updated_at': '2024-06-15T00:00:00.000Z',
      };

      final shop = ShopModel.fromJson(json);
      expect(shop.id, 'shop-1');
      expect(shop.ownerId, 'usr-1');
      expect(shop.name, 'Mega Shop');
      expect(shop.slug, 'mega-shop');
      expect(shop.logoUrl, 'https://logo.com/1.png');
      expect(shop.bannerUrl, 'https://banner.com/1.png');
      expect(shop.isVerified, true);
      expect(shop.commissionRate, 8.5);
      expect(shop.balance, 500000);
      expect(shop.totalSales, 1000000);
      expect(shop.totalOrders, 150);
      expect(shop.rating, 4.7);
      expect(shop.reviewCount, 89);
      expect(shop.followersCount, 250);
      expect(shop.updatedAt, isNotNull);
    });

    test('fromJson status enum → isVerified/isActive mapping', () {
      final json = {
        'id': 'shop-2',
        'owner_id': 'usr-2',
        'name': 'Blocked Shop',
        'status': 'blocked',
        'created_at': '2024-01-01T00:00:00.000Z',
      };

      final shop = ShopModel.fromJson(json);
      expect(shop.isVerified, false); // status != 'active'
      expect(shop.isActive, false); // status == 'blocked'
    });

    test('fromJson status active → isVerified true', () {
      final json = {
        'id': 'shop-3',
        'owner_id': 'usr-3',
        'name': 'Active Shop',
        'status': 'active',
        'created_at': '2024-01-01T00:00:00.000Z',
      };

      final shop = ShopModel.fromJson(json);
      expect(shop.isVerified, true);
      expect(shop.isActive, true);
    });

    test('toJson faqat update uchun kerak maydonlarni qaytaradi', () {
      final shop = ShopModel(
        id: 'shop-1',
        ownerId: 'usr-1',
        name: 'Test Shop',
        description: 'Desc',
        logoUrl: 'logo.png',
        bannerUrl: 'banner.png',
        phone: '+998901111111',
        address: 'Addr',
        createdAt: now,
      );

      final json = shop.toJson();
      expect(json['name'], 'Test Shop');
      expect(json['description'], 'Desc');
      expect(json['logoUrl'], 'logo.png');
      expect(json['bannerUrl'], 'banner.png');
      expect(json['phone'], '+998901111111');
      expect(json['address'], 'Addr');
      // toJson should NOT include id, ownerId, createdAt etc.
      expect(json.containsKey('id'), false);
      expect(json.containsKey('ownerId'), false);
      expect(json.containsKey('createdAt'), false);
    });

    test('toInsertJson bannerUrl yo\'q', () {
      final shop = ShopModel(
        id: 'shop-1',
        ownerId: 'usr-1',
        name: 'New Shop',
        bannerUrl: 'banner.png',
        createdAt: now,
      );

      final json = shop.toInsertJson();
      expect(json['name'], 'New Shop');
      expect(json.containsKey('bannerUrl'), false);
    });

    test('copyWith yangi qiymatlar bilan nusxa', () {
      final original = ShopModel(
        id: 'shop-1',
        ownerId: 'usr-1',
        name: 'Original',
        isVerified: false,
        commissionRate: 10,
        createdAt: now,
      );

      final updated = original.copyWith(
        name: 'Updated',
        isVerified: true,
        commissionRate: 5.0,
      );

      expect(updated.name, 'Updated');
      expect(updated.isVerified, true);
      expect(updated.commissionRate, 5.0);
      // unchanged fields preserved
      expect(updated.id, 'shop-1');
      expect(updated.ownerId, 'usr-1');
      expect(updated.createdAt, now);
    });

    test('formattedBalance va formattedFollowers', () {
      final shop = ShopModel(
        id: 's1',
        ownerId: 'u1',
        name: 'S',
        balance: 150000,
        followersCount: 1500,
        createdAt: now,
      );

      expect(shop.formattedBalance, contains('150000'));
      expect(shop.formattedFollowers, '1.5K');
    });

    test('formattedFollowers M format', () {
      final shop = ShopModel(
        id: 's1',
        ownerId: 'u1',
        name: 'S',
        followersCount: 2500000,
        createdAt: now,
      );

      expect(shop.formattedFollowers, '2.5M');
    });

    test('defaults to\'g\'ri', () {
      final shop = ShopModel(
        id: 's1',
        ownerId: 'u1',
        name: 'D',
        createdAt: now,
      );

      expect(shop.isVerified, false);
      expect(shop.isActive, true);
      expect(shop.commissionRate, 10.0);
      expect(shop.balance, 0.0);
      expect(shop.rating, 0.0);
    });
  });

  // ==================== AddressModel ====================
  group('AddressModel', () {
    test('fromJson snake_case', () {
      final json = {
        'id': 'addr-1',
        'user_id': 'usr-1',
        'name': 'Uy',
        'fullAddress': 'Tashkent, Chilonzor 9',
        'apartment': '42',
        'entrance': '3',
        'floor': '5',
        'intercom': '42#',
        'latitude': 41.2856,
        'longitude': 69.2044,
        'isDefault': true,
        'created_at': '2024-01-01T00:00:00.000Z',
        'updated_at': '2024-06-01T00:00:00.000Z',
      };

      final addr = AddressModel.fromJson(json);
      expect(addr.id, 'addr-1');
      expect(addr.title, 'Uy');
      expect(addr.address, 'Tashkent, Chilonzor 9');
      expect(addr.apartment, '42');
      expect(addr.entrance, '3');
      expect(addr.floor, '5');
      // intercom fromJson da parse qilinmaydi
      expect(addr.latitude, 41.2856);
      expect(addr.longitude, 69.2044);
      expect(addr.isDefault, true);
    });

    test('fromJson title/address alternative keys', () {
      // Test 'title' and 'street' fallback keys
      final json = {
        'id': 'addr-2',
        'title': 'Ofis',
        'street': 'Yunusobod 12',
      };

      final addr = AddressModel.fromJson(json);
      expect(addr.title, 'Ofis');
      expect(addr.address, 'Yunusobod 12');
    });

    test('toJson name va fullAddress qaytaradi', () {
      final addr = AddressModel(
        id: 'addr-1',
        title: 'Uy',
        address: 'Tashkent 1',
        apartment: '10',
        entrance: '2',
        floor: '3',
        latitude: 41.0,
        longitude: 69.0,
        isDefault: true,
      );

      final json = addr.toJson();
      expect(json['name'], 'Uy');
      expect(json['fullAddress'], 'Tashkent 1');
      expect(json['latitude'], 41.0);
      expect(json['longitude'], 69.0);
      expect(json['isDefault'], true);
      expect(json['apartment'], '10');
      expect(json['entrance'], '2');
      expect(json['floor'], '3');
    });

    test('copyWith isDefault o\'zgartirish', () {
      final addr = AddressModel(
        id: 'addr-1',
        title: 'Uy',
        address: 'Test',
        isDefault: false,
      );

      final updated = addr.copyWith(isDefault: true);
      expect(updated.isDefault, true);
      expect(updated.id, 'addr-1');
      expect(updated.title, 'Uy');
    });

    test('defaults: createdAt va updatedAt DateTime.now()', () {
      final before = DateTime.now();
      final addr = AddressModel(id: 'a1', title: 'T', address: 'A');
      final after = DateTime.now();

      expect(addr.createdAt.isAfter(before.subtract(const Duration(seconds: 1))),
          true);
      expect(addr.createdAt.isBefore(after.add(const Duration(seconds: 1))),
          true);
      expect(addr.isDefault, false);
    });
  });

  // ==================== ProductModel ====================
  group('ProductModel', () {
    test('fromJson to\'liq parse', () {
      final json = {
        'id': 'prod-1',
        'name_uz': 'Olma',
        'name_ru': 'Яблоко',
        'description_uz': 'Yangi olma',
        'description_ru': 'Свежее яблоко',
        'price': 15000,
        'old_price': 20000,
        'category_id': 'cat-1',
        'shop_id': 'shop-1',
        'images': ['img1.jpg', 'img2.jpg'],
        'stock': 50,
        'salesCount': 120,
        'rating': 4.5,
        'review_count': 30,
        'is_active': true,
        'is_featured': true,
        'cashback_percent': 5,
        'created_at': '2024-01-01T00:00:00.000Z',
        'moderation_status': 'approved',
      };

      final product = ProductModel.fromJson(json);
      expect(product.id, 'prod-1');
      expect(product.nameUz, 'Olma');
      expect(product.nameRu, 'Яблоко');
      expect(product.descriptionUz, 'Yangi olma');
      expect(product.descriptionRu, 'Свежее яблоко');
      expect(product.price, 15000);
      expect(product.oldPrice, 20000);
      expect(product.categoryId, 'cat-1');
      expect(product.shopId, 'shop-1');
      expect(product.images.length, 2);
      expect(product.stock, 50);
      expect(product.soldCount, 120);
      expect(product.rating, 4.5);
      expect(product.reviewCount, 30);
      expect(product.isActive, true);
      expect(product.isFeatured, true);
      expect(product.cashbackPercent, 5);
      expect(product.moderationStatus, 'approved');
    });

    test('fromJson camelCase key aliases', () {
      final json = {
        'id': 'prod-2',
        'nameUz': 'Nok',
        'nameRu': 'Груша',
        'price': '9500',
        'oldPrice': '12000',
        'categoryId': 'cat-2',
        'shopId': 'shop-2',
      };

      final product = ProductModel.fromJson(json);
      expect(product.nameUz, 'Nok');
      expect(product.price, 9500); // string → double
      expect(product.oldPrice, 12000);
    });

    test('fromJson shop object → shopId + shopData', () {
      final json = {
        'id': 'prod-3',
        'name': 'Universal',
        'price': 5000,
        'shop': {
          'id': 'shop-3',
          'name': 'My Shop',
          'logoUrl': 'logo.png',
        },
      };

      final product = ProductModel.fromJson(json);
      expect(product.shopId, 'shop-3');
      expect(product.shopData, isNotNull);
      expect(product.shopData!['name'], 'My Shop');
    });

    test('toJson subset qaytaradi', () {
      final product = ProductModel(
        id: 'prod-1',
        nameUz: 'Olma',
        nameRu: 'Яблоко',
        descriptionUz: 'Fresh',
        price: 15000,
        oldPrice: 20000,
        categoryId: 'cat-1',
        shopId: 'shop-1',
        images: ['img1.jpg'],
        stock: 50,
        isActive: true,
        isFeatured: false,
      );

      final json = product.toJson();
      expect(json['name'], 'Olma');
      expect(json['description'], 'Fresh');
      expect(json['price'], 15000);
      expect(json['originalPrice'], 20000);
      expect(json['categoryId'], 'cat-1');
      expect(json['shopId'], 'shop-1');
      expect(json['images'], ['img1.jpg']);
      expect(json['stock'], 50);
      expect(json['isActive'], true);
      expect(json['isFeatured'], false);
      // id should NOT be in toJson
      expect(json.containsKey('id'), false);
    });

    test('computed getters to\'g\'ri ishlaydi', () {
      final product = ProductModel(
        id: 'p1',
        nameUz: 'Test',
        nameRu: 'Тест',
        price: 8000,
        oldPrice: 10000,
        images: ['first.jpg', 'second.jpg'],
        stock: 5,
      );

      expect(product.discountPercent, 20);
      expect(product.firstImage, 'first.jpg');
      expect(product.imageUrl, 'first.jpg');
      expect(product.inStock, true);
      expect(product.name, 'Test');
    });

    test('discountPercent 0 agar oldPrice yo\'q', () {
      final product = ProductModel(
        id: 'p2',
        nameUz: 'T',
        nameRu: 'T',
        price: 5000,
      );

      expect(product.discountPercent, 0);
      expect(product.firstImage, isNull);
      expect(product.inStock, false);
    });

    test('getName tilga qarab', () {
      final product = ProductModel(
        id: 'p3',
        nameUz: 'Olma',
        nameRu: 'Яблоко',
        price: 5000,
      );

      expect(product.getName('uz'), 'Olma');
      expect(product.getName('ru'), 'Яблоко');
    });

    test('string numbers parse', () {
      final json = {
        'id': 'p4',
        'name': 'String nums',
        'price': '15000.50',
        'stock': '100',
        'rating': '4.8',
        'reviewCount': '55',
      };

      final product = ProductModel.fromJson(json);
      expect(product.price, 15000.5);
      expect(product.stock, 100);
      expect(product.rating, 4.8);
      expect(product.reviewCount, 55);
    });
  });

  // ==================== UserProfile ====================
  group('UserProfile', () {
    test('fromJson to\'liq parse', () {
      final json = {
        'id': 'usr-1',
        'first_name': 'Ali',
        'last_name': 'Valiyev',
        'full_name': 'Ali Valiyev',
        'phone': '+998901234567',
        'email': 'ali@test.com',
        'avatar_url': 'https://avatar.com/1.jpg',
        'birth_date': '1995-05-15T00:00:00.000Z',
        'gender': 'male',
        'referral_code': 'REF123',
        'referred_by': 'REF456',
        'cashback_balance': 25000,
        'total_orders': 12,
        'coupons_count': 3,
        'created_at': '2024-01-01T00:00:00.000Z',
        'role': 'vendor',
      };

      final profile = UserProfile.fromJson(json);
      expect(profile.id, 'usr-1');
      expect(profile.firstName, 'Ali');
      expect(profile.lastName, 'Valiyev');
      expect(profile.fullName, 'Ali Valiyev');
      expect(profile.phone, '+998901234567');
      expect(profile.email, 'ali@test.com');
      expect(profile.avatarUrl, 'https://avatar.com/1.jpg');
      expect(profile.birthDate, isNotNull);
      expect(profile.gender, 'male');
      expect(profile.referralCode, 'REF123');
      expect(profile.cashbackBalance, 25000);
      expect(profile.totalOrders, 12);
      expect(profile.couponsCount, 3);
      expect(profile.role, UserRole.vendor);
    });

    test('fromJson fullName dan firstName/lastName ajratish', () {
      final json = {
        'id': 'usr-2',
        'full_name': 'Bobur Karimov',
      };

      final profile = UserProfile.fromJson(json);
      expect(profile.firstName, 'Bobur');
      expect(profile.lastName, 'Karimov');
      expect(profile.fullName, 'Bobur Karimov');
    });

    test('fromJson firstName/lastName dan fullName yasash', () {
      final json = {
        'id': 'usr-3',
        'first_name': 'Jasur',
        'last_name': 'Toshmatov',
      };

      final profile = UserProfile.fromJson(json);
      expect(profile.fullName, 'Jasur Toshmatov');
    });

    test('toJson id va asosiy maydonlar', () {
      final profile = UserProfile(
        id: 'usr-1',
        firstName: 'Ali',
        lastName: 'Valiyev',
        fullName: 'Ali Valiyev',
        phone: '+998901234567',
        email: 'ali@test.com',
        avatarUrl: 'avatar.jpg',
      );

      final json = profile.toJson();
      expect(json['id'], 'usr-1');
      expect(json['fullName'], 'Ali Valiyev');
      expect(json['phone'], '+998901234567');
      expect(json['email'], 'ali@test.com');
      expect(json['avatarUrl'], 'avatar.jpg');
    });

    test('toJson fullName null bo\'lsa firstName+lastName dan yasaydi', () {
      final profile = UserProfile(
        id: 'usr-1',
        firstName: 'Test',
        lastName: 'User',
      );

      final json = profile.toJson();
      expect(json['fullName'], 'Test User');
    });

    test('copyWith o\'zgartiradi', () {
      final original = UserProfile(
        id: 'usr-1',
        firstName: 'Ali',
        phone: '+998901111111',
        cashbackBalance: 5000,
        role: UserRole.admin,
      );

      final updated = original.copyWith(
        firstName: 'Vali',
        phone: '+998902222222',
      );

      expect(updated.firstName, 'Vali');
      expect(updated.phone, '+998902222222');
      // unchanged
      expect(updated.id, 'usr-1');
      expect(updated.cashbackBalance, 5000);
      expect(updated.role, UserRole.admin);
    });

    test('role defaults va helpers', () {
      final user = UserProfile(id: 'u1');
      expect(user.role, UserRole.user);
      expect(user.isAdmin, false);
      expect(user.isVendor, false);

      final admin = UserProfile(id: 'u2', role: UserRole.admin);
      expect(admin.isAdmin, true);
      expect(admin.canModerate, true);

      final superAdmin = UserProfile(id: 'u3', role: UserRole.superAdmin);
      expect(superAdmin.isSuperAdmin, true);
      expect(superAdmin.canManageShops, true);

      final vendor = UserProfile(id: 'u4', role: UserRole.vendor);
      expect(vendor.isVendor, true);
    });
  });

  // ==================== UserRole ====================
  group('UserRole', () {
    test('fromString barcha rollar', () {
      expect(UserRoleExtension.fromString('user'), UserRole.user);
      expect(UserRoleExtension.fromString('vendor'), UserRole.vendor);
      expect(UserRoleExtension.fromString('admin'), UserRole.admin);
      expect(UserRoleExtension.fromString('super_admin'), UserRole.superAdmin);
    });

    test('fromString unknown → user', () {
      expect(UserRoleExtension.fromString(null), UserRole.user);
      expect(UserRoleExtension.fromString('bogus'), UserRole.user);
    });

    test('value getter string', () {
      expect(UserRole.user.value, 'user');
      expect(UserRole.vendor.value, 'vendor');
      expect(UserRole.admin.value, 'admin');
      expect(UserRole.superAdmin.value, 'super_admin');
    });

    test('displayName getter', () {
      expect(UserRole.user.displayName, 'Foydalanuvchi');
      expect(UserRole.vendor.displayName, contains('Do\'kon'));
      expect(UserRole.admin.displayName, 'Admin');
      expect(UserRole.superAdmin.displayName, 'Super Admin');
    });

    test('permission helpers', () {
      expect(UserRole.admin.isAdmin, true);
      expect(UserRole.user.isAdmin, false);
      expect(UserRole.superAdmin.canManageShops, true);
      expect(UserRole.admin.canManageShops, false);
      expect(UserRole.superAdmin.canManageAdmins, true);
      expect(UserRole.admin.canManageAdmins, false);
    });
  });

  // ==================== CategoryModel ====================
  group('CategoryModel', () {
    test('fromJson to\'liq parse', () {
      final json = {
        'id': 'cat-1',
        'name_uz': 'Mevalar',
        'name_ru': 'Фрукты',
        'icon': '🍎',
        'image_url': 'https://img.com/fruits.jpg',
        'parent_id': null,
        'sort_order': 1,
        'is_active': true,
      };

      final cat = CategoryModel.fromJson(json);
      expect(cat.id, 'cat-1');
      expect(cat.nameUz, 'Mevalar');
      expect(cat.nameRu, 'Фрукты');
      expect(cat.icon, '🍎');
      expect(cat.imageUrl, 'https://img.com/fruits.jpg');
      expect(cat.parentId, isNull);
      expect(cat.sortOrder, 1);
      expect(cat.isActive, true);
      expect(cat.subcategories, isEmpty);
    });

    test('fromJson nested children parse', () {
      final json = {
        'id': 'cat-1',
        'name_uz': 'Oziq-ovqat',
        'name_ru': 'Еда',
        'children': [
          {
            'id': 'cat-1-1',
            'name_uz': 'Mevalar',
            'name_ru': 'Фрукты',
            'parent_id': 'cat-1',
          },
          {
            'id': 'cat-1-2',
            'name_uz': 'Sabzavotlar',
            'name_ru': 'Овощи',
            'parent_id': 'cat-1',
          },
        ],
      };

      final cat = CategoryModel.fromJson(json);
      expect(cat.subcategories.length, 2);
      expect(cat.subcategories[0].nameUz, 'Mevalar');
      expect(cat.subcategories[0].parentId, 'cat-1');
      expect(cat.subcategories[1].nameUz, 'Sabzavotlar');
    });

    test('fromJson subcategories legacy key', () {
      final json = {
        'id': 'cat-2',
        'name_uz': 'Ichimliklar',
        'name_ru': 'Напитки',
        'subcategories': [
          {
            'id': 'cat-2-1',
            'name_uz': 'Suv',
            'name_ru': 'Вода',
          },
        ],
      };

      final cat = CategoryModel.fromJson(json);
      expect(cat.subcategories.length, 1);
      expect(cat.subcategories.first.nameUz, 'Suv');
    });

    test('toJson barcha maydonlar', () {
      final cat = CategoryModel(
        id: 'cat-1',
        nameUz: 'Mevalar',
        nameRu: 'Фрукты',
        icon: '🍎',
        imageUrl: 'img.jpg',
        parentId: 'cat-0',
        sortOrder: 2,
        isActive: true,
      );

      final json = cat.toJson();
      expect(json['id'], 'cat-1');
      expect(json['nameUz'], 'Mevalar');
      expect(json['nameRu'], 'Фрукты');
      expect(json['icon'], '🍎');
      expect(json['imageUrl'], 'img.jpg');
      expect(json['parentId'], 'cat-0');
      expect(json['sortOrder'], 2);
      expect(json['isActive'], true);
    });

    test('getName tilga qarab', () {
      final cat = CategoryModel(
        id: 'c1',
        nameUz: 'Mevalar',
        nameRu: 'Фрукты',
      );

      expect(cat.getName('uz'), 'Mevalar');
      expect(cat.getName('ru'), 'Фрукты');
    });

    test('camelCase key aliases', () {
      final json = {
        'id': 'cat-3',
        'nameUz': 'Test',
        'nameRu': 'Тест',
        'imageUrl': 'img.jpg',
        'parentId': 'cat-0',
        'sortOrder': 5,
        'isActive': false,
      };

      final cat = CategoryModel.fromJson(json);
      expect(cat.nameUz, 'Test');
      expect(cat.imageUrl, 'img.jpg');
      expect(cat.parentId, 'cat-0');
      expect(cat.sortOrder, 5);
      expect(cat.isActive, false);
    });

    test('defaults', () {
      final cat = CategoryModel(
        id: 'c1',
        nameUz: 'D',
        nameRu: 'D',
      );

      expect(cat.sortOrder, 0);
      expect(cat.isActive, true);
      expect(cat.subcategories, isEmpty);
    });
  });

  // ==================== CartItemModel ====================
  group('CartItemModel', () {
    test('fromJson to\'liq parse', () {
      final json = {
        'id': 'cart-1',
        'userId': 'usr-1',
        'productId': 'prod-1',
        'quantity': 3,
        'product': {
          'id': 'prod-1',
          'name_uz': 'Olma',
          'name_ru': 'Яблоко',
          'price': 15000,
          'old_price': 20000,
          'images': ['img1.jpg'],
          'stock': 50,
        },
      };

      final item = CartItemModel.fromJson(json);
      expect(item.id, 'cart-1');
      expect(item.userId, 'usr-1');
      expect(item.productId, 'prod-1');
      expect(item.quantity, 3);
      expect(item.product, isNotNull);
      expect(item.product!.nameUz, 'Olma');
      expect(item.product!.price, 15000);
      expect(item.product!.oldPrice, 20000);
      expect(item.product!.images, ['img1.jpg']);
      expect(item.product!.stock, 50);
    });

    test('total hisoblash', () {
      final item = CartItemModel(
        id: 'c1',
        userId: 'u1',
        productId: 'p1',
        quantity: 4,
        product: ProductInfo(
          id: 'p1',
          nameUz: 'Olma',
          nameRu: 'Яблоко',
          price: 10000,
        ),
      );

      expect(item.total, 40000);
    });

    test('total 0 agar product null', () {
      final item = CartItemModel(
        id: 'c1',
        userId: 'u1',
        productId: 'p1',
        quantity: 3,
      );

      expect(item.total, 0);
    });

    test('copyWith quantity o\'zgartirish', () {
      final original = CartItemModel(
        id: 'c1',
        userId: 'u1',
        productId: 'p1',
        quantity: 2,
      );

      final updated = original.copyWith(quantity: 5);
      expect(updated.quantity, 5);
      expect(updated.id, 'c1');
      expect(updated.productId, 'p1');
    });

    test('default quantity 1', () {
      final item = CartItemModel(
        id: 'c1',
        userId: 'u1',
        productId: 'p1',
      );

      expect(item.quantity, 1);
    });
  });

  // ==================== ProductInfo ====================
  group('ProductInfo', () {
    test('fromJson alternative keys', () {
      // Test 'name' fallback, 'originalPrice' fallback
      final json = {
        'id': 'p1',
        'name': 'Fallback Name',
        'price': 5000,
        'originalPrice': 7000,
        'images': ['a.jpg', 'b.jpg'],
        'stock': 10,
      };

      final info = ProductInfo.fromJson(json);
      expect(info.nameUz, 'Fallback Name');
      expect(info.nameRu, 'Fallback Name');
      expect(info.price, 5000);
      expect(info.oldPrice, 7000);
      expect(info.images.length, 2);
      expect(info.stock, 10);
    });

    test('defaults', () {
      final info = ProductInfo(
        id: 'p1',
        nameUz: 'T',
        nameRu: 'T',
        price: 1000,
      );

      expect(info.oldPrice, isNull);
      expect(info.images, isEmpty);
      expect(info.stock, 0);
    });
  });

  // ==================== PickupPointModel ====================
  group('PickupPointModel', () {
    test('fromJson to\'liq parse', () {
      final json = {
        'id': 'pp-1',
        'name': 'Markaziy punkt',
        'address': 'Tashkent, Amir Temur 1',
        'latitude': 41.3111,
        'longitude': 69.2797,
        'phone': '+998901234567',
        'workingHours': {
          'monday': '09:00-18:00',
          'saturday': '10:00-15:00',
        },
      };

      final pp = PickupPointModel.fromJson(json);
      expect(pp.id, 'pp-1');
      expect(pp.name, 'Markaziy punkt');
      expect(pp.address, 'Tashkent, Amir Temur 1');
      expect(pp.latitude, 41.3111);
      expect(pp.longitude, 69.2797);
      expect(pp.phone, '+998901234567');
      expect(pp.workingHours?['monday'], '09:00-18:00');
    });

    test('defaults null/bo\'sh uchun', () {
      final json = <String, dynamic>{};

      final pp = PickupPointModel.fromJson(json);
      expect(pp.id, '');
      expect(pp.name, '');
      expect(pp.address, '');
      expect(pp.latitude, 0.0);
      expect(pp.longitude, 0.0);
      expect(pp.phone, isNull);
      expect(pp.workingHours, isNull);
    });
  });
}
