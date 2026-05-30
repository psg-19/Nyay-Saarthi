"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileEdit, Loader2, Download, Copy, CheckCheck,
  Building2, UserCheck, Handshake, ShieldCheck, Wand2, Plus, Trash2, Printer,
  History, ChevronDown, ChevronUp, FileType, FileText,
} from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

interface HistoryEntry {
  id: string
  type: string
  content: string
  createdAt: string
}

const HISTORY_KEY = "nyay_template_history"

function saveToHistory(type: string, content: string) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const existing: HistoryEntry[] = raw ? JSON.parse(raw) : []
    const entry: HistoryEntry = { id: Date.now().toString(), type, content, createdAt: new Date().toISOString() }
    const updated = [entry, ...existing].slice(0, 20) // keep last 20
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {}
}

type TemplateKey = "rental" | "nda" | "employment" | "partnership" | "custom"

interface Template {
  key: Exclude<TemplateKey, "custom">
  icon: React.ElementType
  color: string
  bg: string
  fields: { key: string; label_hi: string; label_en: string; placeholder_hi: string; placeholder_en: string }[]
}

const TEMPLATES: Template[] = [
  {
    key: "rental",
    icon: Building2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/40",
    fields: [
      { key: "landlord_name", label_hi: "मकान मालिक का नाम", label_en: "Landlord Name", placeholder_hi: "रमेश कुमार", placeholder_en: "Ramesh Kumar" },
      { key: "tenant_name", label_hi: "किरायेदार का नाम", label_en: "Tenant Name", placeholder_hi: "सुरेश शर्मा", placeholder_en: "Suresh Sharma" },
      { key: "property_address", label_hi: "संपत्ति का पता", label_en: "Property Address", placeholder_hi: "123, मेन रोड, दिल्ली", placeholder_en: "123, Main Road, Delhi" },
      { key: "monthly_rent", label_hi: "मासिक किराया (₹)", label_en: "Monthly Rent (₹)", placeholder_hi: "15000", placeholder_en: "15000" },
      { key: "security_deposit", label_hi: "सुरक्षा जमा (₹)", label_en: "Security Deposit (₹)", placeholder_hi: "30000", placeholder_en: "30000" },
      { key: "start_date", label_hi: "शुरुआत तारीख", label_en: "Start Date", placeholder_hi: "01 जून 2025", placeholder_en: "01 June 2025" },
      { key: "duration", label_hi: "अवधि", label_en: "Duration", placeholder_hi: "11 महीने", placeholder_en: "11 months" },
    ],
  },
  {
    key: "nda",
    icon: ShieldCheck,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    fields: [
      { key: "party1_name", label_hi: "पहली पार्टी", label_en: "Party 1 Name", placeholder_hi: "ABC Technologies Pvt Ltd", placeholder_en: "ABC Technologies Pvt Ltd" },
      { key: "party2_name", label_hi: "दूसरी पार्टी", label_en: "Party 2 Name", placeholder_hi: "XYZ Solutions", placeholder_en: "XYZ Solutions" },
      { key: "purpose", label_hi: "उद्देश्य", label_en: "Purpose", placeholder_hi: "व्यापार सहयोग", placeholder_en: "Business collaboration" },
      { key: "duration", label_hi: "अवधि", label_en: "Duration", placeholder_hi: "2 वर्ष", placeholder_en: "2 years" },
      { key: "governing_law", label_hi: "शासी कानून", label_en: "Governing Law", placeholder_hi: "भारतीय कानून", placeholder_en: "Laws of India" },
    ],
  },
  {
    key: "employment",
    icon: UserCheck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    fields: [
      { key: "employer_name", label_hi: "नियोक्ता का नाम", label_en: "Employer Name", placeholder_hi: "ABC Company Pvt Ltd", placeholder_en: "ABC Company Pvt Ltd" },
      { key: "employee_name", label_hi: "कर्मचारी का नाम", label_en: "Employee Name", placeholder_hi: "अंकित वर्मा", placeholder_en: "Ankit Verma" },
      { key: "designation", label_hi: "पद", label_en: "Designation", placeholder_hi: "Software Engineer", placeholder_en: "Software Engineer" },
      { key: "monthly_salary", label_hi: "मासिक वेतन (₹)", label_en: "Monthly Salary (₹)", placeholder_hi: "50000", placeholder_en: "50000" },
      { key: "joining_date", label_hi: "ज्वाइनिंग तारीख", label_en: "Joining Date", placeholder_hi: "01 जुलाई 2025", placeholder_en: "01 July 2025" },
      { key: "probation_period", label_hi: "परिवीक्षा अवधि", label_en: "Probation Period", placeholder_hi: "3 महीने", placeholder_en: "3 months" },
    ],
  },
  {
    key: "partnership",
    icon: Handshake,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    fields: [
      { key: "partner1_name", label_hi: "पहले भागीदार का नाम", label_en: "Partner 1 Name", placeholder_hi: "राजेश गुप्ता", placeholder_en: "Rajesh Gupta" },
      { key: "partner2_name", label_hi: "दूसरे भागीदार का नाम", label_en: "Partner 2 Name", placeholder_hi: "सुनीता पटेल", placeholder_en: "Sunita Patel" },
      { key: "business_name", label_hi: "व्यवसाय का नाम", label_en: "Business Name", placeholder_hi: "गुप्ता एंड पटेल ट्रेडर्स", placeholder_en: "Gupta & Patel Traders" },
      { key: "capital_contribution", label_hi: "पूंजी योगदान", label_en: "Capital Contribution", placeholder_hi: "50-50 (₹2 लाख प्रत्येक)", placeholder_en: "50-50 (₹2 Lakh each)" },
      { key: "profit_sharing", label_hi: "लाभ वितरण", label_en: "Profit Sharing", placeholder_hi: "50% - 50%", placeholder_en: "50% - 50%" },
      { key: "start_date", label_hi: "शुरुआत तारीख", label_en: "Start Date", placeholder_hi: "01 अगस्त 2025", placeholder_en: "01 August 2025" },
    ],
  },
]

