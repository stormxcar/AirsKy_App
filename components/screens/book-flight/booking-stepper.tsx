import React from 'react';
import { Text, View } from 'react-native';

type StepProps = {
    number: number;
    label: string;
    isActive: boolean;
};

const Step = ({ number, label, isActive }: StepProps) => (
    <View className="items-center">
        <View className={`w-8 h-8 rounded-full justify-center items-center ${isActive ? 'bg-blue-900' : 'bg-gray-300'}`}>
            <Text className={`font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{number}</Text>
        </View>
        <Text className={`text-xs mt-1 text-center ${isActive ? 'text-blue-900 font-bold' : 'text-gray-500'}`}>{label}</Text>
    </View>
);

const BookingStepper = ({ currentStep = 1 }: { currentStep?: number }) => {
    const steps = [
        { number: 1, label: 'Điền thông tin' },
        { number: 2, label: 'Dịch vụ & Ghế' },
        { number: 3, label: 'Thanh toán' },
    ];

    return (
        <View className="flex-row items-start justify-between p-4 bg-white">
            {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                    <Step number={step.number} label={step.label} isActive={currentStep >= step.number} />
                    {index < steps.length - 1 && <View className="flex-1 h-[2px] bg-gray-300 mx-2 mt-4" />}
                </React.Fragment>
            ))}
        </View>
    );
};

export default BookingStepper;