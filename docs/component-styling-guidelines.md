# Component Styling Guidelines

## File Structure

- **Types first**: Type definitions at the top serve as documentation
- **Exports second**: Component exports immediately after types for visibility
- **Styled components third**: All styled components after the main export (more relevant to component structure)
- **Utility functions fourth**: Helper functions and components scoped to the file come after styled components
- **Styles last**: cacheStyles objects at the bottom of the file

## Styling Patterns

- **Always use `styled` HOC** from `@src/components/hoc/styled.tsx` instead of inline styles
- **Run `yarn eslint --fix`** on all files to format and fix lint errors automatically
- **EdgeText with styled**: EdgeText can be used with styled HOC since it accepts a `style` prop
- **Raw text fallback**: If styled EdgeText causes raw text ESLint errors, use regular EdgeText with cacheStyles
- **Avoid inline styles**: Use styled HOC or cacheStyles, never inline style objects

## Example File Structure

```tsx
// Types first
interface Props {
  // ...
}

// Exports second
export const MyComponent = (props: Props) => {
  return (
    <Container>
      <StyledText>{formatText('Hello')}</StyledText>
    </Container>
  )
}

// Styled components third (more relevant to component structure)
const Container = styled(View)({
  // styles
})

const StyledText = styled(EdgeText)({
  // styles
})

// Utility functions fourth (scoped to this file)
const formatText = (text: string): string => {
  return text.toUpperCase()
}

// Styles last (if needed for complex cases)
const styles = cacheStyles({
  // fallback styles
})
```
