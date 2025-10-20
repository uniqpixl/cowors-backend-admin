"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...inputProps }, ref) => {
    const [checked, setChecked] = React.useState(inputProps.checked || false)
    
    const handleChange = (newChecked: boolean) => {
      setChecked(newChecked)
      onCheckedChange?.(newChecked)
      
      // Also trigger onChange for compatibility
      if (onChange) {
        const event = new Event('change', { bubbles: true })
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { checked: newChecked }
        })
        onChange(event as React.ChangeEvent<HTMLInputElement>)
      }
    }
    
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={(e) => handleChange(e.target.checked)}
          {...inputProps}
        />
        <div
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            checked ? "bg-primary text-primary-foreground" : "bg-background",
            className
          )}
          onClick={() => handleChange(!checked)}
        >
          {checked && (
            <div className="flex items-center justify-center text-current">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }