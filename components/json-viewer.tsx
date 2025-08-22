"use client"

import { JSX, useState } from "react"
import "./json-viewer.css"

interface JsonViewerProps {
  data: any
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

  const renderValue = (value: any, key: string, currentLevel: number): JSX.Element => {
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
      return <span className="json-string">"{value}"</span>
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

    if (typeof value === "object") {
      const isExpanded = expandedKeys.has(uniqueKey)
      const keys = Object.keys(value)

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
                  {renderValue(value[objKey], `${key}-${objKey}`, currentLevel + 1)}
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
    const keys = Object.keys(data)
    return (
      <div className="json-viewer">
        {keys.map((key) => (
          <div key={key} className="json-item">
            <span className="json-key">{key}:</span>
            {renderValue(data[key], key, level)}
          </div>
        ))}
      </div>
    )
  }

  return <div className="json-viewer">{renderValue(data, "root", level)}</div>
}
