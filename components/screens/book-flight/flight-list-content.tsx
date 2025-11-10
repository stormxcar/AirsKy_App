import React, { RefObject } from 'react';
import { 
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    LayoutChangeEvent,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Flight, TicketClass } from '@/app/types/types';
import { DateScrollerItem } from '@/hooks/use-date-scroller';
import FlightItem from './flight-item';
import FlightItemSkeleton from '@/components/screens/book-flight/skeletons/flight-item-skeleton';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface FlightListContentProps {
    isInitialLoading: boolean;
    selectionPhase: 'depart' | 'return';
    params: {
        departureDate: string;
        returnDate?: string;
    };
    dateScrollerData: DateScrollerItem[];
    handleSelectDateFromScroller: (date: string) => void;
    dateScrollViewRef: RefObject<ScrollView>;
    scrollPosition: { x: number; contentWidth: number; layoutWidth: number };
    setScrollPosition: React.Dispatch<React.SetStateAction<{ x: number; contentWidth: number; layoutWidth: number }>>;
    SCROLL_AMOUNT: number;
    dateItemLayouts: React.MutableRefObject<Map<string, { x: number; width: number }>>;
    isLoadingDates: boolean;
    isLoadingFlights: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    displayedFlights: Flight[];
    selectedFlightId: string | null;
    selectedClass: TicketClass | null;
    handleSelectFlight: (flightId: string) => void;
    handleSelectClass: (ticketClass: TicketClass | null) => void;
    headerInfo: { listTitle: string };
    error: string | null;
}

