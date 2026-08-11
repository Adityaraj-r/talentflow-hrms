import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

import React from "react"

export function formatDisplayText(text) {
  if (typeof text !== 'string' || !text) return text;
  
  // Ignore emails
  if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(text)) return text;
  // Ignore URLs
  if (/^(http|https):\/\/[^ "]+$/.test(text)) return text;
  // Ignore UUIDs
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) return text;
  // Ignore pure technical IDs that have numbers (like EMP-123 or ABC_456 without spaces)
  if (/^[\w-]+$/.test(text) && /\d/.test(text)) return text;
  
  // Convert snake_case and kebab-case to spaces
  let formatted = text.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  formatted = formatted.split(/([\s-])/).map(word => {
    if (word === ' ' || word === '-') return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
  
  return formatted;
}

// Helper to deeply apply text formatting to all string children
export function formatChildren(children) {
  if (typeof children === 'string') {
    return formatDisplayText(children);
  }
  
  if (Array.isArray(children)) {
    return React.Children.map(children, child => formatChildren(child));
  }
  
  if (React.isValidElement(children)) {
    if (children.props && children.props.children && !children.props.disableFormatting) {
      return React.cloneElement(children, {
        ...children.props,
        children: formatChildren(children.props.children)
      });
    }
  }
  
  return children;
}