---
name: Topic Management and User Admin Features
overview: Add topic management admin page, modify content manager to link existing topics instead of creating new ones, change topic deletion behavior to only remove mappings, and add user management page with stats.
todos: []
---

# Topic Management and User Admin Features

## Overview
Refactor topic management to support the many-to-many relationship properly: separate topic creation from category linking, add topic management page, modify content manager behavior, and add user management.

## 1. Create New Admin Topics Page

**File**: `src/pages/AdminTopics.tsx` (new file)

- Similar structure to `AdminCategories.tsx`
- List all topics with search functionality
- Create new topics (name, description only - no category selection)
- Edit existing topics (name, description only)
- Delete topics (with confirmation dialog, warns if topic has questions)
- Display question count for each topic
- Link to admin dashboard

**Service Functions Needed**:
- Use existing `getTopics()` without categoryId parameter (returns all topics)
- Use existing `getAllTopicsWithCounts()` for listing with question counts
- Update `createTopic()` to allow empty categoryIds array
- Use existing `updateTopic()` and `deleteTopic()`

## 2. Update Topic Service Functions

**File**: `src/services/categoryService.ts`

**Changes**:
- Update `createTopic()`: Make `categoryIds` optional (allow empty array). Since `category_id` column is NOT NULL, we need to handle this:
  - Option A: Use first category from database as default (if no categoryIds provided)
  - Option B: Make category_id nullable in schema (requires migration)
  - Recommended: Option A - get first category and use as default category_id, but don't create junction table entries if categoryIds is empty
- Add `removeTopicFromCategory(topicId: string, categoryId: string)` function:
  - Delete entry from `topic_categories` junction table
  - Return success/error
- Add `linkTopicsToCategory(categoryId: string, topicIds: string[])` function:
  - Remove all existing mappings for the category
  - Insert new mappings for provided topicIds
  - Use transaction-like behavior (delete all, then insert all)
- Add `getAllTopics()` function that calls `getTopics()` without categoryId (or just use getTopics() directly)

## 3. Modify AdminContentManager

**File**: `src/pages/AdminContentManager.tsx`

**Changes**:
- Remove topic creation dialog (`isTopicDialogOpen`, topic form state)
- Remove `handleAddTopic` function
- Remove topic creation mutation and form handling
- Add "Link Topics" context menu item/button for categories (instead of "Add Topic")
- Create new dialog `isLinkTopicsDialogOpen` for linking topics to category
- In link dialog:
  - Fetch all topics using `getAllTopicsWithCounts()`
  - Fetch currently linked topics using junction table query
  - Display topics with checkboxes (multi-select)
  - Pre-check topics that are already linked to the category
  - Save button calls `linkTopicsToCategory()` with selected topic IDs
- Modify topic deletion in `confirmDelete()`:
  - For topics: Instead of calling `deleteTopicMutation`, call new `removeTopicFromCategoryMutation`
  - Update confirmation dialog message: "Remove topic from this category?" instead of "Delete topic?"
  - Only remove the mapping, not the topic itself
- Remove topic edit functionality (editing happens in AdminTopics page)
- Update ContentTreeNode to show "Link Topics" instead of "Add Topic" for categories

## 4. Add User Management Page

**File**: `src/pages/AdminUsers.tsx` (new file)

- Display all users in a table format
- Columns: Name, Email, Phone Number, Registration Date, Tests Taken, Questions Attempted
- Add search functionality (by name, email, phone)
- Use Table component from UI library
- Fetch users from `profiles` table
- Get email from `auth.users` (may require database function/view or store email in profiles)
- Calculate stats:
  - Tests Taken: Count from `test_results` table
  - Questions Attempted: Count from user progress or test results

**Service Functions**:
- Create `src/services/userService.ts` (new file):
  - `getAllUsersWithStats()`: Fetch profiles with aggregated stats
  - Query profiles, join with test_results for counts
  - For email: May need database function or RPC to access auth.users, or store email in profiles

**Note on Email**: Supabase client can't directly query `auth.users`. Options:
1. Create a database view that joins profiles with auth.users (requires database migration)
2. Use Supabase Admin API (requires server-side)
3. Store email in profiles table on signup (requires schema change)
4. Use RPC function to get emails (requires database function)

For now, implement with email field that can be populated via one of these methods.

## 5. Update Admin Dashboard

**File**: `src/pages/AdminDashboard.tsx`

- Add "Manage Topics" button/link in Quick Actions section
- Add "User Management" button/link in Quick Actions section
- Links should navigate to `/admin/topics` and `/admin/users` respectively

## 6. Update App Routes

**File**: `src/App.tsx`

- Add route: `<Route path="/admin/topics" element={<AdminTopics />} />`
- Add route: `<Route path="/admin/users" element={<AdminUsers />} />`
- Import the new components

## Implementation Details

### Topic Creation Flow
1. Admin navigates to `/admin/topics`
2. Clicks "Add Topic" button
3. Fills in name and description (no category selection)
4. Topic is created without any category mappings (categoryIds: [])
5. Topic appears in the list

### Topic Linking Flow (Content Manager)
1. Admin navigates to Content Manager
2. Right-clicks or uses context menu on a category
3. Selects "Link Topics" option
4. Dialog opens showing all existing topics with checkboxes
5. Topics already linked to this category are pre-checked
6. Admin selects/deselects topics
7. Clicks "Save" or "Link Topics"
8. Junction table is updated (old mappings removed, new ones added)

### Topic Removal Flow (Content Manager)
1. In Content Manager, admin clicks delete on a topic under a category
2. Confirmation dialog: "Remove topic from this category? The topic will remain in the database but won't be linked to this category anymore."
3. Only the mapping in `topic_categories` is removed
4. Topic remains in database and can be linked to other categories

### Topic Deletion Flow (Admin Topics Page)
1. Admin navigates to `/admin/topics`
2. Clicks delete on a topic
3. Confirmation dialog: "Delete topic? This will permanently remove the topic and all its questions. This action cannot be undone."
4. Topic and all junction table entries are deleted (cascade delete)

### User Management
- Query profiles table
- For each user, aggregate:
  - Tests taken: COUNT from test_results WHERE user_id = user.id
  - Questions attempted: Count from test_results (sum of total questions in each test)
- Display in table with sorting and search

## Database Considerations

- Topics table still requires `category_id` (for backward compatibility), but topics can exist without valid mappings in junction table
- When creating topic without categories, use first available category or a default category_id (may need to handle this in createTopic function)
- Junction table `topic_categories` handles the many-to-many relationship
- User email access may require database view or RPC function if not stored in profiles
