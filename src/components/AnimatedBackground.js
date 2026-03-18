// 1. Import React
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = {
  animatedShape: 'rgba(46, 125, 50, 0.15)',
};

// The component logic remains the same
function AnimatedBackground() {
  const { width, height } = Dimensions.get('window');

  const shapes = useRef(
    [...Array(12)].map(() => ({
      position: new Animated.ValueXY({ x: Math.random() * width, y: Math.random() * height }),
      size: Math.random() * 50 + 20,
      opacity: Math.random() * 0.7 + 0.3,
    }))
  ).current;

  useEffect(() => {
    const animate = (shape) => {
      const newX = Math.random() * width;
      const newY = Math.random() * height;
      const duration = Math.random() * 10000 + 10000;

      Animated.timing(shape.position, {
        toValue: { x: newX, y: newY },
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => animate(shape));
    };

    shapes.forEach(animate);
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {shapes.map((shape, index) => (
        <Animated.View
          key={index}
          style={[
            styles.shape,
            {
              width: shape.size,
              height: shape.size,
              borderRadius: shape.size / 2,
              opacity: shape.opacity,
              transform: shape.position.getTranslateTransform(),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
    backgroundColor: COLORS.animatedShape,
  },
});

// 2. Wrap the component in React.memo before exporting
export default React.memo(AnimatedBackground);
