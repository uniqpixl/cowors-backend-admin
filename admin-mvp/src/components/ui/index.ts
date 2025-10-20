// Reusable UI Components - Phase 1 Refactoring
export { default as SearchInput } from './search/SearchInput';
export { default as FilterDropdown } from './filter/FilterDropdown';
export { default as SmartPagination } from './pagination/SmartPagination';
export { default as StatusBadge, STATUS_CONFIGS, getStatusColor, getStatusLabel } from './status/StatusBadge';
export { default as LoadingState } from './loading/LoadingState';
export { default as ErrorState } from './error/ErrorState';
export { Skeleton } from './skeleton';

// Admin Components
export { AdminTable } from './table/AdminTable';
export type { AdminTableColumn } from './table/AdminTable';
export { AdminPageLayout } from './layout/AdminPageLayout';

// Re-export existing components for convenience
export { default as Badge } from './badge/Badge';
export { default as Button } from './button/Button';
export { default as Avatar } from './avatar/Avatar';
export { Dropdown } from './dropdown/Dropdown';
export { DropdownItem } from './dropdown/DropdownItem';
export { Table, TableHeader, TableBody, TableRow, TableCell } from './table';
export { Modal } from './modal';
export { Input } from './input';
export { Separator } from './separator';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './select';
export { Label } from './label';
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from './card';
export { Textarea } from './textarea';
export { Switch } from './switch';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';