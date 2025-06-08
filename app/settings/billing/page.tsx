"use client"

import { SettingsPageTitle } from "@/components/settings/settings-page-title"
import { SettingsCard } from "@/components/settings/settings-card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Edit3, PlusCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const invoices = [
  { id: "INV-2024-001", date: "2024-05-15", amount: "$10.00", status: "Paid" },
  { id: "INV-2024-002", date: "2024-04-15", amount: "$10.00", status: "Paid" },
  { id: "INV-2024-003", date: "2024-03-15", amount: "$10.00", status: "Paid" },
]

export default function BillingSettingsPage() {
  const handleUpdatePayment = () => {
    toast({ title: "Update Payment Method", description: "Modal for updating payment would appear here." })
  }

  const handleAddPayment = () => {
    toast({ title: "Add Payment Method", description: "Modal for adding a new payment method would appear here." })
  }

  const handleEditBillingAddress = () => {
    toast({ title: "Edit Billing Address", description: "Modal for editing billing address would appear here." })
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({ title: "Download Invoice", description: `Downloading invoice ${invoiceId}...` })
    // Actual download logic here
  }

  return (
    <div className="space-y-6">
      <SettingsPageTitle title="Billing" description="Manage your payment methods, billing history, and address." />

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Payment Method</SettingsCard.Title>
          <SettingsCard.Description>Your primary payment method.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          <div>
            <p className="font-medium">Visa ending in 1234</p>
            <p className="text-sm text-muted-foreground">Expires 12/2028</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleUpdatePayment}>
              <Edit3 className="mr-2 h-4 w-4" /> Update Payment Method
            </Button>
            <Button variant="outline" onClick={handleAddPayment}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Payment Method
            </Button>
          </div>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Billing History</SettingsCard.Title>
          <SettingsCard.Description>View and download your past invoices.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice.id)}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download Invoice</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Billing Address</SettingsCard.Title>
          <SettingsCard.Description>The address associated with your billing information.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-2">
          <p className="font-medium">John Doe</p>
          <p>123 Main Street</p>
          <p>Anytown, CA 90210</p>
          <p>United States</p>
          <Button variant="outline" className="mt-2" onClick={handleEditBillingAddress}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Billing Address
          </Button>
        </SettingsCard.Content>
      </SettingsCard>
    </div>
  )
}
