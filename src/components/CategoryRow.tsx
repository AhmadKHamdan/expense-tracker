import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Pencil, Trash2, X } from 'lucide-react'
import type { Category } from '../types'
import { CategoryIcon } from './CategoryIcon'

interface Props {
  category: Category
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function CategoryRow({ category: c, onRename, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(c.name)

  const style = { transform: CSS.Transform.toString(transform), transition }

  function save() {
    const n = name.trim()
    if (n) onRename(c.id, n)
    setEditing(false)
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-lg px-1 py-1.5 ${
        isDragging ? 'z-10 bg-slate-800 shadow-lg' : 'hover:bg-slate-800/50'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none rounded p-1 text-slate-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${c.color}22` }}
      >
        <CategoryIcon name={c.icon} size={16} color={c.color} />
      </span>
      {editing ? (
        <>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
          />
          <button onClick={save} className="rounded-lg p-1.5 text-emerald-400 hover:bg-slate-800" aria-label="Save name">
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setName(c.name)
              setEditing(false)
            }}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{c.name}</span>
          <button
            onClick={() => {
              setName(c.name)
              setEditing(true)
            }}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-sky-400"
            aria-label={`Rename ${c.name}`}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(c.id)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-rose-400"
            aria-label={`Delete ${c.name}`}
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
    </li>
  )
}
