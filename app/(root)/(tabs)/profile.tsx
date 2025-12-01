import { useAuth } from "@/context/auth-context";
import { changePassword } from "@/services/auth-service";
import { updateProfile } from "@/services/user-service";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from "date-fns";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading, updateUser } = useAuth();

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // State để quản lý loading khi cập nhật
  // States for editable fields in the modal
  const [editedFirstName, setEditedFirstName] = useState(user?.firstName || '');
  const [editedLastName, setEditedLastName] = useState(user?.lastName || '');
  const [editedPhone, setEditedPhone] = useState(user?.phone || '');
  const [editedAvatar, setEditedAvatar] = useState(user?.avatar || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? new Date(user?.dateOfBirth) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false); // State để theo dõi thay đổi

  // States for change password modal
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isOldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
  const [isConfirmNewPasswordVisible, setConfirmNewPasswordVisible] = useState(false);

  // Update local states when user data changes or modal opens
  useEffect(() => {
    setEditedFirstName(user?.firstName || '');
    setEditedLastName(user?.lastName || '');
    setEditedPhone(user?.phone || '');
    setEditedAvatar(user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0D8ABC&color=fff`);
    if (user?.dateOfBirth) {
      setDateOfBirth(new Date(user?.dateOfBirth));
    }
  }, [user, isEditModalVisible]);

  // Effect để kiểm tra xem có thay đổi nào không
  useEffect(() => {
    if (!user) {
      setHasChanges(false);
      return;
    }

    const firstNameChanged = editedFirstName !== (user?.firstName || '');
    const lastNameChanged = editedLastName !== (user?.lastName || '');
    const phoneChanged = editedPhone !== (user?.phone || '');
    const avatarChanged = editedAvatar !== (user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0D8ABC&color=fff`);
    const dobChanged = user?.dateOfBirth
      ? format(dateOfBirth, 'yyyy-MM-dd') !== format(new Date(user?.dateOfBirth), 'yyyy-MM-dd')
      : format(dateOfBirth, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd'); // So sánh với ngày hiện tại nếu DOB ban đầu là null

    setHasChanges(firstNameChanged || lastNameChanged || phoneChanged || avatarChanged || dobChanged);
  }, [editedFirstName, editedLastName, editedPhone, editedAvatar, dateOfBirth, user]);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center p-8">
        <Ionicons name="person-circle-outline" size={80} color="#cbd5e1" />
        <Text className="text-xl font-bold text-gray-700 mt-4 text-center">Ooppss!</Text>
        <Text className="text-base text-gray-500 mt-2 text-center">Bạn cần đăng nhập để xem thông tin cá nhân và các ưu đãi đặc biệt.</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(root)/(auth)/sign-in')} 
          className="bg-blue-900 py-3 px-8 rounded-full mt-8">
          <Text className="text-white font-bold text-base">Đăng nhập ngay</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSaveChanges = async () => {
    if (!user || isUpdating) return;

    setIsUpdating(true); 
    const profileData = {
      firstName: editedFirstName,
      lastName: editedLastName,
      phone: editedPhone,
      avatar: editedAvatar,
      dateOfBirth: format(dateOfBirth, 'yyyy-MM-dd'), // Backend cần format YYYY-MM-DD
    };

    try {
      const updatedUser = await updateProfile(user?.id, profileData);
      updateUser(updatedUser); // Cập nhật user trong context
      Alert.alert("Thành công", "Thông tin hồ sơ đã được cập nhật.");
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert("Cập nhật thất bại", error.message);
    } finally {
      setIsUpdating(false); // Kết thúc quá trình cập nhật
    }

  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert("Mật khẩu không hợp lệ", "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt.");
      return;
    }

    setIsUpdating(true);
    try {
      const email = user?.email as string;
      await changePassword({ email, oldPassword, newPassword });
      Alert.alert("Thành công", "Mật khẩu của bạn đã được thay đổi.", [
        {
          text: "OK", onPress: () => {
            setChangePasswordModalVisible(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert("Đổi mật khẩu thất bại", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    // Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền bị từ chối', 'Rất tiếc, chúng tôi cần quyền truy cập thư viện ảnh để bạn có thể thay đổi ảnh đại diện!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setEditedAvatar(result.assets[0].uri);
    }
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dateOfBirth;
    setShowDatePicker(Platform.OS === 'ios');
    setDateOfBirth(currentDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      <Text className="p-4 text-center text-white font-bold uppercase">Hồ sơ cá nhân</Text>
        <ScrollView className="bg-white rounded-t-[40px]" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* User Header */}
          <View className="bg-white p-6 items-center shadow-sm border-b border-gray-200">
            <Image
              source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0D8ABC&color=fff` }}
              className="w-24 h-24 rounded-full mb-3 border-2 border-blue-200"
            />
            <Text className="text-2xl font-bold text-blue-900">{user?.firstName} {user?.lastName}</Text>
            <Text className="text-gray-600 mt-1">{user?.email}</Text>
          </View>

          {/* Loyalty Program Card */}
          <View className="p-4">
            <View className="bg-blue-950 rounded-xl p-5 shadow-lg">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold uppercase">{user?.loyaltyTier || 'STANDARD'}</Text>
                <Text className="text-white font-mono tracking-widest">{user?.membershipCode || 'N/A'}</Text>
              </View>
              <View className="mt-4">
                <Text className="text-white font-semibold">Điểm tích lũy</Text>
                <Text className="text-white font-bold text-3xl mt-1">{user?.loyaltyPoints?.toLocaleString('vi-VN') || 0}</Text>
                <TouchableOpacity>
                  <Text className="text-blue-300 text-xs mt-2 underline">Xem lịch sử điểm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Account Options */}
          <View className="px-4 space-y-2 ">
            <View className="bg-white rounded-xl p-2">
              <Text className="text-sm font-bold text-gray-500 uppercase px-3 pt-3 pb-1">Tài khoản</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(true)} className="flex-row items-center p-3">
                <Ionicons name="person-outline" size={22} color="#4b5563" />
                <Text className="text-base text-gray-700 ml-4">Chỉnh sửa thông tin</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {user?.authProvider !== 'GOOGLE' && (
                <>
                  <View className="h-[1px] bg-gray-100 mx-3" />
                  <TouchableOpacity onPress={() => setChangePasswordModalVisible(true)} className="flex-row items-center p-3">
                    <Ionicons name="lock-closed-outline" size={22} color="#4b5563" />
                    <Text className="text-base text-gray-700 ml-4">Đổi mật khẩu</Text>
                    <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity className="flex-row items-center p-3">
                <Ionicons name="settings-outline" size={22} color="#4b5563" />
                <Text className="text-base text-gray-700 ml-4">Cài đặt</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={logout} className="flex-row items-center p-3">
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                <Text className="text-base text-red-500 ml-4 font-semibold">Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isEditModalVisible}
        onRequestClose={() => !isUpdating && setEditModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white pt-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View className="justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-blue-950 text-center">Chỉnh sửa thông tin</Text>
            </View>

            {/* Modal Content */}
            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Avatar */}
              <View className="items-center mb-6">
                <Image
                  source={{ uri: editedAvatar }}
                  className="w-32 h-32 rounded-full border-4 border-blue-200"
                />
                <TouchableOpacity onPress={handlePickImage} disabled={isUpdating} className={`mt-3 bg-blue-100 py-2 px-4 rounded-full ${isUpdating ? 'opacity-50' : ''}`}>
                  <Text className="font-semibold text-blue-800">Thay đổi ảnh</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3 pb-3">
                <TextInput label="Họ" value={editedLastName} onChangeText={setEditedLastName} mode="outlined" />
                <TextInput label="Tên" value={editedFirstName} onChangeText={setEditedFirstName} mode="outlined" />
                <TextInput label="Email" value={user?.email} editable={false} mode="outlined" className="bg-gray-100" />
                <TextInput label="Số điện thoại" value={editedPhone} onChangeText={setEditedPhone} mode="outlined" keyboardType="phone-pad" />

                {/* Date Picker Input */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    label="Ngày sinh"
                    value={format(dateOfBirth, 'dd/MM/yyyy')}
                    mode="outlined"
                    editable={false} // Không cho phép nhập tay
                    right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                  />
                </TouchableOpacity>

                {/* Date Picker Component */}
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={dateOfBirth}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                    maximumDate={new Date()} // Không cho chọn ngày trong tương lai
                  />
                )}
              </View>

              <View className="flex-row justify-between space-x-4 mt-4">
                <TouchableOpacity onPress={() => setEditModalVisible(false)} disabled={isUpdating} className={`py-3 rounded-full flex-1 bg-gray-200 items-center justify-center ${isUpdating ? 'opacity-50' : ''}`}>
                  <Text className="text-gray-700 font-bold text-base">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveChanges} disabled={isUpdating || !hasChanges} className={`py-3 rounded-full flex-1 bg-blue-900 items-center justify-center ${(isUpdating || !hasChanges) ? 'opacity-50' : ''}`}>
                  <Text className="text-white font-bold text-base">{isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isChangePasswordModalVisible}
        onRequestClose={() => !isUpdating && setChangePasswordModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white pt-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View className="justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-blue-950 text-center">Đổi mật khẩu</Text>
            </View>

            {/* Modal Content */}
            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 20 }}>
              <View className="gap-4">
                <TextInput
                  label="Mật khẩu hiện tại"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  mode="outlined"
                  secureTextEntry={!isOldPasswordVisible}
                  right={<TextInput.Icon icon={isOldPasswordVisible ? "eye-off" : "eye"} onPress={() => setOldPasswordVisible(!isOldPasswordVisible)} />}
                  className="bg-transparent"
                />
                <TextInput
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  mode="outlined"
                  secureTextEntry={!isNewPasswordVisible}
                  right={<TextInput.Icon icon={isNewPasswordVisible ? "eye-off" : "eye"} onPress={() => setNewPasswordVisible(!isNewPasswordVisible)} />}
                  className="bg-transparent"

                />
                <TextInput
                  label="Xác nhận mật khẩu mới"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  mode="outlined"
                  secureTextEntry={!isConfirmNewPasswordVisible}
                  right={<TextInput.Icon icon={isConfirmNewPasswordVisible ? "eye-off" : "eye"} onPress={() => setConfirmNewPasswordVisible(!isConfirmNewPasswordVisible)} />}
                  className="bg-transparent"

                />
              </View>

              <View className="flex-row justify-between space-x-4 mt-8">
                <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)} disabled={isUpdating} className={`py-3 rounded-full flex-1 bg-gray-200 items-center justify-center ${isUpdating ? 'opacity-50' : ''}`}>
                  <Text className="text-gray-700 font-bold text-base">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePasswordChange} disabled={isUpdating || !oldPassword || !newPassword || !confirmNewPassword} className={`py-3 rounded-full flex-1 bg-blue-900 items-center justify-center ${(isUpdating || !oldPassword || !newPassword || !confirmNewPassword) ? 'opacity-50' : ''}`}>
                  <Text className="text-white font-bold text-base">{isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;