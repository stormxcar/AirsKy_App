import { TicketClass } from '@/app/types/types';
import { FontAwesome } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Text, TouchableOpacity, View, ViewToken } from 'react-native';

// --- PROPS ---
type TicketClassCarouselProps = {
    ticketClasses: TicketClass[];
    selectedClassId: string | null;
    onSelectClass: (ticketClass: TicketClass | null) => void;
};

// --- CONSTANTS ---
const { width: screenWidth } = Dimensions.get('window');

const TICKET_CLASS_ITEM_WIDTH = screenWidth - 76;

// --- SUB-COMPONENTS ---

// Component cho mỗi thẻ hạng vé
const TicketClassCard = React.memo(({ item, isSelected, onSelect }: { item: TicketClass, isSelected: boolean, onSelect: () => void }) => (

    <TouchableOpacity
        onPress={onSelect}
        style={{ width: TICKET_CLASS_ITEM_WIDTH }}
        className={`p-4 mx-2 rounded-lg border-2 flex-1 justify-between ${isSelected ? "border-blue-900 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
    >
        <View className="flex-row justify-between items-center w-full">
            <Text className="text-lg font-bold text-blue-900">{item.name}</Text>
            {isSelected ?
                (<FontAwesome name="check-circle" size={24} color="#1e3a8a" />) :
                (<FontAwesome name="circle-o" size={24} color="#ccc" />)
            }
        </View>
        <Text className="text-xl font-bold text-blue-900 mt-2">
            {item.finalPrice.toLocaleString('vi-VN')} ₫
        </Text>
        <Text className="text-xs text-gray-500 mt-1 text-start">
            {item.description
                ?.split(',')
                .map((part, index) => (
                    <Text key={index}>{part.trim()}{'\n'}</Text>
                ))}
        </Text>

    </TouchableOpacity>
));
TicketClassCard.displayName = 'TicketClassCard';

// Component cho mỗi dấu chấm chỉ báo
const Dot = React.memo(({ index, activeIndex }: { index: number, activeIndex: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: index === activeIndex ? 1.5 : 1,
            useNativeDriver: true,
            friction: 3,
        }).start();
    }, [activeIndex]);

    return (
        <Animated.View
            style={[{ transform: [{ scale: scaleAnim }] }]}
            className={`h-2 w-2 rounded-full mx-1 ${index === activeIndex ? 'bg-blue-900' : 'bg-gray-300'}`}
        />
    );
});
Dot.displayName = 'Dot';


// --- MAIN COMPONENT ---
const TicketClassCarousel = ({ ticketClasses, selectedClassId, onSelectClass }: TicketClassCarouselProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // Sử dụng onViewableItemsChanged để xác định item nào đang hiển thị
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    // Cấu hình để onViewableItemsChanged được gọi khi 50% item hiển thị
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    if (!ticketClasses || ticketClasses.length === 0) {
        return <Text className="text-center text-gray-500">Không có hạng vé nào.</Text>;
    }

    return (
        <View>
            <FlatList
                data={ticketClasses}
                renderItem={({ item }) => (
                    <TicketClassCard
                        item={item}
                        isSelected={selectedClassId === item.id}
                        onSelect={() => onSelectClass(selectedClassId === item.id ? null : item)}
                    />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={TICKET_CLASS_ITEM_WIDTH + 8} // width + margin (mx-2 -> 4*2=8)
                contentContainerStyle={{ paddingHorizontal: 2 }} // Bù lại cho margin của item
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />
            {/* Dots Indicator */}
            <View className="flex-row justify-center items-center pt-3">
                {ticketClasses.map((_, index) => (
                    <Dot key={`dot-${index}`} index={index} activeIndex={activeIndex} />
                ))}
            </View>
        </View>
    );
};

export default TicketClassCarousel;
