"use client";

import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react"; // For loading state on delete button

interface DeleteUserConfirmationDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>; // Made async to handle API call status
}

export default function DeleteUserConfirmationDialog({
  user,
  open,
  onOpenChange,
  onConfirmDelete,
}: DeleteUserConfirmationDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirmDelete();
    } catch (error) {
      // Error should be handled by the caller (UserListTable) via toast
      // This dialog just focuses on confirming and triggering the action
      console.error("Deletion failed from dialog perspective:", error);
    } finally {
      setLoading(false);
      // onOpenChange(false); // Caller should manage open state on success/failure
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete user{" "}
            <span className="font-semibold">{user.email}</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
