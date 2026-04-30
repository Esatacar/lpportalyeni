import React from 'react';
import { Link2, ExternalLink, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  order_index: number;
}

interface UsefulLinksProps {
  links: UsefulLink[];
  isAdmin?: boolean;
  onAdd?: () => void;
  onEdit?: (link: UsefulLink) => void;
  onDelete?: (id: string) => void;
  onReorder?: (links: UsefulLink[]) => void;
}

function SortableLink({
  link,
  isAdmin,
  onEdit,
  onDelete
}: {
  link: UsefulLink;
  isAdmin: boolean;
  onEdit?: (link: UsefulLink) => void;
  onDelete?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-[#0a2547]/30 hover:bg-[#0a1628]/[0.02] transition-all ${isDragging ? 'shadow-lg' : ''}`}
    >
      {isAdmin && (
        <button
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm font-medium text-[#0a2547] hover:text-[#6dd8b0] transition-colors truncate"
        title={link.description || link.title}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="truncate">{link.title}</span>
      </a>
      {isAdmin && (
        <div className="hidden group-hover:flex items-center gap-1 ml-auto shrink-0">
          <button
            onClick={() => onEdit?.(link)}
            className="text-xs text-gray-400 hover:text-blue-600 px-1"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete?.(link.id)}
            className="text-xs text-gray-400 hover:text-red-600 px-1"
          >
            Del
          </button>
        </div>
      )}
    </div>
  );
}

export default function UsefulLinks({ 
  links, 
  isAdmin = false,
  onAdd,
  onEdit,
  onDelete,
  onReorder
}: UsefulLinksProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);
      
      const newLinks = [...links];
      const [movedItem] = newLinks.splice(oldIndex, 1);
      newLinks.splice(newIndex, 0, movedItem);
      
      // Update order_index for all items
      const reorderedLinks = newLinks.map((link, index) => ({
        ...link,
        order_index: index
      }));
      
      onReorder?.(reorderedLinks);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 bg-[#0a1628] rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link2 className="h-6 w-6 text-[#6dd8b0]" />
            <h3 className="ml-2 text-lg font-semibold text-white">Useful Links</h3>
          </div>
          {isAdmin && onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-[#6dd8b0] text-[#0a1628] rounded-lg font-medium hover:bg-[#5cc9a0] transition-colors"
            >
              Add Link
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        {links.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-2">No links available</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={links.map(link => link.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <SortableLink
                    key={link.id}
                    link={link}
                    isAdmin={isAdmin}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}