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
      className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start">
        {isAdmin && (
          <button
            className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-blue-600 hover:text-blue-800 flex items-center"
              >
                {link.title}
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
              {link.description && (
                <p className="mt-1 text-gray-600">{link.description}</p>
              )}
            </div>
            {isAdmin && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEdit?.(link)}
                  className="text-gray-600 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(link.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link2 className="h-6 w-6 text-blue-600" />
            <h3 className="ml-2 text-lg font-semibold text-blue-900">Useful Links</h3>
          </div>
          {isAdmin && onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Link
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {links.length === 0 ? (
          <p className="text-center text-gray-500">No links available</p>
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
              <div className="space-y-4">
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