import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import {
  campusNodes,
  categoryById,
  type CampusNode,
} from '../data/campusGraph'
import { CategoryIcon, CampusLocationIcon } from './CampusIcon'

interface LocationSelectProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  marker?: 'start' | 'end'
}

export function LocationSelect({
  id,
  label,
  value,
  onChange,
  placeholder = 'Search a location…',
  helper,
  marker,
}: LocationSelectProps) {
  const autoId = useId()
  const inputId = id ?? `location-select-${autoId}`
  const listboxId = `${inputId}-listbox`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = useMemo(
    () => campusNodes.find((node) => node.id === value) ?? null,
    [value],
  )

  useEffect(() => {
    if (!open) {
      setQuery(selected?.name ?? '')
    }
  }, [open, selected])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return campusNodes
    return campusNodes.filter((node) => {
      const category = categoryById.get(node.category)?.label ?? ''
      return (
        node.name.toLowerCase().includes(term) ||
        node.shortName.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        node.description.toLowerCase().includes(term)
      )
    })
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return

    const handleOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    const option = document.getElementById(`${listboxId}-option-${activeIndex}`)
    option?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, listboxId, open])

  const choose = (node: CampusNode) => {
    onChange(node.id)
    setQuery(node.name)
    setOpen(false)
  }

  const close = () => {
    setOpen(false)
    setQuery(selected?.name ?? '')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setQuery('')
        return
      }
      setActiveIndex((index) =>
        filtered.length ? (index + 1) % filtered.length : 0,
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setQuery('')
        return
      }
      setActiveIndex((index) =>
        filtered.length ? (index - 1 + filtered.length) % filtered.length : 0,
      )
    } else if (event.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        event.preventDefault()
        choose(filtered[activeIndex])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(Math.max(0, filtered.length - 1))
    }
  }

  const activeOptionId =
    open && filtered[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined

  return (
    <div className="field-group" ref={wrapperRef}>
      <div className="field-label-row">
        <label htmlFor={inputId} className="field-label">
          {marker && (
            <span className={`field-marker field-marker-${marker}`} aria-hidden="true" />
          )}
          {label}
        </label>
        {selected && (
          <span className="field-selected-category">
            {categoryById.get(selected.category)?.shortLabel}
          </span>
        )}
      </div>
      <div className={`location-select${open ? ' is-open' : ''}`}>
        <span className="location-select-search" aria-hidden="true">
          <Search size={17} />
        </span>
        <input
          id={inputId}
          className="location-select-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-describedby={helper ? `${inputId}-helper` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {selected && (
          <button
            type="button"
            className="location-select-clear"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onChange('')
              setQuery('')
              setOpen(true)
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="location-select-chevron"
          aria-label={open ? 'Close location list' : 'Open location list'}
          tabIndex={-1}
          onClick={() => {
            if (open) close()
            else {
              setOpen(true)
              setQuery('')
            }
          }}
        >
          <ChevronDown size={17} aria-hidden="true" />
        </button>

        {open && (
          <div className="location-options" id={listboxId} role="listbox" aria-label={label}>
            <div className="location-options-head">
              <span>{query ? `Matching locations` : 'All campus locations'}</span>
              <span>{filtered.length}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="location-empty">
                <Search size={18} aria-hidden="true" />
                <p>No locations match “{query}”.</p>
                <span>Try a building name, lab, or category.</span>
              </div>
            ) : (
              filtered.map((node, index) => {
                const category = categoryById.get(node.category)
                const isSelected = node.id === value
                return (
                  <button
                    key={node.id}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`location-option${
                      index === activeIndex ? ' is-active' : ''
                    }${isSelected ? ' is-selected' : ''}`}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      choose(node)
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span
                      className="location-option-icon"
                      style={{
                        color: category?.color,
                        backgroundColor: category?.tint,
                      }}
                    >
                      <CampusLocationIcon icon={node.icon} size={16} />
                    </span>
                    <span className="location-option-copy">
                      <span className="location-option-name">
                        {node.name}
                        <span className="location-option-number">
                          {String(node.number).padStart(2, '0')}
                        </span>
                      </span>
                      <span className="location-option-meta">
                        <CategoryIcon category={node.category} size={11} />
                        {category?.shortLabel}
                      </span>
                    </span>
                    {isSelected && (
                      <Check className="location-option-check" size={16} aria-hidden="true" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
      {helper && (
        <p className="field-helper" id={`${inputId}-helper`}>
          {helper}
        </p>
      )}
    </div>
  )
}
