"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useTaskContext } from "./task-context"
import { Share2, Copy, Printer, FileText, Check } from "lucide-react"
import { format, parseISO } from "date-fns"

interface TaskSharingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

export function TaskSharingDialog({ open, onOpenChange, taskId }: TaskSharingDialogProps) {
  const { allTasks } = useTaskContext()
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Find the task to share
  const task = allTasks.find((t) => t.id === taskId)

  if (!task) return null

  // Generate plain text version
  const generatePlainText = () => {
    let text = `Task: ${task.content}\n`

    if (task.dueDate) {
      text += `Due Date: ${format(parseISO(task.dueDate), "MMMM d, yyyy")}\n`
    }

    if (task.tags && task.tags.length > 0) {
      text += `Tags: ${task.tags.join(", ")}\n`
    }

    if (task.notes) {
      text += `\nNotes:\n${task.notes}\n`
    }

    return text
  }

  // Generate markdown version
  const generateMarkdown = () => {
    let md = `# ${task.content}\n\n`

    if (task.dueDate) {
      md += `**Due Date:** ${format(parseISO(task.dueDate), "MMMM d, yyyy")}\n\n`
    }

    if (task.tags && task.tags.length > 0) {
      md += `**Tags:** ${task.tags.map((tag) => `\`${tag}\``).join(", ")}\n\n`
    }

    if (task.notes) {
      md += `## Notes\n\n${task.notes}\n`
    }

    return md
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const plainText = generatePlainText()
      printWindow.document.write(`
        <html>
          <head>
            <title>Task: ${task.content}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              h1 { margin-bottom: 10px; }
              .meta { color: #666; margin-bottom: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${task.content}</h1>
            <div class="meta">
              ${task.dueDate ? `Due Date: ${format(parseISO(task.dueDate), "MMMM d, yyyy")}<br>` : ""}
              ${task.tags && task.tags.length > 0 ? `Tags: ${task.tags.join(", ")}` : ""}
            </div>
            ${task.notes ? `<h2>Notes</h2><pre>${task.notes}</pre>` : ""}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Share Task
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="text">Plain Text</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Textarea
              ref={textareaRef}
              value={generatePlainText()}
              readOnly
              className="min-h-[200px] font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="markdown">
            <Textarea value={generateMarkdown()} readOnly className="min-h-[200px] font-mono text-sm" />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopy(textareaRef.current?.value || generatePlainText())}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>

            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
