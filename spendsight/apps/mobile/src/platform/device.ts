import { Platform } from "react-native";

export function getPlatformName(): string {
    return Platform.OS;
}

export function isWeb(): boolean {
    return Platform.OS === "web";
}

export function isNative(): boolean {
    return Platform.OS !== "web";
}