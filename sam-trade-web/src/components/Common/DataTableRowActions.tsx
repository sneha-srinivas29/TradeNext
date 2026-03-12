import { MoreHorizontal, Eye, Pencil, Copy, Trash, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableRowActionsProps {
    onView?: () => void;
    onItemFulfillment?: () => void;
    onEdit?: () => void;
    onCopy?: () => void;
    onDelete?: () => void;
}

export function DataTableRowActions({
    onView,
    onItemFulfillment,
    onEdit,
    onCopy,
    onDelete,
}: DataTableRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="
                flex h-8 w-8 p-0
               hover:bg-gray-200
               data-[state=open]:bg-gray-200
                "
                >

                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] bg-popover shadow-lg border-border/60">
                {onView && (
                    <DropdownMenuItem onClick={onView} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                        View Details
                    </DropdownMenuItem>
                )}
                {onItemFulfillment && (
                    <DropdownMenuItem
                        onClick={onView}
                        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >

                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        Item Fulfillment
                    </DropdownMenuItem>
                )}
                {onEdit && (
                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                        Edit
                    </DropdownMenuItem>
                )}
                {onCopy && (
                    <DropdownMenuItem onClick={onCopy} className="cursor-pointer">
                        <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                        Copy ID
                    </DropdownMenuItem>
                )}
                {(onView || onItemFulfillment || onEdit || onCopy) && onDelete && <DropdownMenuSeparator />}
                {/* {onDelete && (
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive cursor-pointer"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                )} */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
