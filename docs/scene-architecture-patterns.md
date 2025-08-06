# Scene Architecture Patterns

## Overview

Edge scenes follow specific architectural patterns that must be adhered to for proper integration with the navigation system. This document outlines the critical patterns discovered during TradeCreateScene development.

## Critical Rule: No Custom Headers in Scenes

**NEVER implement custom header UI within scene components.** Headers are managed by `react-navigation` in `src/components/Main.tsx`.

### ❌ Incorrect Pattern (Architecture Violation)
```tsx
// DON'T DO THIS - Custom header in scene
const TradeCreateScene = () => {
  return (
    <SceneWrapper>
      <HeaderContainer>
        <HeaderButton onPress={handleBackPress}>
          <BackIcon />
        </HeaderButton>
        <LogoText>Edge</LogoText>
        <MenuIcon />
      </HeaderContainer>
      {/* Scene content */}
    </SceneWrapper>
  )
}
```

### ✅ Correct Pattern
```tsx
// DO THIS - Let react-navigation handle headers
const TradeCreateScene = () => {
  return (
    <SceneWrapper scroll>
      {/* Scene content only - no header elements */}
    </SceneWrapper>
  )
}
```

## SceneWrapper Usage

All scenes should use `SceneWrapper` from `src/components/common/SceneWrapper.tsx`:

- **With scrolling content**: `<SceneWrapper scroll>`
- **Without scrolling**: `<SceneWrapper>`
- **Never include header elements** inside SceneWrapper

## Navigation Configuration

Headers are configured in `src/components/Main.tsx` using react-navigation patterns. Scene components should focus solely on content, not navigation UI.

## TradeCreateScene Case Study

### What We Built
- Complete "Buy Crypto" interface matching design.png
- Location selector, fiat/crypto inputs, exchange rates, next button
- Proper dark theme styling and TypeScript integration

### Architecture Issue Discovered
- Initially implemented custom header UI within the scene
- This violates Edge's scene architecture patterns
- Headers must be managed by react-navigation, not individual scenes

### Resolution Required
1. Remove all custom header code from TradeCreateScene
2. Update SceneWrapper usage with proper props
3. Ensure react-navigation handles header display
4. Test integration with Edge's navigation system

## Key Takeaways

1. **Scenes handle content only** - never navigation UI
2. **SceneWrapper is the root container** for all scene content
3. **react-navigation manages headers** via Main.tsx configuration
4. **Always check existing scenes** for architectural patterns before implementing new ones

## Reference Files

- `src/components/Main.tsx` - Navigation configuration
- `src/components/common/SceneWrapper.tsx` - Scene wrapper patterns
- Existing scene files for architectural examples