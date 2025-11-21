import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

type SideModalProps = {
  visible: boolean;
  onClose: () => void;
  direction: 'left' | 'right';
  children: React.ReactNode;
  title: string;
};

const SideModal = ({ visible, onClose, direction, children, title }: SideModalProps) => {
  // State để quản lý việc hiển thị của Modal, giúp trì hoãn việc unmount
  const [isModalVisible, setModalVisible] = useState(visible);
  // States cho các modal con
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const isMenu = direction === 'left';
  const bgColor = isMenu ? 'bg-[#000044]' : 'bg-white'; // Màu xanh navy đậm hơn
  const headerTextColor = isMenu ? 'text-white' : 'text-blue-900';
  const headerIconColor = isMenu ? '#FFFFFF' : '#1e3a8a';
  const headerBorderColor = isMenu ? 'border-[#0d1a3e]' : 'border-gray-200';
  const slideAnim = useRef(new Animated.Value(direction === 'left' ? -width : width)).current;

  useEffect(() => {
    if (visible) {
      // Khi prop 'visible' là true, hiển thị modal và chạy animation mở
      setModalVisible(true);
      // Reset vị trí trước khi chạy animation để đảm bảo nó luôn hoạt động
      slideAnim.setValue(direction === 'left' ? -width : width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (isModalVisible) {
      // Khi prop 'visible' là false (nhưng modal vẫn đang hiển thị), chạy animation đóng
      Animated.timing(slideAnim, {
        toValue: direction === 'left' ? -width : width,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        // Sau khi animation đóng hoàn tất, mới ẩn modal và gọi onClose
        setModalVisible(false);
        onClose();
      });
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={isModalVisible} // Sử dụng state nội bộ để điều khiển
      onRequestClose={onClose}
      animationType="none" // We handle animation manually
    >
      <View style={styles.container}>
        <Animated.View style={[styles.modal, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView className={`flex-1 ${bgColor}`}>
            <View className={`flex-row items-center p-4 border-b ${headerBorderColor} relative z-10`}>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="chevron-back" size={28} color={headerIconColor} />
              </TouchableOpacity>
              <Text className={`text-lg font-bold ${headerTextColor} flex-1 text-center mr-8`}>{title}</Text>
            </View>
            <View className="flex-1">
              {/* Truyền các hàm để mở modal con vào children (Menus) */}
              {React.cloneElement(children as React.ReactElement<any>, {
                onOpenAboutModal: () => setAboutModalVisible(true),
                onOpenContactModal: () => setContactModalVisible(true),
                onClose: onClose, // Vẫn truyền hàm onClose để các item khác có thể đóng menu
              })}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>

      {/* Modal "Về chúng tôi" - Nằm bên trong SideModal */}
      <Modal
        transparent
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
        animationType="slide"
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAboutModalVisible(false)}
          />
          <View className="bg-white rounded-t-3xl p-6 shadow-xl max-h-[60%] pb-12">
            <View className="flex-row justify-between items-center mb-6 ">
              <Text className="text-lg font-bold text-blue-950">Về chúng tôi</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)} className="p-1">
                <Ionicons name="close-circle" size={28} color="#d1d5db" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text className="text-base text-gray-700 leading-6">AirSky là ứng dụng đặt vé máy bay hàng đầu, mang đến cho bạn trải nghiệm bay tiện lợi và nhanh chóng. Sứ mệnh của chúng tôi là kết nối mọi người với thế giới thông qua những chuyến bay an toàn, giá cả phải chăng và dịch vụ khách hàng tận tâm.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal "Liên hệ" - Nằm bên trong SideModal */}
      <Modal
        transparent
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
        animationType="slide"
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setContactModalVisible(false)}
          />
          <View className="bg-white rounded-t-3xl p-6 shadow-xl pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-blue-950">Thông tin liên hệ</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)} className="p-1">
                <Ionicons name="close-circle" size={28} color="#d1d5db" />
              </TouchableOpacity>
            </View>
            <Text className="text-base text-gray-800 mb-3"><Text className="font-semibold">Email:</Text> support@airsky.com</Text>
            <Text className="text-base text-gray-800 mb-3"><Text className="font-semibold">Hotline 24/7:</Text> 1900 1234</Text>
            <Text className="text-base text-gray-800"><Text className="font-semibold">Địa chỉ:</Text> 123 Đường ABC, Quận 1, TP. HCM</Text>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});

export default SideModal;