const TEMPLATE_LABELS: Record<Exclude<TemplateKey, "custom">, { hi: string; en: string; desc_hi: string; desc_en: string }> = {
  rental: { hi: "किराया अनुबंध", en: "Rental Agreement", desc_hi: "आवासीय/व्यावसायिक संपत्ति", desc_en: "Residential/commercial property" },
  nda: { hi: "गोपनीयता समझौता", en: "NDA", desc_hi: "व्यावसायिक जानकारी की सुरक्षा", desc_en: "Protect confidential info" },
  employment: { hi: "रोजगार अनुबंध", en: "Employment Contract", desc_hi: "कर्मचारी नियुक्ति", desc_en: "For hiring employees" },
  partnership: { hi: "भागीदारी विलेख", en: "Partnership Deed", desc_hi: "साझेदारी व्यवसाय", desc_en: "For business partnerships" },
}

interface CustomField { id: string; label: string; value: string }

function InputField({ field, value, onChange, lang }: {
  field: Template["fields"][number]; value: string; onChange: (v: string) => void; lang: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
        {lang === "hi" ? field.label_hi : field.label_en}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={lang === "hi" ? field.placeholder_hi : field.placeholder_en}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}

function GeneratedOutput({ generated, hi, onCopy, onDownload, onDownloadDocx, onDownloadPdf, copied, onPrint }: {
  generated: string; hi: boolean; onCopy: () => void
  onDownload: () => void; onDownloadDocx: () => void; onDownloadPdf: () => void
  copied: boolean; onPrint: () => void; fileName: string
}) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base text-gray-800 dark:text-white">
            {hi ? "तैयार दस्तावेज़" : "Generated Document"}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={onCopy}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              {copied ? <CheckCheck className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? (hi ? "कॉपी हो गया" : "Copied!") : (hi ? "कॉपी करें" : "Copy")}
            </Button>
            <Button size="sm" variant="outline" onClick={onDownload}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" title="Download as TXT">
              <FileText className="w-3.5 h-3.5 mr-1" />TXT
            </Button>
            <Button size="sm" variant="outline" onClick={onDownloadDocx}
              className="border-blue-400 text-blue-600 dark:border-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Download as Word">
              <FileType className="w-3.5 h-3.5 mr-1" />DOCX
            </Button>
            <Button size="sm" variant="outline" onClick={onDownloadPdf}
              className="border-red-400 text-red-600 dark:border-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Download as PDF">
              <Download className="w-3.5 h-3.5 mr-1" />PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onPrint}
              className="border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              <Printer className="w-3.5 h-3.5 mr-1" />
              {hi ? "प्रिंट" : "Print"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Document paper */}
          <div className="px-8 py-10 max-h-[700px] overflow-y-auto legal-document">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-600 uppercase tracking-wide">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mt-6 mb-2 uppercase tracking-wide">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-4 mb-1.5">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 text-justify">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {children}
                  </ol>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                hr: () => (
                  <hr className="my-6 border-gray-300 dark:border-gray-600" />
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-3">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {generated}
            </ReactMarkdown>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TemplatesPage() {
  const { lang } = useLanguage()
  const hi = lang === "hi"
  const [selected, setSelected] = useState<TemplateKey | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState("")
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  // Custom template state
  const [customDescription, setCustomDescription] = useState("")
  const [customParties, setCustomParties] = useState("")
  const [customKeyTerms, setCustomKeyTerms] = useState("")
  const [customJurisdiction, setCustomJurisdiction] = useState("")
  const [customExtraFields, setCustomExtraFields] = useState<CustomField[]>([])

  const template = selected && selected !== "custom"
    ? TEMPLATES.find((t) => t.key === selected)
    : null

  const setField = (key: string, val: string) => setFields((prev) => ({ ...prev, [key]: val }))

  const addExtraField = () => {
    setCustomExtraFields((prev) => [...prev, { id: Math.random().toString(36).slice(2), label: "", value: "" }])
  }
  const removeExtraField = (id: string) => setCustomExtraFields((prev) => prev.filter((f) => f.id !== id))
  const updateExtraField = (id: string, key: "label" | "value", val: string) => {
    setCustomExtraFields((prev) => prev.map((f) => f.id === id ? { ...f, [key]: val } : f))
  }

  const handleSelect = (key: TemplateKey) => {
    setSelected(key)
    setGenerated("")
    setFields({})
    setCustomDescription("")
    setCustomParties("")
    setCustomKeyTerms("")
    setCustomJurisdiction("")
    setCustomExtraFields([])
  }

  const handleGeneratePreset = async () => {
    if (!template) return
    setLoading(true)
    setGenerated("")
    try {
      const res = await fetch(apiUrl("/generate/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_type: hi ? TEMPLATE_LABELS[template.key].hi : TEMPLATE_LABELS[template.key].en,
          fields,
          language: lang,
        }),
      })
      const data = await res.json()
      const doc = data.document ?? (hi ? "दस्तावेज़ बनाने में त्रुटि हुई।" : "Error generating document.")
      setGenerated(doc)
      if (data.document) {
        saveToHistory(hi ? TEMPLATE_LABELS[template.key].hi : TEMPLATE_LABELS[template.key].en, doc)
        setHistory((prev) => [{ id: Date.now().toString(), type: hi ? TEMPLATE_LABELS[template.key].hi : TEMPLATE_LABELS[template.key].en, content: doc, createdAt: new Date().toISOString() }, ...prev].slice(0, 20))
      }
    } catch {
      setGenerated(hi ? "सर्वर से जुड़ने में त्रुटि हुई।" : "Could not connect to server.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCustom = async () => {
    if (!customDescription.trim()) return
    setLoading(true)
    setGenerated("")
    try {
      // Merge extra fields into key_terms
      const extraText = customExtraFields
        .filter((f) => f.label.trim() && f.value.trim())
        .map((f) => `${f.label}: ${f.value}`)
        .join(", ")
      const combinedKeyTerms = [customKeyTerms, extraText].filter(Boolean).join(". ")

      const res = await fetch(apiUrl("/generate-custom/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: customDescription,
          parties: customParties,
          key_terms: combinedKeyTerms,
          jurisdiction: customJurisdiction || "India",
          language: lang,
        }),
      })
      const data = await res.json()
      const doc = data.document ?? (hi ? "दस्तावेज़ बनाने में त्रुटि हुई।" : "Error generating document.")
      setGenerated(doc)
      if (data.document) {
        const label = hi ? "कस्टम दस्तावेज़" : "Custom Document"
        saveToHistory(label, doc)
        setHistory((prev) => [{ id: Date.now().toString(), type: label, content: doc, createdAt: new Date().toISOString() }, ...prev].slice(0, 20))
      }
    } catch {
      setGenerated(hi ? "सर्वर से जुड़ने में त्रुटि हुई।" : "Could not connect to server.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = selected === "custom" ? "custom_document.txt" : `${selected}_template.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx")
    const lines = generated.split("\n")
    const children = lines.map((line) => {
      if (line.startsWith("# ")) return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 })
      if (line.startsWith("## ")) return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 })
      if (line.startsWith("### ")) return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 })
      if (line.trim() === "") return new Paragraph({ text: "" })
      const cleaned = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
      return new Paragraph({ children: [new TextRun({ text: cleaned })] })
    })
    const doc = new Document({ sections: [{ children }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selected ?? "document"}_template.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = () => {
    handlePrint() // reuses the print window; user can Save as PDF from browser
  }

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Legal Document</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 13pt; color: #000; background: #fff; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.7; }
        h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #000; }
        h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 24px; margin-bottom: 8px; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; }
        p { margin-bottom: 12px; text-align: justify; }
        ol, ul { margin-left: 24px; margin-bottom: 12px; }
        li { margin-bottom: 4px; }
        strong { font-weight: bold; }
        hr { border: none; border-top: 1px solid #000; margin: 24px 0; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hi ? "कानूनी टेम्पलेट जेनरेटर" : "Legal Template Generator"}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hi ? "AI की मदद से पेशेवर कानूनी दस्तावेज़ बनाएं — प्रीसेट या कस्टम" : "Generate professional legal documents with AI — preset or fully custom"}
          </p>
        </div>

        {/* Template selector — 4 presets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {TEMPLATES.map((tmpl) => {
            const label = TEMPLATE_LABELS[tmpl.key]
            const Icon = tmpl.icon
            const isActive = selected === tmpl.key
            return (
              <button
                key={tmpl.key}
                onClick={() => handleSelect(tmpl.key)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 ${tmpl.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${tmpl.color}`} />
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-white leading-tight">
                  {hi ? label.hi : label.en}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {hi ? label.desc_hi : label.desc_en}
                </p>
                {isActive && (
                  <Badge className="mt-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 border text-xs">
                    {hi ? "चुना गया" : "Selected"}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Custom template card — full width */}
        <button
          onClick={() => handleSelect("custom")}
          className={`w-full rounded-xl border p-4 text-left transition-all mb-8 ${
            selected === "custom"
              ? "border-violet-500 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20 shadow-md"
              : "border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                {hi ? "✨ कस्टम दस्तावेज़ बनाएं" : "✨ Create Custom Document"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {hi ? "AI को बताएं आपको किस तरह का दस्तावेज़ चाहिए — कोई भी प्रकार" : "Tell AI what document you need — any type, any requirements"}
              </p>
            </div>
            {selected === "custom" && (
              <Badge className="ml-auto bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-700 border text-xs shrink-0">
                {hi ? "चुना गया" : "Selected"}
              </Badge>
            )}
          </div>
        </button>

        {/* Preset template form */}
        {template && selected !== "custom" && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                <template.icon className={`w-4 h-4 ${template.color}`} />
                {hi ? "विवरण भरें" : "Fill in the Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {template.fields.map((f) => (
                  <InputField
                    key={f.key}
                    field={f}
                    value={fields[f.key] ?? ""}
                    onChange={(v) => setField(f.key, v)}
                    lang={lang}
                  />
                ))}
              </div>
              <Button
                onClick={handleGeneratePreset}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{hi ? "AI दस्तावेज़ बना रहा है..." : "AI is generating..."}</>
                ) : (
                  <><FileEdit className="w-4 h-4 mr-2" />{hi ? "दस्तावेज़ बनाएं" : "Generate Document"}</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Custom template form */}
        {selected === "custom" && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                {hi ? "अपना दस्तावेज़ डिज़ाइन करें" : "Design Your Document"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Description — required */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {hi ? "आपको किस तरह का दस्तावेज़ चाहिए? *" : "What document do you need? *"}
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                  placeholder={hi
                    ? "जैसे: दो दोस्तों के बीच ₹50,000 का व्यक्तिगत ऋण समझौता जिसमें 6 महीने की वापसी अवधि हो..."
                    : "e.g., A personal loan agreement between two friends for ₹50,000 with 6-month repayment, or a freelance web development service contract..."}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Parties */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {hi ? "पक्षकार (वैकल्पिक)" : "Parties involved (optional)"}
                  </label>
                  <input
                    type="text"
                    value={customParties}
                    onChange={(e) => setCustomParties(e.target.value)}
                    placeholder={hi ? "जैसे: अमित शर्मा और रोहन गुप्ता" : "e.g., Amit Sharma and Rohan Gupta"}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Jurisdiction */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {hi ? "न्यायक्षेत्र (वैकल्पिक)" : "Jurisdiction (optional)"}
                  </label>
                  <input
                    type="text"
                    value={customJurisdiction}
                    onChange={(e) => setCustomJurisdiction(e.target.value)}
                    placeholder={hi ? "जैसे: दिल्ली, महाराष्ट्र, भारत" : "e.g., Delhi, Maharashtra, India"}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Key terms */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {hi ? "विशेष शर्तें / आवश्यकताएं (वैकल्पिक)" : "Key terms / special requirements (optional)"}
                </label>
                <textarea
                  value={customKeyTerms}
                  onChange={(e) => setCustomKeyTerms(e.target.value)}
                  rows={2}
                  placeholder={hi
                    ? "जैसे: ब्याज दर 12% प्रति वर्ष, देरी पर जुर्माना, मध्यस्थता द्वारा विवाद निपटान..."
                    : "e.g., 12% interest rate, late payment penalty of ₹500/day, arbitration for disputes..."}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Dynamic extra fields */}
              {customExtraFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {hi ? "अतिरिक्त विवरण" : "Additional details"}
                  </p>
                  {customExtraFields.map((f) => (
                    <div key={f.id} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => updateExtraField(f.id, "label", e.target.value)}
                        placeholder={hi ? "फ़ील्ड का नाम" : "Field name"}
                        className="w-36 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 shrink-0"
                      />
                      <input
                        type="text"
                        value={f.value}
                        onChange={(e) => updateExtraField(f.id, "value", e.target.value)}
                        placeholder={hi ? "मान दर्ज करें" : "Enter value"}
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => removeExtraField(f.id)}
                        className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addExtraField}
                className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {hi ? "अतिरिक्त फ़ील्ड जोड़ें" : "Add extra field"}
              </button>

              <Button
                onClick={handleGenerateCustom}
                disabled={loading || !customDescription.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{hi ? "AI दस्तावेज़ बना रहा है..." : "AI is generating..."}</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" />{hi ? "कस्टम दस्तावेज़ बनाएं" : "Generate Custom Document"}</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated output */}
        {generated && (
          <div ref={printRef}>
            <GeneratedOutput
              generated={generated}
              hi={hi}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onDownloadDocx={handleDownloadDocx}
              onDownloadPdf={handleDownloadPdf}
              onPrint={handlePrint}
              copied={copied}
              fileName={selected ?? "document"}
            />
          </div>
        )}

        {/* History panel */}
        {history.length > 0 && (
          <Card className="mt-6 bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  {hi ? "पहले बनाए गए दस्तावेज़" : "Previously Generated Documents"}
                  <Badge variant="secondary" className="text-xs">{history.length}</Badge>
                </CardTitle>
                <button onClick={() => setShowHistory((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </CardHeader>
            {showHistory && (
              <CardContent className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{entry.type}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(entry.createdAt).toLocaleString(hi ? "hi-IN" : "en-IN")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setGenerated(entry.content)}
                          className="text-xs dark:border-gray-600 dark:text-gray-300">
                          {hi ? "देखें" : "View"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const blob = new Blob([entry.content], { type: "text/plain;charset=utf-8" })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement("a"); a.href = url
                          a.download = `${entry.type.replace(/\s+/g, "_")}.txt`; a.click()
                          URL.revokeObjectURL(url)
                        }} className="text-xs dark:border-gray-600 dark:text-gray-300">
                          <Download className="w-3 h-3 mr-1" />TXT
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{entry.content.slice(0, 150)}…</p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

      </div>
    </div>
  )
}
