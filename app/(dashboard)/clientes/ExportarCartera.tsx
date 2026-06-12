"use client";

import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

type ClienteExport = {
  nombre: string;
  telefono: string | null;
  saldoPesos: number;
  ultimaFecha: string | null;
};

export default function ExportarCartera({ clientes }: { clientes: ClienteExport[] }) {
  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(34, 139, 34);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Cartera de Clientes — Avícola El Trébol", pageWidth / 2, 18, { align: "center" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 38, { align: "center" });

    const tableData = clientes.map((c) => [
      c.nombre,
      c.telefono || "—",
      `$${Math.max(0, c.saldoPesos).toLocaleString("es-CO")}`,
      c.ultimaFecha || "Sin movimientos",
    ]);

    (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
      startY: 44,
      head: [["Nombre", "Teléfono", "Saldo Pendiente", "Última Actividad"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [34, 139, 34], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`cartera_clientes_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const exportExcel = () => {
    const data = clientes.map((c) => ({
      Nombre: c.nombre,
      Teléfono: c.telefono || "",
      "Saldo Pendiente": Math.max(0, c.saldoPesos),
      "Última Actividad": c.ultimaFecha || "Sin movimientos",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cartera");

    // Set column widths
    ws["!cols"] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
    ];

    XLSX.writeFile(wb, `cartera_clientes_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportPDF}>
        <FileDown className="mr-2 h-4 w-4" />
        Exportar PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Exportar Excel
      </Button>
    </div>
  );
}
