"use client"

import { type JSX, useState } from "react"
import "./json-viewer.css"

interface JsonViewerProps {
  data: unknown
  level?: number
}

export default function JsonViewer({ data, level = 0 }: JsonViewerProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedKeys(newExpanded)
  }

  const renderValue = (value: unknown, key: string, currentLevel: number): JSX.Element => {
    const uniqueKey = `${currentLevel}-${key}`

    if (value === null) {
      return <span className="json-null">null</span>
    }

    if (typeof value === "boolean") {
      return <span className="json-boolean">{value.toString()}</span>
    }

    if (typeof value === "number") {
      return <span className="json-number">{value}</span>
    }

    if (typeof value === "string") {
      return <span className="json-string">&quot;{value}&quot;</span>
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(uniqueKey)
      return (
          <div className="json-array">
          <span className="json-toggle" onClick={() => toggleExpanded(uniqueKey)}>
            {isExpanded ? "▼" : "▶"} Array ({value.length} elementer)
          </span>
            {isExpanded && (
                <div className="json-content">
                  {value.map((item, index) => (
                      <div key={index} className="json-item">
                        <span className="json-key">[{index}]:</span>
                        {renderValue(item, `${key}-${index}`, currentLevel + 1)}
                      </div>
                  ))}
                </div>
            )}
          </div>
      )
    }

    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>
      const isExpanded = expandedKeys.has(uniqueKey)
      const keys = Object.keys(obj)

      return (
          <div className="json-object">
          <span className="json-toggle" onClick={() => toggleExpanded(uniqueKey)}>
            {isExpanded ? "▼" : "▶"} Object ({keys.length} nøkler)
          </span>
            {isExpanded && (
                <div className="json-content">
                  {keys.map((objKey) => (
                      <div key={objKey} className="json-item">
                        <span className="json-key">{objKey}:</span>
                        {renderValue(obj[objKey], `${key}-${objKey}`, currentLevel + 1)}
                      </div>
                  ))}
                </div>
            )}
          </div>
      )
    }

    return <span>{String(value)}</span>
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>
    const keys = Object.keys(obj)
    return (
        <div className="json-viewer">
          {keys.map((key) => (
              <div key={key} className="json-item">
                <span className="json-key">{key}:</span>
                {renderValue(obj[key], key, level)}
              </div>
          ))}
        </div>
    )
  }

  return <div className="json-viewer">{renderValue(data, "root", level)}</div>
}
