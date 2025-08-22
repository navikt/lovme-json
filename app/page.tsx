"use client"

import { useState } from "react"
import JsonViewer from "@/components/json-viewer"
import "./globals.css"

export default function Page() {
  const [jsonInput, setJsonInput] = useState("")
  const [parsedJson, setParsedJson] = useState<unknown | null>(null)
  const [error, setError] = useState("")

  const handleJsonSubmit = () => {
    try {
      const parsed: unknown = JSON.parse(jsonInput)
      setParsedJson(parsed)
      setError("")
    } catch (err) {
      if (err instanceof Error) {
        setError("Ugyldig JSON format: " + err.message)
      } else {
        setError("Ugyldig JSON format")
      }
      setParsedJson(null)
    }
  }

  const handleClear = () => {
    setJsonInput("")
    setParsedJson(null)
    setError("")
  }

  return (
      <div className="app">
        <header className="app-header">
          <h1>JSON</h1>
        </header>

        <div className="input-section">
        <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Lim inn JSON-data her..."
            className="json-input"
        />
          <div className="button-group">
            <button onClick={handleJsonSubmit} className="parse-button">
              Parse JSON
            </button>
            <button onClick={handleClear} className="clear-button">
              Tøm
            </button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>

        {parsedJson !== null && (
            <div className="viewer-section">
              <h2>Navigerbar JSON</h2>
              <JsonViewer data={parsedJson} />
            </div>
        )}
      </div>
  )
}
