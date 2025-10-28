import { useLoading } from '@/context/loading-context';
import LottieView from 'lottie-react-native';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

const LoadingOverlay = () => {
  const { isLoading } = useLoading();

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isLoading}
      onRequestClose={() => {}}
    >
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorWrapper}>
          <LottieView
            source={require('@/assets/animations/airplane.json')}
            autoPlay
            loop
            style={{ width: 400, height: 400 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // Một màu xanh da trời rất nhạt
  },
  activityIndicatorWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 20,
    color: '#1e3a8a', // Màu xanh đậm (blue-900)
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoadingOverlay;