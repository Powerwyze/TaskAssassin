import 'package:flutter/foundation.dart';
import 'package:taskassassin/supabase/supabase_config.dart';

class ImageUploadService {
  ImageUploadService._();
  static final ImageUploadService instance = ImageUploadService._();

  // Upload image to Supabase Storage
  Future<String> uploadMissionPhoto({
    required String missionId,
    required bool isBefore,
    required Uint8List bytes,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = '${isBefore ? 'before' : 'after'}-$timestamp.jpg';
      final fullPath = 'missions/$missionId/$fileName';

      await SupabaseConfig.client.storage
          .from('user-uploads')
          .uploadBinary(fullPath, bytes);

      final publicUrl = SupabaseConfig.client.storage
          .from('user-uploads')
          .getPublicUrl(fullPath);

      debugPrint('[ImageUploadService] Image uploaded: $publicUrl');
      return publicUrl;
    } catch (e) {
      debugPrint('[ImageUploadService] Upload error: $e');
      rethrow;
    }
  }

  Future<String> uploadUserAvatar({
    required String userId,
    required Uint8List bytes,
  }) async {
    try {
      final fullPath = 'users/$userId/avatar.jpg';

      await SupabaseConfig.client.storage
          .from('user-uploads')
          .uploadBinary(fullPath, bytes);

      final publicUrl = SupabaseConfig.client.storage
          .from('user-uploads')
          .getPublicUrl(fullPath);

      debugPrint('[ImageUploadService] Avatar uploaded: $publicUrl');
      return publicUrl;
    } catch (e) {
      debugPrint('[ImageUploadService] Avatar upload error: $e');
      rethrow;
    }
  }

  Future<void> deleteImage(String imageUrl) async {
    try {
      final uri = Uri.parse(imageUrl);
      final pathSegments = uri.pathSegments;
      final bucketIndex = pathSegments.indexWhere((s) => s == 'object' || s == 'public');
      if (bucketIndex == -1) throw 'Invalid URL format';
      
      final bucket = pathSegments[bucketIndex + 1];
      final path = pathSegments.skip(bucketIndex + 2).join('/');
      
      await SupabaseConfig.client.storage.from(bucket).remove([path]);
      debugPrint('[ImageUploadService] Image deleted: $path');
    } catch (e) {
      debugPrint('[ImageUploadService] Delete error: $e');
      rethrow;
    }
  }
}
