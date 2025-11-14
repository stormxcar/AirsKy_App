import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Animated, Dimensions, Text, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
            <View className={`flex-row items-center p-4 border-b ${headerBorderColor}`}>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="chevron-back" size={28} color={headerIconColor} />
              </TouchableOpacity>
              <Text className={`text-lg font-bold ${headerTextColor} flex-1 text-center mr-8`}>{title}</Text>
            </View>
            <View className="flex-1">
              {children}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
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