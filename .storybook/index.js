import { getStorybookUI } from "@storybook/react-native";
import { AppRegistry } from "react-native";
import Animated from 'react-native-reanimated'

import { name as appName } from "../app.json";
import "./storybook.requires";

const StorybookUIRoot = getStorybookUI({});

// See https://github.com/software-mansion/react-native-reanimated/issues/1794#issuecomment-898393331
Animated.addWhitelistedNativeProps({})

AppRegistry.registerComponent(appName, () => StorybookUIRoot);