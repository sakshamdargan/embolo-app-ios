# RaiseTicket Component Documentation

## Overview
The `RaiseTicket` component is a comprehensive support ticket management system integrated with Fluent Support portal functionality. It allows authenticated users to create, view, and manage support tickets directly from the Assistance page.

## Features

### 1. **Authentication Check**
- Displays a login prompt if the user is not authenticated
- Automatically fetches user information from AuthContext
- Redirects to login page when needed

### 2. **Create Ticket**
- Subject and message fields with validation
- Real-time form validation
- Loading states during submission
- Success/error notifications
- Auto-refresh ticket list after creation

### 3. **View All Tickets**
- Lists all user tickets with:
  - Ticket title/subject
  - Status badge (Open, Pending, Closed)
  - Creation date
  - Ticket ID
- Empty state with call-to-action
- Click to view ticket details

### 4. **View Ticket Details**
- Full ticket information display
- Conversation thread with all replies
- Visual distinction between customer and admin replies
- Timestamps for all messages
- Status indicator

### 5. **Reply to Tickets**
- Reply form within ticket details
- Real-time reply submission
- Auto-refresh conversation after reply
- Loading states and error handling

## API Integration

### Base URL
```
https://embolo.in/wp-json/fluent/v1
```

### Endpoints Used

1. **Create Ticket**
   - `POST /create-ticket`
   - Body: `{ user_id, subject, message }`

2. **List Tickets**
   - `GET /tickets?user_id={user_id}`

3. **Get Ticket Details**
   - `GET /ticket/{id}`
   - Returns ticket with replies

4. **Reply to Ticket**
   - `POST /ticket/{id}/reply`
   - Body: `{ user_id, message }`

## Component States

### Views
- `list` - Default view showing all tickets
- `create` - Form to create a new ticket
- `detail` - Single ticket view with replies

### Loading States
- `loading` - For data fetching operations
- `submitting` - For form submissions
- `error` - Error message display
- `success` - Success message display

## Styling

### Theme Colors
- Primary: `#00aa63` (Embolo green)
- Hover: `#009955`
- Background: `gray-50`
- Borders: `gray-200`

### Status Colors
- Open/Active: Green (`bg-green-500`)
- Pending: Yellow (`bg-yellow-500`)
- Closed: Gray (`bg-gray-500`)

### Responsive Design
- Mobile-first approach
- Full-width on mobile
- Proper spacing and padding
- Touch-friendly buttons

## Usage

```tsx
import RaiseTicket from '@/components/RaiseTicket';

// In your page component
<RaiseTicket />
```

## Dependencies

- React hooks: `useState`, `useEffect`
- AuthContext: `useAuth`
- UI Components: Card, Button, Input, Textarea, Badge, Alert
- Icons: Lucide React
- HTTP Client: Axios

## Error Handling

- Network errors are caught and displayed
- API errors show user-friendly messages
- Auto-clear messages after 5 seconds
- Validation for empty fields

## Security

- Requires authentication
- Uses user ID from authenticated session
- All API calls include user context
- No hardcoded credentials

## Future Enhancements

Potential improvements:
- File attachment support
- Ticket priority selection
- Search and filter tickets
- Pagination for large ticket lists
- Real-time notifications
- Ticket categories
- Rich text editor for messages
