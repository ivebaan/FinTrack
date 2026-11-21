import React from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";

export function FormField(props: TextInputProps) {
  return <TextInput {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#b8c8c1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#fff"
  }
});
