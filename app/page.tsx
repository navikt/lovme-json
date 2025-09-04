"use client"

import { useState } from "react"
import JsonViewer from "@/components/json-viewer"
import "./globals.css"

export default function Page() {
  const [jsonInput, setJsonInput] = useState("")
  const [parsedJson, setParsedJson] = useState<unknown | null>(null)
  const [error, setError] = useState("")

  const extractAvklaringsliste = (data: unknown): string[] => {
    const regelIds: string[] = []

    const searchForAvklaringsliste = (obj: unknown): void => {
      if (obj === null || obj === undefined) return

      if (Array.isArray(obj)) {
        obj.forEach((item) => searchForAvklaringsliste(item))
      } else if (typeof obj === "object") {
        const record = obj as Record<string, unknown>

        // Check if this object has avklaringsListe or avklaringsliste
        for (const [key, value] of Object.entries(record)) {
          if (key.toLowerCase() === "avklaringsliste" && Array.isArray(value)) {
            value.forEach((item) => {
              if (typeof item === "object" && item !== null) {
                const avklaringItem = item as Record<string, unknown>
                if (avklaringItem.regel_id && typeof avklaringItem.regel_id === "string") {
                  regelIds.push(avklaringItem.regel_id)
                }
              }
            })
          } else {
            searchForAvklaringsliste(value)
          }
        }
      }
    }

    searchForAvklaringsliste(data)
    return regelIds
  }

  const anonymizeData = (data: unknown): unknown => {
    if (data === null || data === undefined) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => anonymizeData(item))
    }

    if (typeof data === "object") {
      const obj = data as Record<string, unknown>
      const anonymized: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(obj)) {
        if (key === "fnr") {
          anonymized[key] = "12345678910"
        } else if (key === "fornavn") {
          anonymized[key] = "Navn"
        } else if (key === "etternavn") {
          anonymized[key] = "Navnesen"
        } else if (key === "navn") {
          anonymized[key] = "Anonymisert Navn"
        } else if (key === "bedriftsnavn" || key === "firmanavn" || key === "selskap") {
          anonymized[key] = "Anonymisert Bedrift AS"
        } else if (key === "organisasjonsnummer") {
          anonymized[key] = "123456789"
        } else if (key === "ident") {
          anonymized[key] = "123"
        } else if (key === "relatertVedSivilstand") {
          anonymized[key] = "123"
        } else if (typeof value === "string") {
          if (/^\d{9}$/.test(value)) {
            anonymized[key] = "123456789"
          }
          else if (/^\d{11}$/.test(value)) {
            anonymized[key] = "12345678910"
          }
          else if (/\b(AS|ASA|BA|SA|ANS|DA|ENK|NUF|KF|AL|FKF|IKS|SF|SL|BL)\b/i.test(value)) {
            anonymized[key] = "Anonymisert Bedrift AS"
          } else {
            anonymized[key] = anonymizeData(value)
          }
        } else {
          anonymized[key] = anonymizeData(value)
        }
      }

      return anonymized
    }

    return data
  }

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

  const copyAnonymizedJson = async () => {
    if (parsedJson) {
      const anonymizedData = anonymizeData(parsedJson)
      const jsonString = JSON.stringify(anonymizedData, null, 2)

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonString)
        } else {
          const textArea = document.createElement("textarea")
          textArea.value = jsonString
          textArea.style.position = "fixed"
          textArea.style.left = "-999999px"
          textArea.style.top = "-999999px"
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()

          const successful = document.execCommand("copy")
          document.body.removeChild(textArea)

          if (!successful) {
            throw new Error("execCommand failed")
          }
        }
      } catch (err) {
        console.error("Kunne ikke kopiere til utklippstavle:", err)
        prompt("Kunne ikke kopiere automatisk. Kopier denne teksten manuelt:", jsonString)
      }
    }
  }

  return (
      <div className="app">
        <header className="app-header">
          <h1>JSON Parser</h1>
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
            <>
              {(() => {
                const avklaringsRegler = extractAvklaringsliste(parsedJson)
                return avklaringsRegler.length > 0 ? (
                    <div className="avklaringsliste-section">
                      <h2>Avklaringsliste:</h2>
                      <ul className="avklaringsliste">
                        {avklaringsRegler.map((regelId, index) => (
                            <li key={index}>{regelId}</li>
                        ))}
                      </ul>
                    </div>
                ) : null
              })()}

              <div className="viewer-section">
                <h2>Navigerbar JSON</h2>
                <JsonViewer data={parsedJson} />
              </div>

              <div className="anonymized-section">
                <div className="section-header">
                  <h2>Anonymisert JSON (rå format)</h2>
                  <button onClick={copyAnonymizedJson} className="copy-button">
                    Kopier til utklippstavle
                  </button>
                </div>
                <textarea
                    value={JSON.stringify(anonymizeData(parsedJson), null, 2)}
                    readOnly
                    className="anonymized-output"
                />
              </div>
            </>
        )}
      </div>
  )
}