const FlightListContent: React.FC<FlightListContentProps> = ({
    isInitialLoading,
    selectionPhase,
    params,
    dateScrollerData,
    handleSelectDateFromScroller,
    dateScrollViewRef,
    scrollPosition,
    setScrollPosition,
    SCROLL_AMOUNT,
    dateItemLayouts,
    isLoadingDates,
    isLoadingFlights,
    isRefreshing,
    onRefresh,
    displayedFlights,
    selectedFlightId,
    selectedClass,
    handleSelectFlight,
    handleSelectClass,
    headerInfo,
    error,
}) => {
    // Hợp nhất trạng thái loading. Giao diện sẽ ở trạng thái tải nếu một trong hai (ngày hoặc chuyến bay) đang tải.
    const isContentLoading = (isLoadingDates || isLoadingFlights) && !isInitialLoading;

    // Animation cho hiệu ứng trượt khi tải lại danh sách
    const listAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isContentLoading ? 0 : 1, { duration: 250 }),
            transform: [
                { translateY: withTiming(isContentLoading ? 20 : 0, { duration: 300, easing: Easing.out(Easing.ease) }) },
            ],
        };
    });

    const skeletonAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isContentLoading ? 1 : 0, { duration: 250 }),
            transform: [
                { translateY: withTiming(isContentLoading ? 0 : -20, { duration: 300, easing: Easing.out(Easing.ease) }) },
            ],
            // Dùng position absolute để skeleton và list có thể chồng lên nhau trong lúc chuyển đổi
            position: 'absolute',
        };
    });
    return (
        <View className="bg-white flex-1 rounded-t-[40px] -mt-4 overflow-hidden">
            {/* Date Scroller with Prev/Next buttons */}
            <View className="py-4 border-b border-gray-100 relative">
                <View className="flex-row items-center">
                    {/* Prev Button */}
                    <AnimatedTouchableOpacity
                        onPress={() => dateScrollViewRef.current?.scrollTo({ x: Math.max(0, scrollPosition.x - SCROLL_AMOUNT), animated: true })}
                        className="px-2 z-10"
                        style={useAnimatedStyle(() => ({ opacity: withTiming(scrollPosition.x > 0 ? 1 : 0.3) }))}
                        disabled={scrollPosition.x <= 0}
                    >
                        <Ionicons name="chevron-back" size={20} color="#1e3a8a" />
                    </AnimatedTouchableOpacity>

                    {/* Scrollable Dates */}
                    <ScrollView
                            ref={dateScrollViewRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 4 }}
                            onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                                const x = event.nativeEvent.contentOffset.x;
                                setScrollPosition(prev => ({ ...prev, x }));
                            }}
                            onContentSizeChange={(contentWidth) => {
                                setScrollPosition(prev => ({ ...prev, contentWidth }));
                            }}
                            onLayout={(event: LayoutChangeEvent) => {
                                const layoutWidth = event.nativeEvent.layout.width;
                                setScrollPosition(prev => ({ ...prev, layoutWidth }));
                            }}
                            scrollEventThrottle={16} // Tần suất gọi onScroll
                        >
                            {dateScrollerData.map((item) => {
                                const isSelected = (selectionPhase === 'depart' && item.date === params.departureDate) || (selectionPhase === 'return' && item.date === params.returnDate);
                                return (
                                    <TouchableOpacity
                                        key={`${selectionPhase}-${item.date}`}
                                        onLayout={(event: LayoutChangeEvent) => {
                                            if (event && event.nativeEvent) {
                                                const layout = event.nativeEvent.layout;
                                                dateItemLayouts.current.set(item.date, { x: layout.x, width: layout.width });
                                            }
                                        }}
                                        onPress={() => handleSelectDateFromScroller(item.date)}
                                        className={`items-center justify-center px-4 py-2 rounded-lg mx-1 w-34 ${isSelected ? "bg-blue-50 border-blue-900 border" : "bg-gray-100"}`}
                                    >
                                        <Text className={`text-sm font-semibold capitalize ${isSelected ? "text-blue-900" : "text-gray-500"}`}>{item.displayDate}</Text>
                                        {item.price !== null ? (
                                            <Text className={`text-xs font-bold mt-1 ${item.isCheapest ? "text-orange-600" : (isSelected ? "text-blue-900" : "text-gray-600")}`}>
                                                {(item.price / 1000).toFixed(0)}k
                                            </Text>
                                        ) : (
                                            <Text className="text-xs text-gray-400 mt-1">--</Text>
                                        )}
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>

                    {/* Next Button - Animated */}
                    <AnimatedTouchableOpacity
                        onPress={() => dateScrollViewRef.current?.scrollTo({ x: Math.min(scrollPosition.contentWidth - scrollPosition.layoutWidth, scrollPosition.x + SCROLL_AMOUNT), animated: true })}
                        className="px-2 z-10"
                        style={useAnimatedStyle(() => ({
                            opacity: withTiming(scrollPosition.x < scrollPosition.contentWidth - scrollPosition.layoutWidth - 1 ? 1 : 0.3)
                        }))}
                        disabled={scrollPosition.x >= scrollPosition.contentWidth - scrollPosition.layoutWidth - 1}
                    >
                        <Ionicons name="chevron-forward" size={20} color="#1e3a8a" />
                    </AnimatedTouchableOpacity>
                </View>
            </View>

            {/* Phần nội dung danh sách chuyến bay */}
            {!isInitialLoading && (
                <View className="flex-1 px-4 pt-4">
                    {/* Header của danh sách, luôn hiển thị */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-blue-900">{headerInfo.listTitle}</Text>
                    </View>

                    {/* Skeleton hoặc danh sách thực tế */}
                    <View className="flex-1">
                        {/* Skeleton View */}
                        <Animated.View style={skeletonAnimatedStyle} className="w-full">
                            <View>
                                <FlightItemSkeleton />
                                <FlightItemSkeleton />
                                <FlightItemSkeleton />
                            </View>
                        </Animated.View>

                        {/* Actual List View */}
                        <Animated.View style={listAnimatedStyle} className="flex-1">
                            <FlatList
                                extraData={{ selectedFlightId, selectedClass }}
                                data={displayedFlights}
                                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#1e3a8a']} />}
                                renderItem={({ item }) => (
                                    <FlightItem
                                        flight={item}
                                        isSelected={selectedFlightId === item.id}
                                        selectedClassId={selectedFlightId === item.id ? selectedClass?.id ?? null : null}
                                        onSelect={() => handleSelectFlight(item.id)}
                                        onSelectClass={handleSelectClass}
                                    />
                                )}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 120 }}
                                ListEmptyComponent={
                                    <View className="items-center mt-10 p-4">
                                        {!isLoadingFlights && !isRefreshing && (
                                            <>
                                                <Ionicons name="airplane-outline" size={100} color="#cbd5e1" />
                                                <Text className="text-lg font-bold text-gray-600 mt-4">Không tìm thấy chuyến bay</Text>
                                                {error ? (
                                                    <Text className="text-red-500 text-center mt-2">{error}</Text>
                                                ) : (
                                                    <Text className="text-gray-500 text-center mt-2">Vui lòng thử tìm kiếm với ngày hoặc chặng bay khác.</Text>
                                                )}
                                            </>
                                        )}
                                    </View>
                                }
                            />
                        </Animated.View>
                    </View>
                </View>
            )}
        </View>
    );
};

export default FlightListContent;
                  