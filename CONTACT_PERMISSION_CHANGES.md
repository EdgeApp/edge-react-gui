# Contact Permission Modal Removal

## Overview
This change removes the contact permissions modal that was shown unexpectedly when users received their first transaction. The modal caused modal fatigue and was obtrusive. Instead, the permissions UI is now embedded directly in the edit transaction contact name modal.

## Changes Made

### Files Removed
- `/src/components/modals/ContactsPermissionModal.tsx` - The standalone contact permission modal

### Files Modified

#### `/src/components/modals/ContactListModal.tsx`
- **Removed**: Call to `maybeShowContactsPermissionModal()` in `useAsyncEffect`
- **Added**: Permission checking logic that determines whether to show embedded permissions UI or contact list
- **Added**: Import for new `ContactPermissionsSection` component
- **Modified**: Conditional rendering to show either:
  - `EdgeModal` with embedded permissions section (when permissions not granted)
  - Standard `ListModal` with contacts (when permissions granted)

#### `/src/hooks/redux/useContactThumbnail.ts`
- **Removed**: Import and usage of `maybeShowContactsPermissionModal`
- **Removed**: Call to `dispatch(maybeShowContactsPermissionModal())`
- **Updated**: Comment to reflect that the hook no longer shows permission modal

### Files Added

#### `/src/components/modals/ContactPermissionsSection.tsx`
- **Purpose**: Embedded permissions UI component that replaces the standalone modal
- **Features**:
  - Shows contact permission explanation text (same as original modal)
  - Provides "Allow" button to grant permissions via `requestContactsPermission()`
  - Provides "Settings" button to open system settings via `openSettings()`
  - Calls `onPermissionGranted` callback when permissions are successfully granted
  - Uses same styling and messaging as original modal

## User Experience Improvements

### Before
1. User receives first transaction
2. Unexpected contact permission modal appears
3. User must deal with modal before continuing
4. Modal fatigue and obtrusive experience

### After
1. User receives first transaction (no unexpected modals)
2. When user wants to edit contact name, they see embedded permissions explanation
3. User can choose to grant permissions or open settings
4. Less obtrusive, contextual permissions request

## Technical Details

### Permission Flow
1. `ContactListModal` checks contact permissions on mount
2. If permissions not granted (`hasContactsPermission === false`):
   - Shows `EdgeModal` with `ContactPermissionsSection`
   - User can grant permissions or open settings
   - On permission granted, modal updates to show contact list
3. If permissions granted or still checking (`hasContactsPermission === true | null`):
   - Shows standard `ListModal` with contact list

### Backward Compatibility
- All existing contact-related functionality preserved
- Permission checking still occurs but without intrusive modal
- Users can still grant/deny permissions through embedded UI
- Settings integration remains unchanged

## Testing Recommendations
1. Test with fresh app install (no previous permission decision)
2. Test with permissions previously denied
3. Test with permissions previously granted
4. Verify transaction details scene contact editing still works
5. Verify contact thumbnails still load correctly when permissions granted