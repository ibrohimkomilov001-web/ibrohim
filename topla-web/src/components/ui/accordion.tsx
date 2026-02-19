"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface AccordionContextValue {
  openItems: string[]
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

interface AccordionProps {
  type?: 'single' | 'multiple'
  collapsible?: boolean
  className?: string
  children: React.ReactNode
}

const Accordion = ({ type = 'single', collapsible = false, className, children }: AccordionProps) => {
  const [openItems, setOpenItems] = React.useState<string[]>([])

  const toggleItem = (value: string) => {
    if (type === 'single') {
      if (openItems.includes(value) && collapsible) {
        setOpenItems([])
      } else {
        setOpenItems([value])
      }
    } else {
      if (openItems.includes(value)) {
        setOpenItems(openItems.filter(item => item !== value))
      } else {
        setOpenItems([...openItems, value])
      }
    }
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

const AccordionItem = ({ value, className, children }: AccordionItemProps) => {
  return (
    <div className={`border-b ${className || ''}`} data-value={value}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ itemValue?: string }>, { itemValue: value })
        }
        return child
      })}
    </div>
  )
}

interface AccordionTriggerProps {
  className?: string
  children: React.ReactNode
  itemValue?: string
}

const AccordionTrigger = ({ className, children, itemValue }: AccordionTriggerProps) => {
  const context = React.useContext(AccordionContext)
  if (!context) return null

  const isOpen = itemValue ? context.openItems.includes(itemValue) : false

  return (
    <button
      type="button"
      className={`flex flex-1 w-full items-center justify-between py-4 font-medium transition-all hover:underline ${className || ''}`}
      onClick={() => itemValue && context.toggleItem(itemValue)}
    >
      {children}
      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
}

interface AccordionContentProps {
  className?: string
  children: React.ReactNode
  itemValue?: string
}

const AccordionContent = ({ className, children, itemValue }: AccordionContentProps) => {
  const context = React.useContext(AccordionContext)
  if (!context) return null

  const isOpen = itemValue ? context.openItems.includes(itemValue) : false

  if (!isOpen) return null

  return (
    <div className="overflow-hidden text-sm">
      <div className={`pb-4 pt-0 ${className || ''}`}>{children}</div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
