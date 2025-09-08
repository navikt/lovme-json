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

  const extractOppholdstillatelse = (data: unknown): { fom: string; tom: string } | null => {
    console.log("[v0] Searching for oppholdstillatelse in data:", data)

    const searchForOppholdstillatelse = (obj: unknown, path = ""): { fom: string; tom: string } | null => {
      if (obj === null || obj === undefined) return null

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          console.log(`[v0] Searching array element ${i} at path ${path}[${i}]`)
          const result = searchForOppholdstillatelse(obj[i], `${path}[${i}]`)
          if (result) return result
        }
      } else if (typeof obj === "object") {
        const record = obj as Record<string, unknown>

        if (record.datagrunnlag && typeof record.datagrunnlag === "object") {
          console.log("[v0] Found datagrunnlag, searching inside it")
          const datagrunnlag = record.datagrunnlag as Record<string, unknown>
          if (datagrunnlag.oppholdstillatelse && typeof datagrunnlag.oppholdstillatelse === "object") {
            console.log("[v0] Found oppholdstillatelse in datagrunnlag")
            const result = searchForOppholdstillatelse(
                datagrunnlag.oppholdstillatelse,
                "datagrunnlag.oppholdstillatelse",
            )
            if (result) return result
          }
        }

        // Check every key in the object
        for (const [key, value] of Object.entries(record)) {
          const currentPath = path ? `${path}.${key}` : key

          if (key.toLowerCase().includes("oppholdstillatelse") && typeof value === "object" && value !== null) {
            console.log("[v0] Found oppholdstillatelse-related object at path:", currentPath, value)

            const nestedResult = searchForOppholdstillatelse(value, currentPath)
            if (nestedResult) return nestedResult
          }

          if (key.toLowerCase() === "periode" && typeof value === "object" && value !== null) {
            console.log("[v0] Found periode object at path:", currentPath, value)
            const periode = value as Record<string, unknown>
            if (typeof periode.fom === "string" && typeof periode.tom === "string") {
              console.log("[v0] Found valid periode with fom/tom:", periode.fom, periode.tom)
              return { fom: periode.fom, tom: periode.tom }
            }
          }

          if (key.toLowerCase().includes("eosellerefta") && typeof value === "object" && value !== null) {
            console.log("[v0] Found eosellerEFTA object at path:", currentPath, value)
            const nestedResult = searchForOppholdstillatelse(value, currentPath)
            if (nestedResult) return nestedResult
          }

          if (key.toLowerCase() === "gjeldendeopholdsstatus" && typeof value === "object" && value !== null) {
            console.log("[v0] Found gjeldendeOppholdsstatus object at path:", currentPath, value)
            const nestedResult = searchForOppholdstillatelse(value, currentPath)
            if (nestedResult) return nestedResult
          }

          // Continue searching recursively in all values
          const result = searchForOppholdstillatelse(value, currentPath)
          if (result) return result
        }
      }

      return null
    }

    const result = searchForOppholdstillatelse(data)
    console.log("[v0] Final oppholdstillatelse result:", result)
    return result
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
          // Generic name field - could be person or company name
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
          // Check if string looks like a Norwegian org number (9 digits)
          if (/^\d{9}$/.test(value)) {
            anonymized[key] = "123456789"
          }
          // Check if string looks like a Norwegian personal number (11 digits)
          else if (/^\d{11}$/.test(value)) {
            anonymized[key] = "12345678910"
          }
          // Check if string contains "AS", "ASA", "BA" etc (company suffixes)
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
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonString)
        } else {
          // Fallback for older browsers or non-HTTPS
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
        // Final fallback - show the text in a prompt for manual copying
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

              {(() => {
                const oppholdstillatelse = extractOppholdstillatelse(parsedJson)
                console.log("[v0] Oppholdstillatelse in render:", oppholdstillatelse)
                return oppholdstillatelse ? (
                    <div className="oppholdstillatelse-section">
                      <h2>Oppholdstillatelse:</h2>
                      <div style={{ padding: "10px", border: "1px solid #ccc", margin: "10px 0" }}>
                        <p>
                          <strong>Fra:</strong> {oppholdstillatelse.fom}
                        </p>
                        <p>
                          <strong>Til:</strong> {oppholdstillatelse.tom}
                        </p>
                        <p>
                          <strong>Type:</strong> EØS/EFTA Opphold
                        </p>
                      </div>
                    </div>
                ) : (
                    <div className="oppholdstillatelse-section">
                      <h2>Oppholdstillatelse:</h2>
                      <p>Ingen oppholdstillatelse-data funnet</p>
                    </div>
                )
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
