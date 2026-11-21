import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function LandingPage({
  onLogin,
  onRegister
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  const slides = [
    {
      title: "Smart Bookkeeping\nfor Your Business",
      description: "Track your income & expenses,\nmonitor tax deadlines, and\nkeep your business on track.",
      features: [
        { label: "Track Income & Expenses", icon: require("../../assets/growth.png") },
        { label: "Monitor BIR Deadlines", icon: require("../../assets/calendar.png") },
        { label: "Generate Reports", icon: require("../../assets/document.png") }
      ]
    },
    {
      title: "Know Where Your\nMoney Goes",
      description: "Record every transaction clearly\nand understand your business\ncash flow with confidence.",
      features: [
        { label: "Easy Expense Logging", icon: require("../../assets/growth.png") },
        { label: "Clear Income Records", icon: require("../../assets/document.png") },
        { label: "Simple Summaries", icon: require("../../assets/document.png") }
      ]
    },
    {
      title: "Never Miss a\nTax Deadline",
      description: "Stay aware of important BIR\nfiling schedules and keep\nyour compliance on schedule.",
      features: [
        { label: "BIR Deadline Reminders", icon: require("../../assets/calendar.png") },
        { label: "Organized Records", icon: require("../../assets/document.png") },
        { label: "Timely Filing Alerts", icon: require("../../assets/calendar.png") }
      ]
    },
    {
      title: "Grow Your Business\nWith Clear Reports",
      description: "Turn daily records into useful\nreports that help you make\nbetter business decisions.",
      features: [
        { label: "Income Reports", icon: require("../../assets/growth.png") },
        { label: "Expense Reports", icon: require("../../assets/document.png") },
        { label: "Business Insights", icon: require("../../assets/growth.png") }
      ]
    }
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const dotWidths = useRef(slides.map((_, index) => new Animated.Value(index === 0 ? 18 : 7))).current;
  const slide = slides[activeSlide];

  function changeSlide(nextSlide: number) {
    if (nextSlide === activeSlide) return;
    setActiveSlide(nextSlide);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    contentOpacity.setValue(0);
    contentTranslateX.setValue(activeSlide === 0 ? 14 : -14);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true
      }),
      Animated.spring(contentTranslateX, {
        toValue: 0,
        speed: 16,
        bounciness: 3,
        useNativeDriver: true
      })
    ]).start();

    dotWidths.forEach((width, index) => {
      Animated.spring(width, {
        toValue: index === activeSlide ? 18 : 7,
        speed: 18,
        bounciness: 5,
        useNativeDriver: false
      }).start();
    });
  }, [activeSlide, dotWidths]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/fintrack-logo.png")}
            style={styles.logoMark}
            resizeMode="contain"
            accessibilityLabel="FinTrack logo"
          />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.skipButton}
          onPress={onRegister}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: contentOpacity,
            transform: [{ translateX: contentTranslateX }]
          }
        ]}
      >
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
        <Image
          source={require("../../assets/fintrack-landing.png")}
          style={styles.hero}
          resizeMode="contain"
          accessibilityLabel="FinTrack bookkeeping illustration"
        />

        <View style={styles.features}>
          {slide.features.map((feature) => (
            <View style={styles.featureRow} key={feature.label}>
              <Image
                source={feature.icon}
                style={styles.featureIconImage}
                resizeMode="contain"
                tintColor="#087a43"
                accessibilityLabel={feature.label}
              />
              <Text style={styles.featureText}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Show landing page ${index + 1}`}
            accessibilityState={{ selected: activeSlide === index }}
            onPress={() => changeSlide(index)}
            style={styles.dotTouch}
          >
            <Animated.View
              style={[
                styles.dot,
                { width: dotWidths[index] },
                activeSlide === index && styles.dotActive
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={onRegister}
        testID="landing-register"
      >
        <Text style={styles.primaryLabel}>Get Started <Text style={styles.arrow}>→</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" style={styles.loginLink} onPress={onLogin}>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Log In</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
    minHeight: 760,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  animatedContent: {
    width: "100%"
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoMark: { width: 150, height: 54 },
  skipButton: {
    backgroundColor: "#eef1f0",
    borderRadius: 20,
    minWidth: 58,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  skipText: { color: "#5d6a64", fontSize: 13, fontWeight: "600" },
  title: {
    color: "#1d2521",
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 10
  },
  description: {
    color: "#353d39",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 8
  },
  hero: {
    width: "100%",
    height: 250,
    alignSelf: "center",
    marginTop: -12,
    marginBottom: 2
  },
  features: { gap: 8, marginBottom: 12 },
  featureRow: { height: 48, flexDirection: "row", alignItems: "center" },
  featureIconImage: {
    width: 32,
    height: 32,
    marginRight: 12
  },
  featureText: { color: "#27322d", fontSize: 17, fontWeight: "700" },
  pagination: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8
  },
  dotTouch: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#cad4cf" },
  dotActive: { backgroundColor: "#087a43" },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#087a43",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  arrow: { fontSize: 20 },
  loginLink: { alignItems: "center", paddingTop: 12 },
  loginText: { color: "#626a66", fontSize: 12 },
  loginBold: { color: "#087a43", fontWeight: "800" }
});
