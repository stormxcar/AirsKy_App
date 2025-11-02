import { BaggagePackage, BAGGAGE_PACKAGES } from '@/app/types/types';
import { AncillaryServiceResponse } from '@/app/types/ancillary-service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type AdditionalServicesProps = {
  // Hành lý vẫn được xử lý riêng
  selectedBaggage: BaggagePackage | null;
  onBaggageChange: (pkg: BaggagePackage | null) => void;

  // Dữ liệu cho các dịch vụ khác
  ancillaryServices: AncillaryServiceResponse[];
  selectedServices: { [serviceId: number]: boolean }; // { serviceId: isSelected }
  onServiceChange: (serviceId: number, isSelected: boolean) => void;
};

const AdditionalServices = ({
  selectedBaggage,
  onBaggageChange,
  ancillaryServices,
  selectedServices,
  onServiceChange,
}: AdditionalServicesProps) => {
  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
      <Text className="text-lg font-bold text-blue-950 mb-3">Dịch vụ cộng thêm</Text>

      {/* Extra Baggage */}
      <View className="border-b border-gray-100">
        <Text className="text-base font-semibold text-gray-800 pt-3">Hành lý ký gửi</Text>
        <Text className="text-sm text-gray-500 mb-2">Chọn một gói hành lý cho hành khách này.</Text>
        {BAGGAGE_PACKAGES.filter(pkg => pkg.key !== 'NONE').map((pkg) => {
            const isSelected = selectedBaggage?.key === pkg.key;
            return (
              <TouchableOpacity
                key={pkg.key}
                onPress={() => onBaggageChange(isSelected ? null : pkg)}
                className="border-t border-gray-100"
              >
                <View className="flex-row justify-between items-center py-3">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-gray-800">{pkg.label}</Text>
                    <Text className="text-sm font-bold text-blue-900 mt-1">
                      +{pkg.price.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
              <MaterialCommunityIcons
                name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                size={28}
                color={isSelected ? '#1e3a8a' : '#ccc'}
              />
                </View>
              </TouchableOpacity>
            );
        })}
      </View>

      {/* Other Ancillary Services */}
      {ancillaryServices.map((service) => {
        const isSelected = !!selectedServices[service.serviceId];
        return (
          <TouchableOpacity
            key={service.serviceId}
            onPress={() => onServiceChange(service.serviceId, !isSelected)}
            className="border-b border-gray-100"
          >
            <View className="flex-row justify-between items-center py-3">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-gray-800">{service.serviceName}</Text>
                <Text className="text-sm text-gray-500">{service.description}</Text>
                <Text className="text-sm font-bold text-blue-900 mt-1">
                  +{service.price.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
              <MaterialCommunityIcons
                name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                size={28}
                color={isSelected ? '#1e3a8a' : '#ccc'}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AdditionalServices;